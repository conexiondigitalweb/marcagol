import axios from 'axios'

const LEAGUE_ID = import.meta.env.VITE_WORLD_CUP_LEAGUE_ID || 22
const SEASON    = import.meta.env.VITE_WORLD_CUP_SEASON    || 2026
const API_KEY   = import.meta.env.VITE_API_FOOTBALL_KEY
const API_HOST  = import.meta.env.VITE_API_FOOTBALL_HOST || 'api-football-v1.p.rapidapi.com'

const client = axios.create({
  baseURL: `https://${API_HOST}/v3`,
  headers: {
    'X-RapidAPI-Key': API_KEY,
    'X-RapidAPI-Host': API_HOST,
  },
  timeout: 8000,
})

const isConfigured = () => !!API_KEY && API_KEY !== 'your_rapidapi_key_here'

export const apiFootball = {
  async getLiveFixtures() {
    if (!isConfigured()) return null
    const { data } = await client.get('/fixtures', {
      params: { league: LEAGUE_ID, season: SEASON, live: 'all' },
    })
    return data.response
  },

  async getFixtures(params = {}) {
    if (!isConfigured()) return null
    const { data } = await client.get('/fixtures', {
      params: { league: LEAGUE_ID, season: SEASON, ...params },
    })
    return data.response
  },

  async getStandings() {
    if (!isConfigured()) return null
    const { data } = await client.get('/standings', {
      params: { league: LEAGUE_ID, season: SEASON },
    })
    return data.response
  },

  async getTeamStats(teamId) {
    if (!isConfigured()) return null
    const { data } = await client.get('/teams/statistics', {
      params: { league: LEAGUE_ID, season: SEASON, team: teamId },
    })
    return data.response
  },

  async getTopScorers() {
    if (!isConfigured()) return null
    const { data } = await client.get('/players/topscorers', {
      params: { league: LEAGUE_ID, season: SEASON },
    })
    return data.response
  },

  isConfigured,
}

export default apiFootball
