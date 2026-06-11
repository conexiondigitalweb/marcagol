// services/liveService.js — Polling de partidos en vivo para el Dashboard

const LEAGUE_ID = 1
const SEASON = 2026
const POLL_INTERVAL = 30000 // 30 segundos

async function fetchLive() {
  try {
    const qs  = new URLSearchParams({ endpoint: '/fixtures', live: 'all', league: LEAGUE_ID, season: SEASON }).toString()
    const res = await fetch(`/api/football?${qs}`)
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
  const wcStart = new Date('2026-06-11T18:00:00Z')
  if (Date.now() < wcStart.getTime()) return () => {}

  fetchLive().then(onUpdate)
  const interval = setInterval(() => fetchLive().then(onUpdate), POLL_INTERVAL)
  return () => clearInterval(interval)
}
