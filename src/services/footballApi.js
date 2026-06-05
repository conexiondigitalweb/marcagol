import { TEAM_IDS } from '../data/teamIds'

const CREST_BASE = 'https://media.api-sports.io/football/teams'

// Synchronous — returns PNG URL or null (no API call, no auth required)
export function getTeamCrestUrl(teamCode) {
  const id = TEAM_IDS[teamCode]
  return id ? `${CREST_BASE}/${id}.png` : null
}

// Async alias kept for any callers that still await it
export async function getTeamCrest(teamCode) {
  return getTeamCrestUrl(teamCode)
}

export default { getTeamCrestUrl, getTeamCrest }
