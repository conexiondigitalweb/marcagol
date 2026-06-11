const LEAGUE_ID = import.meta.env.VITE_WORLD_CUP_LEAGUE_ID || 22
const SEASON    = import.meta.env.VITE_WORLD_CUP_SEASON    || 2026

async function proxyFetch(endpoint, params = {}) {
  const qs  = new URLSearchParams({ endpoint, ...params }).toString()
  const res = await fetch(`/api/football?${qs}`, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const data = await res.json()
  return data.response
}

export const apiFootball = {
  async getLiveFixtures() {
    return proxyFetch('/fixtures', { league: LEAGUE_ID, season: SEASON, live: 'all' })
  },

  async getFixtures(params = {}) {
    return proxyFetch('/fixtures', { league: LEAGUE_ID, season: SEASON, ...params })
  },

  async getStandings() {
    return proxyFetch('/standings', { league: LEAGUE_ID, season: SEASON })
  },

  async getTeamStats(teamId) {
    return proxyFetch('/teams/statistics', { league: LEAGUE_ID, season: SEASON, team: teamId })
  },

  async getTopScorers() {
    return proxyFetch('/players/topscorers', { league: LEAGUE_ID, season: SEASON })
  },

  async searchPlayer(name, teamId, season = 2025) {
    return proxyFetch('/players', { search: name, team: teamId, season })
  },

  isConfigured: () => true,
}

export default apiFootball
