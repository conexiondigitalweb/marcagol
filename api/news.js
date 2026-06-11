import { rateLimit, getClientIp } from './_rateLimit.js'

const UPSTREAM       = 'https://gnews.io/api/v4'
const CACHE_TTL      = 15 * 60_000   // 15 minutos
const RATE_LIMIT_RPM = 10

const ALLOWED_ENDPOINTS = new Set(['/search', '/top-headlines'])

// In-memory cache: key -> { data, ts }
const cache = new Map()

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

  const { endpoint = '/search', ...params } = req.query
  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return res.status(403).json({ error: 'Endpoint no permitido' })
  }

  const apiKey = process.env.GNEWS_KEY
  if (!apiKey) return res.status(503).json({ error: 'API de noticias no configurada' })

  const qs       = new URLSearchParams({ ...params, apikey: apiKey }).toString()
  const cacheKey = `${endpoint}?${new URLSearchParams(params)}`
  const now      = Date.now()

  const hit = cache.get(cacheKey)
  if (hit && now - hit.ts < CACHE_TTL) {
    res.setHeader('X-Cache', 'HIT')
    res.setHeader('Cache-Control', `public, s-maxage=${Math.floor((CACHE_TTL - (now - hit.ts)) / 1000)}, stale-while-revalidate=60`)
    return res.status(200).json(hit.data)
  }

  try {
    const upstream = await fetch(`${UPSTREAM}${endpoint}?${qs}`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Error GNews: ${upstream.status}` })
    }
    const data = await upstream.json()

    cache.set(cacheKey, { data, ts: now })

    res.setHeader('X-Cache', 'MISS')
    res.setHeader('Cache-Control', `public, s-maxage=${Math.floor(CACHE_TTL / 1000)}, stale-while-revalidate=60`)
    return res.status(200).json(data)
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
