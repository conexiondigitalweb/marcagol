// fixtureMap.js — Mapeo dinámico: match_id (1-104) → API fixture_id
// Fetches once from API-Football, caches 24h en localStorage
import { useState, useEffect } from 'react'
import { TEAM_IDS } from './teamIds'
import { MATCHES } from './matches'

const CACHE_KEY = 'wc2026_fixture_map_v2'
const CACHE_TTL = 2 * 60 * 60 * 1000

// Alias entre códigos de matches.js y claves de TEAM_IDS
const CODE_ALIAS = { RSA: 'ZAF', HAI: 'HTI', PAR: 'PRY' }

function resolveId(code) {
  if (!code || code === 'TBD') return null
  return TEAM_IDS[CODE_ALIAS[code] ?? code] ?? null
}

let _map        = null
let _inverseMap = null
let _promise    = null

// Devuelve true si el mapa cacheado omite algún partido que ahora es resolvible.
// Cubre dos casos:
//   1. partido con equipos TBD que ya se definieron en matches.js
//   2. partido con fixtureId hardcodeado en matches.js que no está en el mapa
function hasResolvableGaps(map) {
  for (const m of MATCHES) {
    if (m.fixtureId && !map[m.id]) return true
    if (resolveId(m.homeTeam) && resolveId(m.awayTeam) && !map[m.id]) return true
  }
  return false
}

async function fetchAndBuild() {
  // Cache localStorage (2h) + invalidación si hay equipos TBD que ya se definieron
  try {
    const stored = localStorage.getItem(CACHE_KEY)
    if (stored) {
      const { map, ts } = JSON.parse(stored)
      if (Date.now() - ts < CACHE_TTL && !hasResolvableGaps(map)) return map
    }
  } catch {}

  const res = await fetch('/api/football?endpoint=/fixtures&league=1&season=2026')
  const json = await res.json()

  // Índice por homeId-awayId (par único en el mundial)
  const idx = {}
  for (const f of json.response || []) {
    idx[`${f.teams.home.id}-${f.teams.away.id}`] = f.fixture.id
  }

  const map = {}
  for (const m of MATCHES) {
    // Prioridad 1: fixtureId hardcodeado en matches.js (R32+ con TBD equipos)
    if (m.fixtureId) { map[m.id] = m.fixtureId; continue }
    // Prioridad 2: lookup dinámico por par de equipos (fase de grupos)
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
    _promise = fetchAndBuild().then(m => { _map = m; _inverseMap = null; return m })
  }
  return _promise
}

// Lookup síncrono: apiFixtureId → appMatchId (1-104), o null si el mapa aún no
// está cargado o el partido no pertenece al Mundial 2026.
// El mapa inverso se construye una sola vez y se reutiliza.
export function getAppMatchId(apiFixtureId) {
  if (!_map) return null
  if (!_inverseMap) {
    _inverseMap = {}
    for (const [appId, apiId] of Object.entries(_map)) {
      _inverseMap[apiId] = Number(appId)
    }
  }
  return _inverseMap[apiFixtureId] ?? null
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
