import { rateLimit, getClientIp } from './_rateLimit.js'

const RATE_LIMIT_RPM = 20

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Method not allowed' })

  // Rate limiting
  const ip = getClientIp(req)
  const { limited, remaining, resetIn } = rateLimit(ip, RATE_LIMIT_RPM)
  res.setHeader('X-RateLimit-Limit',     RATE_LIMIT_RPM)
  res.setHeader('X-RateLimit-Remaining', remaining)
  if (limited) {
    res.setHeader('Retry-After', resetIn)
    return res.status(429).json({ error: `Demasiadas solicitudes. Intenta de nuevo en ${resetIn}s.` })
  }

  const { name, teamId, season = '2025' } = req.query
  if (!name || !teamId) return res.status(400).json({ error: 'name y teamId requeridos' })

  // Validar que teamId sea numérico y season razonable
  if (!/^\d+$/.test(teamId) || !/^\d{4}$/.test(season)) {
    return res.status(400).json({ error: 'Parámetros inválidos' })
  }

  const key = process.env.VITE_API_FOOTBALL_KEY
  if (!key) return res.status(503).json({ error: 'API no configurada' })

  const url = `https://v3.football.api-sports.io/players?search=${encodeURIComponent(name)}&team=${encodeURIComponent(teamId)}&season=${encodeURIComponent(season)}`

  try {
    const upstream = await fetch(url, { headers: { 'x-apisports-key': key } })
    const data = await upstream.json()

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=21600')
    return res.status(200).json(data.response ?? [])
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
