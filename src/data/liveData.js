// liveData.js — Motor de datos en vivo para marcagol.live
// API-Football v3 — Plan Starter
// Doiler Sanjuan — Mundial 2026

const LEAGUE_ID = 1 // FIFA World Cup 2026
const SEASON = 2026

// ─── Cache simple en memoria para no desperdiciar requests ────────────────────
const cache = new Map()
const CACHE_TTL = {
  live:       30 * 1000,
  fixtures:   5 * 60 * 1000,
  standings:  10 * 60 * 1000,
  scorers:    10 * 60 * 1000,
  events:     30 * 1000,
  lineups:    30 * 1000,
  statistics: 60 * 1000,
}

async function fetchAPI(endpoint, params = {}, ttlKey = 'fixtures') {
  const cacheKey = `${endpoint}?${new URLSearchParams(params)}`
  const now = Date.now()

  if (cache.has(cacheKey)) {
    const { data, ts } = cache.get(cacheKey)
    if (now - ts < CACHE_TTL[ttlKey]) return data
  }

  try {
    const proxyQs = new URLSearchParams({ endpoint, ...params }).toString()
    const res = await fetch(`/api/football?${proxyQs}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    cache.set(cacheKey, { data: json.response, ts: now })
    return json.response
  } catch (err) {
    console.error(`[liveData] Error en ${endpoint}:`, err.message)
    return null
  }
}

// ─── 1. PARTIDOS EN VIVO ──────────────────────────────────────────────────────
export async function getLiveMatches() {
  return fetchAPI('/fixtures', { live: 'all', league: LEAGUE_ID, season: SEASON }, 'live')
}

// ─── 2. PARTIDOS DEL DÍA ─────────────────────────────────────────────────────
export async function getTodayMatches() {
  const today = new Date().toISOString().split('T')[0]
  return fetchAPI('/fixtures', { date: today, league: LEAGUE_ID, season: SEASON }, 'fixtures')
}

// ─── 3. FIXTURE COMPLETO DEL MUNDIAL ─────────────────────────────────────────
export async function getAllFixtures() {
  return fetchAPI('/fixtures', { league: LEAGUE_ID, season: SEASON }, 'fixtures')
}

// ─── 4. DETALLE DE UN PARTIDO (eventos, estadísticas, alineaciones) ───────────
export async function getMatchDetail(fixtureId) {
  // Partidos finalizados: caché permanente en localStorage (sin TTL)
  const FT_KEY = `wc2026_ft_detail_v1_${fixtureId}`
  try {
    const cached = localStorage.getItem(FT_KEY)
    if (cached) return JSON.parse(cached)
  } catch {}

  const [events, stats, lineups] = await Promise.all([
    fetchAPI('/fixtures/events',     { fixture: fixtureId }, 'events'),
    fetchAPI('/fixtures/statistics', { fixture: fixtureId }, 'statistics'),
    fetchAPI('/fixtures/lineups',    { fixture: fixtureId }, 'lineups'),
  ])
  return { events, stats, lineups }
}

// ─── 4b. FIXTURE INDIVIDUAL (para estado/marcador en vivo) ────────────────────
export async function getFixture(fixtureId) {
  const data = await fetchAPI('/fixtures', { id: fixtureId }, 'events')  // 30s TTL
  return Array.isArray(data) ? (data[0] ?? null) : null
}

// ─── 5. TABLAS DE POSICIONES ──────────────────────────────────────────────────
export async function getStandings() {
  return fetchAPI('/standings', { league: LEAGUE_ID, season: SEASON }, 'standings')
}

// ─── 6. GOLEADORES ───────────────────────────────────────────────────────────
export async function getTopScorers() {
  return fetchAPI('/players/topscorers', { league: LEAGUE_ID, season: SEASON }, 'scorers')
}

// ─── 7. ASISTIDORES ──────────────────────────────────────────────────────────
export async function getTopAssists() {
  return fetchAPI('/players/topassists', { league: LEAGUE_ID, season: SEASON }, 'scorers')
}

// ─── 8. ESTADÍSTICAS DE UN EQUIPO ────────────────────────────────────────────
export async function getTeamStats(teamId) {
  return fetchAPI('/teams/statistics', {
    team: teamId, league: LEAGUE_ID, season: SEASON
  }, 'statistics')
}

// ─── 9. JUGADORES DE UN EQUIPO ───────────────────────────────────────────────
export async function getSquad(teamId) {
  return fetchAPI('/players/squads', { team: teamId }, 'lineups')
}

// ─── 10. PERFIL DE UN JUGADOR ────────────────────────────────────────────────
export async function getPlayerStats(playerId) {
  return fetchAPI('/players', {
    id: playerId, league: LEAGUE_ID, season: SEASON
  }, 'lineups')
}

// ─── HELPERS DE FORMATO ──────────────────────────────────────────────────────

// Convierte hora UTC de API-Football a hora local del usuario
export function toLocalTime(utcDate) {
  if (!utcDate) return '--:--'
  try {
    const d = new Date(utcDate)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return d.toLocaleTimeString('es-CO', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz
    })
  } catch { return '--:--' }
}

// Convierte fecha UTC a fecha local
export function toLocalDate(utcDate) {
  if (!utcDate) return ''
  try {
    const d = new Date(utcDate)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return d.toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: tz
    })
  } catch { return '' }
}

// Estado del partido en español
export function getMatchStatus(fixture) {
  const s = fixture?.status?.short
  const map = {
    'TBD': 'Por definir', 'NS': 'Próximo', 'LIVE': 'En vivo',
    '1H': '1er Tiempo', 'HT': 'Descanso', '2H': '2do Tiempo',
    'ET': 'Prórroga', 'BT': 'Descanso prórroga', 'P': 'Penales',
    'SUSP': 'Suspendido', 'INT': 'Interrumpido', 'FT': 'Final',
    'AET': 'Final (prórroga)', 'PEN': 'Final (penales)',
    'ABD': 'Abandonado', 'AWD': 'Victoria técnica', 'WO': 'Walkover',
  }
  return map[s] || s || 'Próximo'
}

// Tipo de evento en español con ícono
export function getEventIcon(type, detail) {
  if (type === 'Goal') {
    if (detail?.includes('Missed Penalty'))    return { icon: '❌', label: 'Penal fallado' }
    if (detail?.includes('Own Goal'))          return { icon: '⚽', label: 'Gol en contra' }
    if (detail?.includes('Penalty'))           return { icon: '⚽', label: 'Penal convertido' }
    if (detail?.includes('Direct Free-kick') || detail?.includes('Free Kick'))
                                               return { icon: '⚽', label: 'Tiro libre directo' }
    if ((detail || '').toLowerCase().includes('olympic'))
                                               return { icon: '⚽', label: 'Gol olímpico' }
    return { icon: '⚽', label: 'Gol' }
  }
  if (type === 'Card') {
    const d = detail || ''
    if (d.includes('Yellow Red') || d.includes('Second Yellow')) return { icon: '🟥', label: 'Doble amarilla / Expulsión' }
    if (d.includes('Yellow')) return { icon: '🟨', label: 'Tarjeta amarilla' }
    if (d.includes('Red'))    return { icon: '🟥', label: 'Tarjeta roja' }
    return { icon: '🃏', label: 'Tarjeta' }
  }
  if (type === 'subst') return { icon: '🔄', label: 'Sustitución' }
  if (type === 'Var') {
    const d = (detail || '').toLowerCase()
    if (d.includes('disallowed') || d.includes('anulado'))   return { icon: '❌', label: 'Gol anulado por VAR' }
    if (d.includes('confirmed') || d.includes('confirmado')) return { icon: '✅', label: 'Gol confirmado por VAR' }
    if (d.includes('card'))    return { icon: '📺', label: 'Tarjeta revisada por VAR' }
    if (d.includes('penalty')) return { icon: '📺', label: 'Penalti revisado por VAR' }
    return { icon: '📺', label: 'Revisión VAR' }
  }
  if (type === 'Corner')       return { icon: '🏁', label: 'Tiro de esquina' }
  if (type === 'Shot on Goal') return { icon: '🎯', label: 'Tiro al arco' }
  if (type === 'Miss') {
    const d = (detail || '').toLowerCase()
    return { icon: '🎯', label: d.includes('post') || d.includes('bar') ? 'Disparo al palo' : 'Disparo desviado' }
  }
  if (type === 'Penalty')      return { icon: '🥊', label: 'Penalti señalado' }
  return { icon: '·', label: type }
}

// Limpiar cache (llamar cuando se cambia de partido)
export function clearCache() { cache.clear() }
