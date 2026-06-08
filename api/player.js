export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Method not allowed' })

  const { name, teamId, season = '2025' } = req.query
  if (!name || !teamId) return res.status(400).json({ error: 'name y teamId requeridos' })

  const key = process.env.VITE_API_FOOTBALL_KEY
  if (!key) return res.status(503).json({ error: 'API no configurada' })

  const url = `https://v3.football.api-sports.io/players?search=${encodeURIComponent(name)}&team=${encodeURIComponent(teamId)}&season=${encodeURIComponent(season)}`

  try {
    const upstream = await fetch(url, { headers: { 'x-apisports-key': key } })
    const data = await upstream.json()

    // Cachear en CDN 1 hora; revalidar en background hasta 6 h
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=21600')
    return res.status(200).json(data.response ?? [])
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
