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
    if (FINISHED_STATUSES.has(status))      return 86_400  // 24h — resultado inmutable
    return 60
  }

  // Standings: más frecuente si hay un partido en vivo
  if (endpoint === '/standings') return hasActiveLive() ? 60 : 300

  // Goleadores y asistidores cambian poco
  if (endpoint === '/players/topscorers' || endpoint === '/players/topassists') return 600

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
