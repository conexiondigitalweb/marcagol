import { kv } from '@vercel/kv'
import { rateLimit, getClientIp } from './_rateLimit.js'

const UPSTREAM       = 'https://v3.football.api-sports.io'
const RATE_LIMIT_RPM = 30
const KV_PREFIX      = 'fb:'   // namespace en KV para evitar colisiones

const LIVE_STATUSES     = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'PEN'])
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN'])

const ALLOWED_ENDPOINTS = new Set([
  '/fixtures',
  '/fixtures/events',
  '/fixtures/statistics',
  '/fixtures/lineups',
  '/fixtures/players',
  '/standings',
  '/players/topscorers',
  '/players/topassists',
  '/players',
  '/players/squads',
  '/teams/statistics',
])

// ── L1: caché en memoria (por instancia, sub-segundo) ────────────────────────
const memCache  = new Map()
let lastLiveTs  = 0

function hasActiveLive() { return Date.now() - lastLiveTs < 5 * 60_000 }

// KV disponible solo si las variables de entorno están presentes
function kvReady() { return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) }

// ── TTL en segundos (se usa para KV; ×1000 para memoria) ────────────────────
function ttlSecondsFor(endpoint, params, data = null) {
  // Fixtures en vivo (live=all)
  if ('live' in params) return 20

  // Eventos minuto a minuto: caché corta para máxima frescura
  if (endpoint === '/fixtures/events') return 10

  // Estadísticas del partido
  if (endpoint === '/fixtures/statistics') return 60

  // Alineaciones: sin datos → no cachear; con datos → 30s
  if (endpoint === '/fixtures/lineups') {
    if (data === null) return 30          // pre-fetch: TTL conservador
    return data?.response?.length > 0 ? 30 : 0
  }

  // Partido individual: TTL según estado del fixture
  if (endpoint === '/fixtures' && params.id) {
    if (data === null) return 30
    const status = data?.response?.[0]?.fixture?.status?.short
    if (LIVE_STATUSES.has(status))          return 20
    if (FINISHED_STATUSES.has(status))      return 7_200   // 2h — tiempo suficiente para confirmar resultado
    return 60
  }

  // Fixtures por fecha: TTL corto para el día actual (detectar FT a tiempo)
  if (endpoint === '/fixtures' && params.date && !params.id) {
    const hoyCol = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
    if (params.date === hoyCol) return 60       // hoy: refresca cada minuto
    if (params.date < hoyCol)   return 86_400   // pasado: inmutable
    return 300                                  // futuro: TTL normal
  }

  // Standings: más frecuente si hay un partido en vivo
  if (endpoint === '/standings') return hasActiveLive() ? 60 : 300

  // Goleadores y asistidores: TTL corto para reflejar cambios rápidamente
  if (endpoint === '/players/topscorers' || endpoint === '/players/topassists') return 120

  // Default
  return 300
}

// ── KV helpers ───────────────────────────────────────────────────────────────
async function kvGet(key) {
  if (!kvReady()) return null
  try { return await kv.get(KV_PREFIX + key) } catch { return null }
}

async function kvSet(key, value, ttlSeconds) {
  if (!kvReady() || ttlSeconds <= 0) return
  try { await kv.set(KV_PREFIX + key, value, { ex: ttlSeconds }) } catch {}
}

async function kvDel(key) {
  if (!kvReady()) return
  try { await kv.del(KV_PREFIX + key) } catch {}
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Method not allowed' })

  const ip = getClientIp(req)
  const { limited, remaining, resetIn } = rateLimit(ip, RATE_LIMIT_RPM)
  res.setHeader('X-RateLimit-Limit',     RATE_LIMIT_RPM)
  res.setHeader('X-RateLimit-Remaining', remaining)
  if (limited) {
    res.setHeader('Retry-After', resetIn)
    return res.status(429).json({ error: `Demasiadas solicitudes. Intenta de nuevo en ${resetIn}s.` })
  }

  // ── action=fixtures-status: estado de varios fixtures en una sola llamada ──
  if (req.query.action === 'fixtures-status') {
    const rawIds = req.query.ids || ''
    const ids = rawIds.split(',').map(s => s.trim()).filter(Boolean)
    if (!ids.length) return res.status(400).json({ error: 'ids requerido' })

    const cacheKey = `fixtures-status:${[...ids].sort().join(',')}`
    const now = Date.now()

    const memHit = memCache.get(cacheKey)
    if (memHit && now - memHit.ts < memHit.ttlMs) {
      res.setHeader('X-Cache', 'HIT-MEM')
      return res.status(200).json(memHit.data)
    }
    const kvHit = await kvGet(cacheKey)
    if (kvHit) {
      memCache.set(cacheKey, { data: kvHit, ts: now, ttlMs: 30_000 })
      res.setHeader('X-Cache', 'HIT-KV')
      return res.status(200).json(kvHit)
    }

    const apiKey = process.env.API_FOOTBALL_KEY || process.env.VITE_API_FOOTBALL_KEY
    if (!apiKey) return res.status(503).json({ error: 'API no configurada' })

    try {
      const upstream = await fetch(`${UPSTREAM}/fixtures?ids=${ids.join('-')}`, {
        headers: { 'x-apisports-key': apiKey },
        signal: AbortSignal.timeout(10_000),
      })
      if (!upstream.ok) return res.status(upstream.status).json({ error: `Error upstream: ${upstream.status}` })

      const data = await upstream.json()
      const result = {}
      for (const f of data.response || []) {
        result[String(f.fixture.id)] = f.fixture.status.short
      }

      memCache.set(cacheKey, { data: result, ts: now, ttlMs: 60_000 })
      kvSet(cacheKey, result, 60)
      return res.status(200).json(result)
    } catch (err) {
      return res.status(502).json({ error: err.message })
    }
  }

  // ── action=estadisticas-mundial ────────────────────────────────────────────
  if (req.query.action === 'estadisticas-mundial') {
    // v5: lotes de 5 fixtures para evitar rate limiting en Promise.all paralelo
    const cacheKey = 'estadisticas-mundial:2026:v5'
    const now = Date.now()

    const memHit = memCache.get(cacheKey)
    if (memHit && now - memHit.ts < memHit.ttlMs) {
      res.setHeader('X-Cache', 'HIT-MEM')
      return res.status(200).json(memHit.data)
    }
    const kvHit = await kvGet(cacheKey)
    if (kvHit) {
      memCache.set(cacheKey, { data: kvHit, ts: now, ttlMs: 300_000 })
      res.setHeader('X-Cache', 'HIT-KV')
      return res.status(200).json(kvHit)
    }

    const apiKey = process.env.API_FOOTBALL_KEY || process.env.VITE_API_FOOTBALL_KEY
    if (!apiKey) return res.status(503).json({ error: 'API no configurada' })

    try {
      const upstream = await fetch(`${UPSTREAM}/fixtures?league=1&season=2026&status=FT`, {
        headers: { 'x-apisports-key': apiKey },
        signal: AbortSignal.timeout(15_000),
      })
      if (!upstream.ok) return res.status(upstream.status).json({ error: `Error upstream: ${upstream.status}` })

      const data = await upstream.json()
      const fixtures = data.response || []
      const totalPartidos = fixtures.length

      const empty = {
        totalPartidos: 0, totalGoles: 0, promedioPorPartido: '0.00',
        partidosSinGoles: 0, autogoles: 0,
        equipoMasGoleador: null, equipoMasGoleado: null,
        marcadorMasRepetido: null,
      }

      if (totalPartidos === 0) {
        memCache.set(cacheKey, { data: empty, ts: now, ttlMs: 60_000 })
        kvSet(cacheKey, empty, 60)
        return res.status(200).json(empty)
      }

      let totalGoles = 0, partidosSinGoles = 0
      const golesFavor   = {}
      const golesContra  = {}
      const marcadores   = {}

      for (const f of fixtures) {
        const hg = f.goals?.home ?? 0
        const ag = f.goals?.away ?? 0
        totalGoles += hg + ag
        if (hg === 0 && ag === 0) partidosSinGoles++

        const score = `${hg}-${ag}`
        marcadores[score] = (marcadores[score] || 0) + 1

        const homeId   = f.teams?.home?.id
        const homeName = f.teams?.home?.name
        const awayId   = f.teams?.away?.id
        const awayName = f.teams?.away?.name

        if (homeId) {
          if (!golesFavor[homeId])  golesFavor[homeId]  = { name: homeName, goles: 0 }
          if (!golesContra[homeId]) golesContra[homeId] = { name: homeName, goles: 0 }
          golesFavor[homeId].goles  += hg
          golesContra[homeId].goles += ag
        }
        if (awayId) {
          if (!golesFavor[awayId])  golesFavor[awayId]  = { name: awayName, goles: 0 }
          if (!golesContra[awayId]) golesContra[awayId] = { name: awayName, goles: 0 }
          golesFavor[awayId].goles  += ag
          golesContra[awayId].goles += hg
        }
      }

      const allMaxBy = (obj, key) => {
        const vals = Object.values(obj).map(v => v[key])
        if (!vals.length) return []
        const max = Math.max(...vals)
        return Object.entries(obj)
          .filter(([, info]) => info[key] === max)
          .map(([id, info]) => ({ id: Number(id), name: info.name, goles: info[key] }))
      }

      const maxMarcador = Object.entries(marcadores).reduce((best, [score, veces]) =>
        !best || veces > best.veces ? { score, veces } : best, null)

      // Autogoles + tarjetas: consultar eventos de cada fixture
      // Bypass KV si el partido terminó hace <2h (eventos pueden estar incompletos)
      const TWO_HOURS_MS = 2 * 60 * 60 * 1000
      // Grupos: kickoff + 105min (90 + ~15 descuentos)
      // Eliminatorios (AET/PEN): kickoff + 150min (90 + 30 ET + 15 penales + descuentos)
      const estimatedEnd = (f) => {
        const kickoff = new Date(f.fixture.date).getTime()
        const isKnockout = ['AET', 'PEN'].includes(f.fixture?.status?.short)
        return kickoff + (isKnockout ? 150 : 105) * 60 * 1000
      }

      // Procesa fixtures en lotes para no saturar el rate limit de API-Football
      async function fetchInBatches(items, batchSize, delayMs, fetchFn) {
        const results = []
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize)
          const batchResults = await Promise.all(batch.map(fetchFn))
          results.push(...batchResults)
          if (i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, delayMs))
          }
        }
        return results
      }

      let autogoles = 0
      let tarjetasAmarillas = 0
      let tarjetasRojas = 0

      await fetchInBatches(fixtures, 5, 300, async (f) => {
        const fid = f.fixture.id
        const eventsKey = `/fixtures/events?fixture=${fid}`
        const recentFT = (now - estimatedEnd(f)) < TWO_HOURS_MS
        let eventsData = recentFT ? null : await kvGet(eventsKey)

        // Caché sospechoso para partido FT antiguo: <10 eventos (capturado en vivo incompleto)
        if (!recentFT && eventsData && (eventsData.response?.length ?? 0) < 10) {
          await kvDel(eventsKey)
          eventsData = null
        }

        if (!eventsData) {
          try {
            const r = await fetch(`${UPSTREAM}/fixtures/events?fixture=${fid}`, {
              headers: { 'x-apisports-key': apiKey },
              signal: AbortSignal.timeout(8_000),
            })
            if (r.ok) {
              const fetched = await r.json()
              if (fetched.response?.length > 0) {
                kvSet(eventsKey, fetched, 300)
                eventsData = fetched
              }
            }
          } catch {}
        }

        if (eventsData?.response) {
          for (const ev of eventsData.response) {
            if (ev.type === 'Goal' && ev.detail === 'Own Goal') autogoles++
            if (ev.type === 'Card') {
              if (ev.detail === 'Yellow Card') tarjetasAmarillas++
              else if (ev.detail === 'Red Card' || ev.detail === 'Second Yellow Card') tarjetasRojas++
            }
          }
        }
      })

      const result = {
        totalPartidos,
        totalGoles,
        promedioPorPartido: (totalGoles / totalPartidos).toFixed(2),
        partidosSinGoles,
        autogoles,
        tarjetasAmarillas,
        tarjetasRojas,
        masGoleador:         allMaxBy(golesFavor, 'goles'),
        masGoleado:          allMaxBy(golesContra, 'goles'),
        marcadorMasRepetido: maxMarcador,
      }

      memCache.set(cacheKey, { data: result, ts: now, ttlMs: 300_000 })
      kvSet(cacheKey, result, 300)
      return res.status(200).json(result)
    } catch (err) {
      return res.status(502).json({ error: err.message })
    }
  }

  const { endpoint, ...params } = req.query
  if (!endpoint || typeof endpoint !== 'string' || !endpoint.startsWith('/')) {
    return res.status(400).json({ error: 'Falta el parámetro endpoint (ej: /fixtures)' })
  }
  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return res.status(403).json({ error: 'Endpoint no permitido' })
  }

  const qs       = new URLSearchParams(params).toString()
  const cacheKey = `${endpoint}?${qs}`
  const now      = Date.now()

  // ── L1 HIT: memoria ───────────────────────────────────────────────────────
  const memHit = memCache.get(cacheKey)
  if (memHit && now - memHit.ts < memHit.ttlMs) {
    const remainingSecs = Math.ceil((memHit.ttlMs - (now - memHit.ts)) / 1000)
    res.setHeader('X-Cache', 'HIT-MEM')
    res.setHeader('Cache-Control', `public, s-maxage=${remainingSecs}, stale-while-revalidate=5`)
    return res.status(200).json(memHit.data)
  }

  // ── L2 HIT: KV ────────────────────────────────────────────────────────────
  const kvHit = await kvGet(cacheKey)
  if (kvHit) {
    // Rellenar L1 con TTL corto (los datos vienen "calientes" desde KV)
    const kvTtl = ttlSecondsFor(endpoint, params)   // aproximado, sin datos
    memCache.set(cacheKey, { data: kvHit, ts: now, ttlMs: Math.min(kvTtl, 15) * 1000 })
    res.setHeader('X-Cache', 'HIT-KV')
    res.setHeader('Cache-Control', `public, s-maxage=${Math.min(kvTtl, 15)}, stale-while-revalidate=5`)
    return res.status(200).json(kvHit)
  }

  // ── MISS: llamar a API-Football ───────────────────────────────────────────
  const apiKey = process.env.API_FOOTBALL_KEY || process.env.VITE_API_FOOTBALL_KEY
  if (!apiKey) return res.status(503).json({ error: 'API no configurada' })

  const upstreamUrl = `${UPSTREAM}${endpoint}${qs ? '?' + qs : ''}`

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { 'x-apisports-key': apiKey },
      signal:  AbortSignal.timeout(10_000),
    })
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Error upstream: ${upstream.status}` })
    }
    const data = await upstream.json()

    // Actualizar timestamp para standings dinámicos
    if ('live' in params && Array.isArray(data.response) && data.response.length > 0) {
      lastLiveTs = Date.now()
    }

    // TTL final (conocemos el contenido de la respuesta)
    const ttlSeconds = ttlSecondsFor(endpoint, params, data)
    const ttlMs      = ttlSeconds * 1000

    // Guardar en L1 (memoria) y L2 (KV) en paralelo
    if (ttlSeconds > 0) {
      memCache.set(cacheKey, { data, ts: Date.now(), ttlMs })
      kvSet(cacheKey, data, ttlSeconds)   // fire-and-forget, no bloquea la respuesta
    }

    res.setHeader('X-Cache', 'MISS')
    res.setHeader(
      'Cache-Control',
      ttlSeconds > 0
        ? `public, s-maxage=${ttlSeconds}, stale-while-revalidate=5`
        : 'no-store'
    )
    return res.status(200).json(data)
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
