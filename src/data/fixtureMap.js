// fixtureMap.js — Mapeo dinámico: match_id (1-104) → API fixture_id
// Fetches once from API-Football, caches 24h en localStorage
import { useState, useEffect } from 'react'
import { TEAM_IDS } from './teamIds'
import { MATCHES } from './matches'

const API_KEY   = '217e3ccfd4e714fba62caf18ed3ef01d'
const CACHE_KEY = 'wc2026_fixture_map_v1'
const CACHE_TTL = 24 * 60 * 60 * 1000

// Alias entre códigos de matches.js y claves de TEAM_IDS
const CODE_ALIAS = { RSA: 'ZAF', HAI: 'HTI', PAR: 'PRY' }

function resolveId(code) {
  if (!code || code === 'TBD') return null
  return TEAM_IDS[CODE_ALIAS[code] ?? code] ?? null
}

let _map     = null
let _promise = null

async function fetchAndBuild() {
  // Cache localStorage (24h)
  try {
    const stored = localStorage.getItem(CACHE_KEY)
    if (stored) {
      const { map, ts } = JSON.parse(stored)
      if (Date.now() - ts < CACHE_TTL) return map
    }
  } catch {}

  const res = await fetch('https://v3.api-football.com/fixtures?league=1&season=2026', {
    headers: { 'x-apisports-key': API_KEY },
  })
  const json = await res.json()

  // Índice por homeId-awayId (par único en el mundial)
  const idx = {}
  for (const f of json.response || []) {
    idx[`${f.teams.home.id}-${f.teams.away.id}`] = f.fixture.id
  }

  const map = {}
  for (const m of MATCHES) {
    const hId = resolveId(m.homeTeam)
    const aId = resolveId(m.awayTeam)
    if (!hId || !aId) continue
    const fid = idx[`${hId}-${aId}`]
    if (fid) map[m.id] = fid
  }

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ map, ts: Date.now() }))
  } catch {}

  return map
}

export function getFixtureMap() {
  if (_map) return Promise.resolve(_map)
  if (!_promise) {
    _promise = fetchAndBuild().then(m => { _map = m; return m })
  }
  return _promise
}

// Hook React: devuelve el API fixture_id para un match app id (1-104)
// Devuelve null mientras carga, null si no se encuentra
export function useFixtureId(matchId) {
  const [fixtureId, setFixtureId] = useState(null)
  useEffect(() => {
    if (matchId == null) return
    getFixtureMap()
      .then(map => setFixtureId(map[Number(matchId)] ?? null))
      .catch(() => setFixtureId(null))
  }, [matchId])
  return fixtureId
}
