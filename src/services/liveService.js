// services/liveData.js — Polling de partidos en vivo para el Dashboard
// Conecta con API-Football v3

const API_KEY = '217e3ccfd4e714fba62caf18ed3ef01d'
const LEAGUE_ID = 1
const SEASON = 2026
const POLL_INTERVAL = 30000 // 30 segundos

function buildUrl(params) {
  const url = new URL('https://v3.api-football.com/fixtures')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return url.toString()
}

async function fetchLive() {
  try {
    const res = await fetch(
      buildUrl({ live: 'all', league: LEAGUE_ID, season: SEASON }),
      { headers: { 'x-apisports-key': API_KEY } }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.response || []).map(f => ({
      id:         f.fixture?.id,
      homeTeam:   f.teams?.home?.name,
      awayTeam:   f.teams?.away?.name,
      homeLogo:   f.teams?.home?.logo,
      awayLogo:   f.teams?.away?.logo,
      homeScore:  f.goals?.home,
      awayScore:  f.goals?.away,
      minute:     f.fixture?.status?.elapsed,
      status:     f.fixture?.status?.short,
      venue:      f.fixture?.venue?.name,
      city:       f.fixture?.venue?.city,
    }))
  } catch {
    return []
  }
}

export function startLivePolling(onUpdate) {
  // Solo activar si el Mundial ya comenzó
  const wcStart = new Date('2026-06-11T18:00:00Z')
  if (Date.now() < wcStart.getTime()) return () => {}

  // Primera llamada inmediata
  fetchLive().then(onUpdate)

  // Polling cada 30 segundos
  const interval = setInterval(() => fetchLive().then(onUpdate), POLL_INTERVAL)

  // Retorna función de limpieza
  return () => clearInterval(interval)
}
