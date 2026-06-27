import { useState, useEffect } from 'react'

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 h

function cacheKey(teamId, name) {
  return `marcagol_player_${teamId}_${name.toLowerCase().replace(/\s+/g, '_')}`
}

function toTitleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// "MARTINEZ Lautaro" → "Martinez"
function extractSearchName(rawName) {
  return toTitleCase(rawName.trim().split(/\s+/)[0])
}

function seasonLabel(season) {
  return `${season}/${String(season + 1).slice(2)}`
}

function appearances(results) {
  return results?.[0]?.statistics?.[0]?.games?.appearences ?? 0
}

async function searchPlayer(name, teamId, season) {
  const params = new URLSearchParams({ name, teamId, season })
  const res = await fetch(`/api/player?${params}`)
  if (!res.ok) return []
  return res.json()
}

async function fetchWithFallback(searchName, teamId) {
  const r2025 = await searchPlayer(searchName, teamId, 2025)
  const apps2025 = appearances(r2025)

  if (apps2025 > 5) return { results: r2025, season: 2025 }

  const r2026 = await searchPlayer(searchName, teamId, 2026)
  const apps2026 = appearances(r2026)

  if (apps2026 >= apps2025 && apps2026 > 0) return { results: r2026, season: 2026 }
  if (apps2025 > 0)                          return { results: r2025, season: 2025 }
  return { results: null, season: null }
}

export function usePlayerData(rawName, teamId) {
  const [state, setState] = useState({ photo: null, stats: null, season: null, playerId: null, loading: false, notFound: false })

  useEffect(() => {
    if (!rawName || !teamId) return

    const searchName = extractSearchName(rawName)
    const key = cacheKey(teamId, searchName)

    // Cache hit
    try {
      const cached = JSON.parse(localStorage.getItem(key))
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setState({ photo: cached.photo, stats: cached.stats, season: cached.season, playerId: cached.playerId ?? null, loading: false, notFound: cached.notFound })
        return
      }
    } catch { /* localStorage unavailable */ }

    setState({ photo: null, stats: null, season: null, loading: true, notFound: false })

    fetchWithFallback(searchName, teamId)
      .then(({ results, season }) => {
        if (!results?.length) {
          const payload = { photo: null, stats: null, season: null, notFound: true }
          try { localStorage.setItem(key, JSON.stringify({ ...payload, ts: Date.now() })) } catch {}
          setState({ ...payload, loading: false })
          return
        }

        const { player, statistics } = results[0]
        const photo    = player?.photo   || null
        const stats    = statistics?.[0] || null
        const playerId = player?.id      || null
        const label    = season ? seasonLabel(season) : null
        const payload  = { photo, stats, season: label, playerId, notFound: false }
        try { localStorage.setItem(key, JSON.stringify({ ...payload, ts: Date.now() })) } catch {}
        setState({ ...payload, loading: false })
      })
      .catch(() => {
        setState({ photo: null, stats: null, season: null, loading: false, notFound: false })
      })
  }, [rawName, teamId])

  return state
}
