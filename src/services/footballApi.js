const BASE_URL = 'https://v3.football.api-sports.io'
const API_KEY  = import.meta.env.VITE_API_FOOTBALL_KEY

const headers = {
  'x-apisports-key': API_KEY,
}

const CACHE_PREFIX = 'marcagol_crest_'
const CACHE_TTL    = 7 * 24 * 60 * 60 * 1000 // 7 days

function getCached(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const { value, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_PREFIX + key); return null }
    return value
  } catch { return null }
}

function setCache(key, value) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ value, ts: Date.now() }))
  } catch {}
}

export async function getTeamCrest(teamCode, teamName) {
  if (!API_KEY) return null
  const cached = getCached(teamCode)
  if (cached !== null) return cached

  try {
    const res = await fetch(
      `${BASE_URL}/teams?search=${encodeURIComponent(teamName)}`,
      { headers }
    )
    if (!res.ok) throw new Error(res.status)
    const data = await res.json()
    const logo = data.response?.[0]?.team?.logo ?? null
    setCache(teamCode, logo)
    return logo
  } catch {
    setCache(teamCode, null)
    return null
  }
}

export default { getTeamCrest }
