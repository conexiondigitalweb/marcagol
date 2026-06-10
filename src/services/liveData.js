const BASE_URL = 'https://v3.football.api-sports.io'
const API_KEY  = import.meta.env.VITE_API_FOOTBALL_KEY
const LEAGUE_ID = 1   // FIFA World Cup 2026
const SEASON    = 2026

// Primer partido del Mundial: MEX vs ZAF, 2026-06-11T19:00:00Z (Estadio Azteca)
// Fallback pre-Mundial se desactiva a partir de las 18:00 UTC (1h de margen)
const WORLD_CUP_START_MS = new Date('2026-06-11T18:00:00Z').getTime()

const headers = { 'x-apisports-key': API_KEY }

const LIVE_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'PEN'])

// Normalize API fixture to a shape compatible with our match cards
function normalizeFixture(f) {
  return {
    id:        f.fixture.id,
    homeTeam:  f.teams.home.name,
    awayTeam:  f.teams.away.name,
    homeLogo:  f.teams.home.logo,
    awayLogo:  f.teams.away.logo,
    homeScore: f.goals.home,
    awayScore: f.goals.away,
    minute:    f.fixture.status.elapsed,
    status:    f.fixture.status.short,
    venue:     f.fixture.venue?.name || '',
    city:      f.fixture.venue?.city || '',
    date:      f.fixture.date,
    group:     null,
    matchday:  null,
  }
}

async function apiFetch(path) {
  if (!API_KEY) return null
  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export async function getLiveMatches() {
  try {
    // Buscar partidos del Mundial en vivo
    const data = await apiFetch(`/fixtures?live=all&league=${LEAGUE_ID}&season=${SEASON}`)
    const wcMatches = (data?.response || [])
      .filter(f => LIVE_STATUSES.has(f.fixture.status.short))
      .map(normalizeFixture)

    if (wcMatches.length > 0) return wcMatches

    // A partir del inicio del Mundial el fallback queda desactivado
    if (Date.now() >= WORLD_CUP_START_MS) return []

    // TEMPORAL: fallback a cualquier partido en vivo para pruebas pre-Mundial
    const all = await apiFetch(`/fixtures?live=all`)
    return (all?.response || [])
      .filter(f => LIVE_STATUSES.has(f.fixture.status.short))
      .map(normalizeFixture)
  } catch {
    return []
  }
}

export async function getStandings(group) {
  try {
    const data = await apiFetch(`/standings?league=${LEAGUE_ID}&season=${SEASON}`)
    if (!data) return []
    const allStandings = data.response?.[0]?.league?.standings || []
    if (!group) return allStandings.flat()
    const groupStandings = allStandings.find(s => s[0]?.group?.includes(group))
    return groupStandings || []
  } catch {
    return []
  }
}

export async function getTopScorers() {
  try {
    const data = await apiFetch(`/players/topscorers?league=${LEAGUE_ID}&season=${SEASON}`)
    if (!data) return []
    return (data.response || []).slice(0, 10).map(entry => ({
      name:   entry.player.name,
      team:   entry.statistics[0]?.team?.name || '',
      goals:  entry.statistics[0]?.goals?.total || 0,
      photo:  entry.player.photo,
      flag:   entry.statistics[0]?.team?.logo || null,
    }))
  } catch {
    return []
  }
}

// Sets up polling. Returns cleanup function.
// onData(matches) is called immediately and every 60s while live matches exist.
export function startLivePolling(onData) {
  let timer = null
  let active = true

  async function tick() {
    if (!active) return
    const matches = await getLiveMatches()
    if (!active) return
    onData(matches)
    // Keep polling if matches are live, otherwise slow to 5 min
    const delay = matches.length > 0 ? 60_000 : 300_000
    timer = setTimeout(tick, delay)
  }

  tick()
  return () => {
    active = false
    if (timer) clearTimeout(timer)
  }
}
