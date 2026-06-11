import { rateLimit, getClientIp } from './_rateLimit.js'

const UPSTREAM      = 'https://v3.football.api-sports.io'
const RATE_LIMIT_RPM = 30

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

// In-memory cache: cacheKey -> { data, ts, ttl }
const cache = new Map()
// Timestamp of the last live fixtures response that contained active matches
let lastLiveTs = 0

function hasActiveLive() {
  return Date.now() - lastLiveTs < 5 * 60_000
}

function ttlFor(endpoint, params) {
  if ('live' in params) return 25_000

  if (endpoint === '/fixtures' && params.id) {
    // TTL decided after we have the data — see post-fetch logic below
    return null // sentinel: compute after fetch
  }

  if (endpoint === '/standings') {
    return hasActiveLive() ? 60_000 : 5 * 60_000
  }

  return 5 * 60_000
}

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

  const qs        = new URLSearchParams(params).toString()
  const cacheKey  = `${endpoint}?${qs}`
  const now       = Date.now()

  const hit = cache.get(cacheKey)
  if (hit && now - hit.ts < hit.ttl) {
    const remainingTtl = Math.ceil((hit.ttl - (now - hit.ts)) / 1000)
    res.setHeader('X-Cache', 'HIT')
    res.setHeader('Cache-Control', `public, s-maxage=${remainingTtl}, stale-while-revalidate=10`)
    return res.status(200).json(hit.data)
  }

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

    // Track live matches for dynamic standings TTL
    if ('live' in params && Array.isArray(data.response) && data.response.length > 0) {
      lastLiveTs = Date.now()
    }

    // Compute final TTL (fixtures/id depends on match status from response)
    let ttl = ttlFor(endpoint, params)
    if (ttl === null) {
      const status = data?.response?.[0]?.fixture?.status?.short
      if (LIVE_STATUSES.has(status))     ttl = 25_000
      else if (FINISHED_STATUSES.has(status)) ttl = 24 * 3600_000
      else                               ttl = 60_000
    }

    cache.set(cacheKey, { data, ts: Date.now(), ttl })

    res.setHeader('X-Cache', 'MISS')
    res.setHeader('Cache-Control', `public, s-maxage=${Math.floor(ttl / 1000)}, stale-while-revalidate=10`)
    return res.status(200).json(data)
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
