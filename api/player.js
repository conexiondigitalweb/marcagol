import { kv } from '@vercel/kv'
import { rateLimit, getClientIp } from './_rateLimit.js'

const RATE_LIMIT_RPM = 20
const UPSTREAM = 'https://v3.football.api-sports.io'
const KV_PREFIX = 'fb:'

async function kvGet(key) {
  try { return await kv.get(KV_PREFIX + key) } catch { return null }
}
async function kvSet(key, value, ttl) {
  try { await kv.set(KV_PREFIX + key, value, { ex: ttl }) } catch {}
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

  const apiKey = process.env.API_FOOTBALL_KEY || process.env.VITE_API_FOOTBALL_KEY
  if (!apiKey) return res.status(503).json({ error: 'API no configurada' })

  // ── action=mundial: estadísticas del jugador en el Mundial 2026 ──────────
  // Paso 1: /players/squads → player.id por dorsal (dorsales son fijos en el torneo)
  // Paso 2: /players?id&league=1&season=2026 → stats del Mundial
  if (req.query.action === 'mundial') {
    const { teamId, number } = req.query
    if (!teamId || !/^\d+$/.test(teamId)) {
      return res.status(400).json({ error: 'teamId numérico requerido' })
    }
    if (!number || !/^\d+$/.test(number)) {
      return res.status(400).json({ error: 'number numérico requerido' })
    }
    const num = parseInt(number, 10)

    // ── Paso 1: resolver player.id desde el squad ─────────────────────────
    const squadKey = `wc2026_squad_${teamId}`
    let squad = await kvGet(squadKey)
    if (!squad) {
      try {
        const r = await fetch(
          `${UPSTREAM}/players/squads?team=${teamId}`,
          { headers: { 'x-apisports-key': apiKey }, signal: AbortSignal.timeout(8_000) }
        )
        const data = await r.json()
        squad = data.response?.[0]?.players ?? []
        if (squad.length > 0) kvSet(squadKey, squad, 3600) // dorsales fijos — 1 hora
      } catch (err) {
        return res.status(502).json({ error: `squad fetch: ${err.message}` })
      }
    }

    const squadPlayer = squad.find(p => p.number === num)
    if (!squadPlayer) {
      return res.status(200).json({ found: false, statistics: null, playerInfo: null })
    }
    const playerId = squadPlayer.id

    // ── Paso 2: stats del Mundial con el player.id ────────────────────────
    const statsKey = `wc2026_player_mundial_${playerId}`
    let statsEntry = await kvGet(statsKey)
    if (!statsEntry) {
      try {
        const r = await fetch(
          `${UPSTREAM}/players?id=${playerId}&league=1&season=2026`,
          { headers: { 'x-apisports-key': apiKey }, signal: AbortSignal.timeout(8_000) }
        )
        const data = await r.json()
        statsEntry = data.response?.[0] ?? null
        if (statsEntry) kvSet(statsKey, statsEntry, 300) // stats cambian con cada partido
      } catch (err) {
        return res.status(502).json({ error: `stats fetch: ${err.message}` })
      }
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60')
    return res.status(200).json({
      found: true,
      statistics: statsEntry?.statistics?.[0] ?? null,
      playerInfo: statsEntry?.player ?? squadPlayer,
    })
  }

  // ── búsqueda por nombre+equipo (comportamiento original) ─────────────────
  const { name, teamId, season = '2025' } = req.query
  if (!name || !teamId) return res.status(400).json({ error: 'name y teamId requeridos' })
  if (!/^\d+$/.test(teamId) || !/^\d{4}$/.test(season)) {
    return res.status(400).json({ error: 'Parámetros inválidos' })
  }

  const url = `${UPSTREAM}/players?search=${encodeURIComponent(name)}&team=${encodeURIComponent(teamId)}&season=${encodeURIComponent(season)}`

  try {
    const upstream = await fetch(url, {
      headers: { 'x-apisports-key': apiKey },
      signal: AbortSignal.timeout(8_000),
    })
    const data = await upstream.json()
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=21600')
    return res.status(200).json(data.response ?? [])
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
