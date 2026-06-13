// MatchDetail.jsx — Página de detalle de un partido
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MATCHES } from '../data/matches'
import { VENUES_BY_NAME } from '../data/venues'
import { getBroadcasts } from '../data/broadcasts'
import MatchAI from '../components/ui/MatchAI'
import { useMatchDetail, useFixtureData } from '../hooks/useLiveData'
import { useFixtureId, getFixtureMap, getAppMatchId } from '../data/fixtureMap'
import { getEventIcon } from '../data/liveData'
import { getKickoffDate, getKickoffCountdown } from '../utils/helpers'
import { saveResult } from '../data/matchResults'
import Flag from '../components/ui/Flag'
import { GROUPS } from '../data/groups'
import { TEAM_IDS } from '../data/teamIds'
import { esTeamName } from '../data/teamNames'

const MD_CODE_ALIAS = { RSA: 'ZAF', HAI: 'HTI', PAR: 'PRY' }

const ALL_TEAMS = Object.fromEntries(
  GROUPS.flatMap(g => g.teams.map(t => [t.code, t]))
)


function toLocal(date, timeET) {
  if (!timeET) return { time: '--:--', tz: '' }
  try {
    const d = new Date(`${date}T${timeET.slice(0,5)}:00-04:00`)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const time = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz })
    const tzAbbr = d.toLocaleTimeString('en', { timeZoneName: 'short', timeZone: tz }).split(' ').pop()
    return { time, tz: tzAbbr }
  } catch { return { time: timeET, tz: 'ET' } }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  } catch { return dateStr }
}

// ─── Banner countdown (≤3h antes del kickoff) ─────────────────────────────────
function MatchCountdownBanner({ match, isStarted }) {
  const [cd, setCd]           = useState(() => isStarted ? null : getKickoffCountdown(match.date, match.time))
  const [imminent, setImminent] = useState(false)

  useEffect(() => {
    if (isStarted) { setCd(null); setImminent(false); return }
    const id = setInterval(() => {
      const newCd = getKickoffCountdown(match.date, match.time)
      setCd(newCd)
      if (!newCd) {
        const kickoff = getKickoffDate(match.date, match.time)
        const elapsed = kickoff ? Date.now() - kickoff.getTime() : -1
        setImminent(elapsed >= 0 && elapsed < 5 * 60_000)
      } else {
        setImminent(false)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [match.date, match.time, isStarted])

  if (isStarted) return null

  if (imminent) {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-xl px-5 py-3.5 border border-orange-500/40 bg-orange-500/10">
        <span className="text-orange-400 text-lg animate-pulse">⚡</span>
        <span className="font-bold text-orange-300 text-sm">El partido está por comenzar</span>
      </div>
    )
  }

  if (!cd) return null

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl px-5 py-3.5 border border-sky-500/30 bg-sky-500/10">
      <span className="text-sky-400">⏱️</span>
      <span className="font-semibold text-sky-300 text-sm">El partido inicia en</span>
      <span className="font-black text-white tabular-nums text-xl tracking-tight">
        {String(cd.hh).padStart(2, '0')}:{String(cd.mm).padStart(2, '0')}:{String(cd.ss).padStart(2, '0')}
      </span>
    </div>
  )
}

// ─── Header del partido ───────────────────────────────────────────────────────
function MatchHeader({ match, liveData }) {
  const home = ALL_TEAMS[match.homeTeam]
  const away = ALL_TEAMS[match.awayTeam]
  const venue = VENUES_BY_NAME[match.venue]
  const { time, tz } = toLocal(match.date, match.time)
  const isLive = liveData && ['1H','HT','2H','ET','PEN','LIVE'].includes(liveData.status)
  const isFinished = liveData && ['FT','AET','PEN'].includes(liveData.status)

  const { channels: colChannels, abiertosPorConfirmar } = getBroadcasts(match.id)

  return (
    <div className="card overflow-hidden mb-6">
      <div className="relative p-6" style={{
        background: 'linear-gradient(135deg, #0F2442 0%, #162032 100%)',
        borderBottom: '1px solid rgba(56,189,248,0.15)'
      }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
            Grupo {match.group} · Jornada {match.matchday} · Copa Mundial 2026
          </span>
          {isLive && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"/>
              <span className="text-xs font-bold text-red-400">EN VIVO</span>
            </span>
          )}
          {isFinished && (
            <span className="px-3 py-1 rounded-full bg-slate-700 text-xs text-slate-400 font-semibold">
              Finalizado
            </span>
          )}
          {!isLive && !isFinished && (
            <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-xs text-orange-400 font-semibold">
              Próximo
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <img
              src={`https://flagcdn.com/w80/${home?.iso2?.toLowerCase()}.png`}
              alt={home?.name}
              className="w-12 h-9 sm:w-16 sm:h-12 object-cover rounded-lg shadow-lg"
              onError={e => e.target.style.display='none'}
            />
            <Link to={`/equipos/${match.homeTeam}`} className="text-white font-black text-center text-sm sm:text-lg hover:text-sky-400 transition-colors leading-tight">
              {home?.name || match.homeTeam}
            </Link>
            <span className="text-xs text-slate-500">#{home?.fifaRanking} FIFA</span>
          </div>

          <div className="text-center flex-shrink-0">
            {(isLive || isFinished) && liveData ? (
              <div>
                <div className={`text-3xl sm:text-5xl font-black tabular-nums ${isLive ? 'text-sky-400' : 'text-white'}`}>
                  {liveData.homeScore ?? 0} – {liveData.awayScore ?? 0}
                </div>
                {isLive && (
                  liveData.status === 'HT'
                    ? <div className="text-orange-400 text-sm font-bold mt-1">Descanso</div>
                    : liveData.minute != null && (
                        <div className="text-red-400 text-sm font-bold mt-1">
                          {liveData.minute}{liveData.extra ? `+${liveData.extra}` : ''}'
                        </div>
                      )
                )}
                {isFinished && <div className="text-slate-500 text-xs mt-1">Final</div>}
              </div>
            ) : (
              <div>
                <div className="text-2xl sm:text-4xl font-black text-orange-400">{time}</div>
                <div className="text-xs text-slate-500 mt-1">{tz}</div>
                <div className="text-xs text-slate-600 mt-1 hidden sm:block">{formatDate(match.date)}</div>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <img
              src={`https://flagcdn.com/w80/${away?.iso2?.toLowerCase()}.png`}
              alt={away?.name}
              className="w-12 h-9 sm:w-16 sm:h-12 object-cover rounded-lg shadow-lg"
              onError={e => e.target.style.display='none'}
            />
            <Link to={`/equipos/${match.awayTeam}`} className="text-white font-black text-center text-sm sm:text-lg hover:text-sky-400 transition-colors leading-tight">
              {away?.name || match.awayTeam}
            </Link>
            <span className="text-xs text-slate-500">#{away?.fifaRanking} FIFA</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-700/50">
        <div className="p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">🏟️ Estadio</p>
          <p className="text-sm font-semibold text-white truncate">{match.venue}</p>
          <p className="text-xs text-slate-500">{match.city}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">👥 Capacidad</p>
          <p className="text-sm font-semibold text-white">
            {venue?.capacity ? venue.capacity.toLocaleString() : '—'}
          </p>
          <p className="text-xs text-slate-500">{match.country === 'USA' ? '🇺🇸' : match.country === 'MEX' ? '🇲🇽' : '🇨🇦'} {match.country}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">📺 Ver en Colombia</p>
          <div className="flex flex-wrap justify-center gap-1">
            {colChannels.map(ch => (
              <span
                key={ch.name}
                className={`text-xs px-2 py-0.5 rounded-full border ${ch.color}`}
              >
                {ch.name}
              </span>
            ))}
            {abiertosPorConfirmar && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                Señal abierta por confirmar
              </span>
            )}
          </div>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">🟨 Árbitro</p>
          <p className="text-sm font-semibold text-white">
            {liveData?.referee || 'Por confirmar'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Hook: todos los datos de un partido externo (no-WC) ─────────────────────
// Polling diferenciado: marcador 30s · eventos 20s · stats 60s · lineups 5min
function useExternalMatchData(fixtureId, enabled) {
  const [fixture, setFixture] = useState(null)
  const [events,  setEvents]  = useState([])
  const [stats,   setStats]   = useState([])
  const [lineups, setLineups] = useState([])
  const [loading, setLoading] = useState(enabled)
  const statusRef = useRef(null)

  useEffect(() => {
    if (!enabled || !fixtureId) return
    let alive = true

    const STOP = new Set(['HT', 'FT', 'AET', 'PEN'])
    const done = () => !alive || STOP.has(statusRef.current)

    async function apiFetch(path) {
      const [endpoint, qs] = path.split('?')
      const params = Object.fromEntries(new URLSearchParams(qs || ''))
      const proxyQs = new URLSearchParams({ endpoint, ...params }).toString()
      const r = await fetch(`/api/football?${proxyQs}`, { signal: AbortSignal.timeout(8000) })
      const data = await r.json()
      return data.response ?? []
    }

    async function pollFixture() {
      try {
        const data = await apiFetch(`/fixtures?id=${fixtureId}`)
        if (!alive) return
        const f = data[0] ?? null
        setFixture(f)
        setLoading(false)
        statusRef.current = f?.fixture?.status?.short ?? null
      } catch { if (alive) setLoading(false) }
      if (!done()) setTimeout(pollFixture, 30000)
    }

    async function pollEvents() {
      try {
        const data = await apiFetch(`/fixtures/events?fixture=${fixtureId}`)
        if (alive && data.length) setEvents(data)
      } catch {}
      if (!done()) setTimeout(pollEvents, 10000)
    }

    async function pollStats() {
      try {
        const data = await apiFetch(`/fixtures/statistics?fixture=${fixtureId}`)
        if (alive && data.length) setStats(data)
      } catch {}
      if (!done()) setTimeout(pollStats, 60000)
    }

    async function pollLineups() {
      try {
        const data = await apiFetch(`/fixtures/lineups?fixture=${fixtureId}`)
        if (alive && data.length) setLineups(data)
      } catch {}
      if (!done()) setTimeout(pollLineups, 5 * 60 * 1000)
    }

    pollFixture()
    pollEvents()
    pollStats()
    pollLineups()

    return () => { alive = false }
  }, [fixtureId, enabled])

  return { fixture, events, stats, lineups, loading }
}

// ─── Header para partidos externos ───────────────────────────────────────────
function ExternalMatchHeader({ f }) {
  const { teams, goals, fixture, league } = f
  const isLive     = ['1H','2H','HT','ET','BT','PEN'].includes(fixture.status.short)
  const isFinished = ['FT','AET','PEN'].includes(fixture.status.short)
  const localTime  = new Date(fixture.date).toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  })

  return (
    <div className="card overflow-hidden mb-6">
      <div className="relative p-6" style={{
        background: 'linear-gradient(135deg, #0F2442 0%, #162032 100%)',
        borderBottom: '1px solid rgba(56,189,248,0.15)',
      }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate max-w-[180px]">
            {league?.name || 'Partido en vivo'}{league?.round ? ` · ${league.round}` : ''}
          </span>
          {isLive && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"/>
              <span className="text-xs font-bold text-red-400">
                EN VIVO · {fixture.status.short === 'HT' ? 'Descanso' : `${fixture.status.elapsed}${fixture.status.extra ? `+${fixture.status.extra}` : ''}'`}
              </span>
            </span>
          )}
          {isFinished && (
            <span className="px-3 py-1 rounded-full bg-slate-700 text-xs text-slate-400 font-semibold">Finalizado</span>
          )}
          {!isLive && !isFinished && (
            <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-xs text-orange-400 font-semibold">Próximo</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <img src={teams.home.logo} alt={teams.home.name} className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
            <span className="text-white font-black text-center text-sm sm:text-base leading-tight">{esTeamName(teams.home)}</span>
          </div>
          <div className="text-center flex-shrink-0">
            {(isLive || isFinished) ? (
              <div>
                <div className={`text-3xl sm:text-5xl font-black tabular-nums ${isLive ? 'text-sky-400' : 'text-white'}`}>
                  {goals.home ?? 0} – {goals.away ?? 0}
                </div>
                {isFinished && <div className="text-slate-500 text-xs mt-1">Final</div>}
              </div>
            ) : (
              <div className="text-2xl font-black text-orange-400">{localTime}</div>
            )}
          </div>
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <img src={teams.away.logo} alt={teams.away.name} className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
            <span className="text-white font-black text-center text-sm sm:text-base leading-tight">{esTeamName(teams.away)}</span>
          </div>
        </div>
      </div>

      {(fixture.venue?.name || fixture.referee) && (
        <div className={`grid divide-x divide-slate-700/50 ${fixture.venue?.name && fixture.referee ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {fixture.venue?.name && (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">🏟️ Estadio</p>
              <p className="text-sm font-semibold text-white truncate">{fixture.venue.name}</p>
              {fixture.venue.city && <p className="text-xs text-slate-500">{fixture.venue.city}</p>}
            </div>
          )}
          {fixture.referee && (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">🟨 Árbitro</p>
              <p className="text-sm font-semibold text-white">{fixture.referee}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Detección de goles anulados ─────────────────────────────────────────────
function markDisallowedGoals(events, fixture) {
  if (!events?.length || !fixture) return events

  const homeId = fixture.teams?.home?.id
  const awayId = fixture.teams?.away?.id
  const actualHome = fixture.goals?.home ?? 0
  const actualAway = fixture.goals?.away ?? 0

  const isHomeScore = (e) =>
    e.type === 'Goal' && e.detail !== 'Missed Penalty' &&
    ((e.team?.id === homeId && e.detail !== 'Own Goal') ||
     (e.team?.id === awayId && e.detail === 'Own Goal'))
  const isAwayScore = (e) =>
    e.type === 'Goal' && e.detail !== 'Missed Penalty' &&
    ((e.team?.id === awayId && e.detail !== 'Own Goal') ||
     (e.team?.id === homeId && e.detail === 'Own Goal'))

  const homeIdxs = events.reduce((a, e, i) => { if (isHomeScore(e)) a.push(i); return a }, [])
  const awayIdxs = events.reduce((a, e, i) => { if (isAwayScore(e)) a.push(i); return a }, [])
  const homeExcess = homeIdxs.length - actualHome
  const awayExcess = awayIdxs.length - actualAway

  const varDisallowed = events
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.type === 'Var' && (e.detail || '').toLowerCase().includes('disallowed'))

  if (varDisallowed.length === 0 && homeExcess <= 0 && awayExcess <= 0) return events

  const disallowed = new Set()

  for (const { e: varEvt } of varDisallowed) {
    const allGoalIdxs = [...homeIdxs, ...awayIdxs]
    const candidates = allGoalIdxs
      .filter(i => !disallowed.has(i) && events[i].team?.id === varEvt.team?.id)
      .filter(i => {
        const diff = (varEvt.time?.elapsed ?? 0) - (events[i].time?.elapsed ?? 0)
        return diff >= 0 && diff <= 5
      })
      .sort((a, b) =>
        Math.abs((varEvt.time?.elapsed ?? 0) - (events[a].time?.elapsed ?? 0)) -
        Math.abs((varEvt.time?.elapsed ?? 0) - (events[b].time?.elapsed ?? 0))
      )
    if (candidates.length) disallowed.add(candidates[0])
  }

  const markExcess = (idxs, excess) => {
    const candidates = [...idxs].filter(i => !disallowed.has(i)).reverse()
    for (let n = 0; n < excess && n < candidates.length; n++) disallowed.add(candidates[n])
  }
  if (homeExcess > 0) markExcess(homeIdxs, homeExcess)
  if (awayExcess > 0) markExcess(awayIdxs, awayExcess)

  if (!disallowed.size) return events
  return events.map((e, i) => disallowed.has(i) ? { ...e, _disallowed: true } : e)
}

// Tipos siempre visibles en partidos finalizados; el resto solo en vivo
const ALWAYS_SHOW_TYPES = new Set(['Goal', 'Card', 'subst', 'Var'])

// Penaltis, tiros libres directos y goles olímpicos no llevan asistencia oficial
const NO_ASSIST_DETAILS = ['Penalty', 'Missed Penalty', 'Direct Free-kick', 'Free Kick', 'Own Goal', 'Olympic']
const shouldShowAssist = (event) =>
  event.type === 'Goal' &&
  !!event.assist?.name &&
  !NO_ASSIST_DETAILS.some(d => (event.detail || '').includes(d))

// ─── Sustituciones + expulsiones: cruzar eventos con alineaciones ────────────
// API-Football: event.assist.name = quien entra · event.player.name = quien sale

// Normaliza nombre para comparación: minúsculas + sin diacríticos
function normName(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function fmtMin(time) {
  return `${time?.elapsed ?? ''}${time?.extra ? `+${time.extra}` : ''}`
}

function buildSubstMap(events, teamId = null) {
  const entered = {}, exited = {}, expelled = {}, yellowed = {}
  const secondYellows = new Set()
  for (const e of events || []) {
    if (teamId !== null && e.team?.id !== teamId) continue
    if (e.type === 'subst') {
      const label = fmtMin(e.time)
      // player.number es null en /fixtures/events — player.id es el campo confiable
      if (e.player?.id != null) exited[e.player.id]   = label
      else if (e.player?.name)  exited[e.player.name] = label
      if (e.assist?.id != null) entered[e.assist.id]   = label
      else if (e.assist?.name)  entered[e.assist.name] = label
    }
    if (e.type === 'Card') {
      const d = e.detail || ''
      if (d.includes('Red Card') || d.includes('Second Yellow') || d.includes('Yellow Red')) {
        const label = fmtMin(e.time)
        if (e.player?.id != null) {
          expelled[e.player.id] = label
          if (d.includes('Second Yellow') || d.includes('Yellow Red')) secondYellows.add(e.player.id)
        } else if (e.player?.name) {
          expelled[e.player.name] = label
          if (d.includes('Second Yellow') || d.includes('Yellow Red')) secondYellows.add(e.player.name)
        }
      } else if (d === 'Yellow Card') {
        if (e.player?.id != null) yellowed[e.player.id] = (yellowed[e.player.id] || 0) + 1
        else if (e.player?.name)  yellowed[e.player.name] = (yellowed[e.player.name] || 0) + 1
      }
    }
  }
  return { entered, exited, expelled, yellowed, secondYellows }
}

// Goles y asistencias por player.id — para indicadores en alineaciones
function buildStatsMap(events) {
  const goals = {}, assists = {}
  for (const e of events || []) {
    if (e.type !== 'Goal' || e.detail === 'Missed Penalty') continue
    if (e.player?.id != null) goals[e.player.id] = (goals[e.player.id] || 0) + 1
    if (e.detail !== 'Own Goal' && e.assist?.id != null) {
      assists[e.assist.id] = (assists[e.assist.id] || 0) + 1
    }
  }
  return { goals, assists }
}

// Busca un nombre en el mapa con matching robusto y detección de ambigüedad.
// Estrategias en orden de confianza; las dos primeras retornan inmediatamente.
// Las demás acumulan un score y el ganador único se devuelve al final.
function lookupSubst(playerName, map) {
  if (!playerName) return undefined

  const norm      = normName(playerName)
  const normParts = norm.split(/\s+/)
  const entries   = Object.entries(map)
  const scored    = []

  for (const [rawKey, val] of entries) {
    const nKey = normName(rawKey)

    // 1. Exacto normalizado (diacríticos ya resueltos por normName)
    if (nKey === norm) return val

    // 2. Lineup → formato abreviado del evento: "Victor Backman" → "v. backman"
    if (normParts.length > 1) {
      const abbr = `${normParts[0][0]}. ${normParts.slice(1).join(' ')}`
      if (nKey === abbr) return val
    }

    // 3. Evento en formato "X. Apellido(s)": extraer initial + tokens de apellido
    //    y cruzar contra los tokens del nombre completo del lineup.
    //    La inicial DEBE coincidir para evitar falsos positivos entre equipos.
    if (/^[a-z]\. /.test(nKey)) {
      const evtInitial      = nKey[0]
      const evtSurnameParts = nKey.slice(3).split(/\s+/)
      const initialOk       = normParts[0]?.[0] === evtInitial
      const shared          = evtSurnameParts.filter(t => normParts.includes(t))
      if (initialOk && shared.length > 0) {
        scored.push({ val, score: 1 + shared.length })
      }
    } else {
      // 4. Evento con nombre completo: fallback por último token (apellido)
      const evtLast    = nKey.split(/\s+/).pop()
      const lineupLast = normParts[normParts.length - 1]
      if (evtLast && evtLast.length > 2 && evtLast === lineupLast) {
        scored.push({ val, score: 1 })
      }
    }
  }

  if (scored.length === 0) return undefined
  scored.sort((a, b) => b.score - a.score)

  // Ambigüedad: dos candidatos con el mismo score → no aplicar match
  if (scored.length > 1 && scored[0].score === scored[1].score) {
    console.warn(`[lookupSubst] Ambiguous match for "${playerName}" — skipped`)
    return undefined
  }

  return scored[0].val
}

// ─── StatItem (para modal de jugador) ────────────────────────────────────────
function StatItem({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-700/30 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-white font-medium text-sm">{value ?? '—'}</span>
    </div>
  )
}

// ─── Modal de jugador ─────────────────────────────────────────────────────────
function PlayerModal({ player, team, teamCode, fixturePlayersData, loading, onClose }) {
  const teamStats = fixturePlayersData?.find(td => td.team?.id === team?.id)
  const pdata     = teamStats?.players?.find(p =>
    p.player?.id === player.player?.id || p.player?.name === player.player?.name
  )
  const s       = pdata?.statistics?.[0]
  const photo   = pdata?.player?.photo
  const minutes = s?.games?.minutes

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="card max-w-sm w-full overflow-hidden"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 sticky top-0"
          style={{ backgroundColor: '#162032' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {team?.logo && <img src={team.logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />}
            <span className="font-bold text-white text-sm truncate">{player.player?.name}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white ml-2 flex-shrink-0 text-lg leading-none">✕</button>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-4 mb-5">
            {photo ? (
              <img
                src={photo} alt=""
                className="w-16 h-16 rounded-full object-cover bg-slate-700 flex-shrink-0"
                onError={e => { e.target.style.display = 'none' }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-2xl">👤</div>
            )}
            <div className="min-w-0">
              <p className="text-white font-bold truncate">{player.player?.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400">#{player.player?.number}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{player.player?.pos}</span>
              </div>
              {s?.games?.rating && (
                <p className="mt-1.5 text-xs">
                  <span className="text-slate-500">Rating: </span>
                  <span className="font-bold text-amber-400">{parseFloat(s.games.rating).toFixed(1)}</span>
                </p>
              )}
            </div>
          </div>

          {loading && <p className="text-center text-slate-500 text-sm py-6">Cargando estadísticas…</p>}

          {!loading && minutes > 0 && (
            <div className="mb-4">
              <StatItem label="Minutos jugados" value={minutes} />
              <StatItem label="Goles" value={s.goals?.total ?? 0} />
              <StatItem label="Asistencias" value={s.goals?.assists ?? 0} />
              <StatItem label="Tiros / al arco" value={`${s.shots?.total ?? 0} / ${s.shots?.on ?? 0}`} />
              <StatItem label="Pases / precisión" value={`${s.passes?.total ?? 0} / ${s.passes?.accuracy ?? 0}%`} />
              <StatItem label="Duelos ganados" value={`${s.duels?.won ?? 0}/${s.duels?.total ?? 0}`} />
              <StatItem label="Regates exitosos" value={s.dribbles?.success ?? 0} />
              {(s.cards?.yellow > 0 || s.cards?.red > 0) && (
                <StatItem label="Tarjetas" value={`${s.cards?.yellow ?? 0}🟨  ${s.cards?.red ?? 0}🟥`} />
              )}
            </div>
          )}

          {!loading && !(minutes > 0) && (
            <p className="text-center text-slate-500 text-sm py-4">
              {pdata ? 'No entró al partido.' : 'Sin estadísticas disponibles.'}
            </p>
          )}

          {teamCode && (
            <Link
              to={`/jugador/${teamCode}/${player.player?.number}`}
              onClick={onClose}
              className="mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-700/50 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-all w-full"
            >
              Ver perfil completo →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tarjeta de alineación con sustituciones y clic en jugador ────────────────
function LineupTeamCard({ team, substMap, statsMap, onPlayerClick, teamCode }) {
  const { entered, exited, expelled, yellowed = {}, secondYellows = new Set() } = substMap
  const { goals: goalsMap = {}, assists: assistsMap = {} } = statsMap ?? {}

  // Número de camiseta → más consistente entre /lineups y /events que el nombre
  const getExited         = (p) => exited[p.player?.id]   ?? lookupSubst(p.player?.name, exited)
  const getExpelled       = (p) => expelled[p.player?.id] ?? lookupSubst(p.player?.name, expelled)
  const getEntered        = (p) => (p.player?.id != null ? entered[p.player.id] : undefined) ?? lookupSubst(p.player?.name, entered)
  const getYellowed       = (p) => yellowed[p.player?.id] ?? lookupSubst(p.player?.name, yellowed) ?? 0
  const checkSecondYellow = (p) => {
    const id = p.player?.id
    return id != null ? secondYellows.has(id) : (p.player?.name ? secondYellows.has(p.player.name) : false)
  }

  const startXIOut   = (team.startXI ?? []).filter(p => getExited(p) || getExpelled(p)).length
  const subsIn       = (team.substitutes ?? []).filter(p => getEntered(p)).length
  const subsExpelled = (team.substitutes ?? []).filter(p => getEntered(p) && getExpelled(p)).length
  const activeCount  = (team.startXI?.length ?? 0) - startXIOut + subsIn - subsExpelled
  const matchingOk   = activeCount <= 11
  if (!matchingOk) {
    console.error(`[LineupTeamCard] ${team.team?.name}: ${activeCount} activos (esperado ≤ 11), omitiendo indicadores`)
  }

  const PlayerIcons = ({ p }) => {
    const g = goalsMap[p.player?.id] ?? 0
    const a = assistsMap[p.player?.id] ?? 0
    const expelMin = matchingOk && getExpelled(p)
    const yCount = (!expelMin && matchingOk) ? getYellowed(p) : 0
    if (!g && !a && !yCount) return null
    return (
      <span className="flex items-center gap-0.5 flex-shrink-0">
        {g > 0 && <span className="text-[10px] leading-none">{'⚽'.repeat(Math.min(g, 3))}</span>}
        {a > 0 && <span className="text-[10px] leading-none">{'👟'.repeat(Math.min(a, 2))}</span>}
        {yCount > 0 && <span className="text-[10px] leading-none">{'🟨'.repeat(Math.min(yCount, 2))}</span>}
      </span>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-3" style={{ backgroundColor: '#162032' }}>
        <img src={team.team?.logo} alt="" width={24} height={24} className="object-contain" />
        <span className="font-bold text-white text-sm">{esTeamName(team.team)}</span>
        <span className="text-xs text-slate-500 ml-auto">{team.formation}</span>
      </div>

      <div className="divide-y divide-slate-700/20">
        {team.startXI?.map((p, j) => {
          const exitMin  = matchingOk && getExited(p)
          const expelMin = matchingOk && getExpelled(p)
          const isOut    = exitMin || expelMin
          return (
            <button
              key={j}
              onClick={() => onPlayerClick(p, team.team, teamCode ?? null)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-700/20 transition-colors ${isOut ? 'opacity-50' : ''}`}
            >
              <span className="w-6 text-center text-xs font-bold text-sky-400 flex-shrink-0">{p.player?.number}</span>
              <div className="flex-1 min-w-0 flex items-center gap-1 overflow-hidden">
                <span className={`text-sm truncate ${expelMin ? 'line-through text-slate-500' : exitMin ? 'text-slate-500' : 'text-white'}`}>
                  {p.player?.name}
                </span>
                <PlayerIcons p={p} />
              </div>
              {expelMin
                ? <span className="text-xs text-red-500 flex-shrink-0">{checkSecondYellow(p) ? '🟨🟥' : '🟥'} {expelMin}'</span>
                : exitMin
                  ? <span className="text-xs text-red-400 flex-shrink-0">🔴 {exitMin}'</span>
                  : <span className="text-xs text-slate-500 flex-shrink-0">{p.player?.pos}</span>
              }
            </button>
          )
        })}
      </div>

      {team.substitutes?.length > 0 && (
        <>
          <div className="px-4 py-2 bg-slate-800/50 text-xs text-slate-500 uppercase tracking-wider">Suplentes</div>
          {team.substitutes.map((p, j) => {
            const enterMin = matchingOk && getEntered(p)
            const expelMin = matchingOk && getExpelled(p)
            const isOut    = expelMin
            return (
              <button
                key={j}
                onClick={() => onPlayerClick(p, team.team, teamCode ?? null)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-700/20 transition-colors ${isOut ? 'opacity-50' : !enterMin ? 'opacity-60' : ''}`}
              >
                <span className="w-6 text-center text-xs font-bold text-slate-500 flex-shrink-0">{p.player?.number}</span>
                <div className="flex-1 min-w-0 flex items-center gap-1 overflow-hidden">
                  <span className={`text-sm truncate ${expelMin ? 'line-through text-slate-500' : enterMin ? 'text-green-400 font-semibold' : 'text-slate-400'}`}>
                    {p.player?.name}
                  </span>
                  {enterMin && <PlayerIcons p={p} />}
                </div>
                {expelMin
                  ? <span className="text-xs text-red-500 flex-shrink-0">{checkSecondYellow(p) ? '🟨🟥' : '🟥'} {expelMin}'</span>
                  : enterMin
                    ? <span className="text-xs text-green-400 flex-shrink-0">🟢 {enterMin}'</span>
                    : <span className="text-xs text-slate-600 flex-shrink-0">{p.player?.pos}</span>
                }
              </button>
            )
          })}
        </>
      )}
    </div>
  )
}

// ─── EventRow ─────────────────────────────────────────────────────────────────
function EventRow({ event, homeId }) {
  const { icon, label } = getEventIcon(event.type, event.detail)
  const isHome = homeId != null
    ? event.team?.id === homeId
    : event.team?.id === event.fixture?.homeTeam?.id
  const isSubst      = event.type === 'subst'
  const isDisallowed = event._disallowed
  const showAssist   = !isDisallowed && shouldShowAssist(event)

  return (
    <div className={`flex items-center gap-3 py-2.5 border-b border-slate-700/20 last:border-0 ${isHome ? 'flex-row' : 'flex-row-reverse'} ${isDisallowed ? 'opacity-60' : ''}`}>
      <span className="text-slate-500 text-xs font-mono w-8 text-center flex-shrink-0 tabular-nums">
        {event.time?.elapsed}{event.time?.extra ? `+${event.time.extra}` : ''}'
      </span>
      <span className="text-lg flex-shrink-0">{isDisallowed ? '❌' : icon}</span>
      <div className={`flex-1 min-w-0 ${isHome ? 'text-left' : 'text-right'}`}>
        {isSubst ? (
          <>
            <p className="text-sm font-semibold text-green-400 truncate">↑ {event.assist?.name ?? '—'}</p>
            <p className="text-xs text-slate-500 truncate">↓ {event.player?.name}</p>
          </>
        ) : (
          <>
            <p className={`text-sm font-semibold truncate ${isDisallowed ? 'line-through text-slate-500' : 'text-white'}`}>
              {event.player?.name}
            </p>
            {showAssist && (
              <p className="text-xs text-slate-500 truncate">Asistencia: {event.assist.name}</p>
            )}
          </>
        )}
        <p className={`text-xs ${isDisallowed ? 'text-red-400/70' : 'text-slate-600'}`}>
          {isDisallowed ? 'Gol anulado' : label}
        </p>
      </div>
    </div>
  )
}

// ─── StatBar ─────────────────────────────────────────────────────────────────
function StatBar({ label, home, away }) {
  const total = (home || 0) + (away || 0)
  const homePct = total > 0 ? Math.round((home / total) * 100) : 50
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span className="font-bold text-white">{home ?? 0}</span>
        <span className="text-slate-500">{label}</span>
        <span className="font-bold text-white">{away ?? 0}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-700">
        <div className="bg-sky-500 transition-all" style={{ width: `${homePct}%` }} />
        <div className="bg-orange-500 transition-all" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function MatchDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const matchData  = MATCHES?.find(m => m.id === Number(id))
  const isExternal = !matchData
  const fixtureId  = useFixtureId(isExternal ? null : id)
  const { data: fixtureData, isFinished } = useFixtureData(fixtureId)
  const { events, stats, lineups, loading, error } = useMatchDetail(fixtureId, isFinished)
  const [tab, setTab] = useState('events')

  // Estado del modal de jugador
  const [selectedPlayer,   setSelectedPlayer]   = useState(null)
  const [selectedTeam,     setSelectedTeam]     = useState(null)
  const [selectedTeamCode, setSelectedTeamCode] = useState(null)
  const [fixturePlayersData,    setFixturePlayersData]    = useState(null)
  const [fixturePlayersLoading, setFixturePlayersLoading] = useState(false)
  const fixturePlayersFetched = useRef(false)

  const openPlayerModal = async (player, team, teamCode = null) => {
    setSelectedPlayer(player)
    setSelectedTeam(team)
    setSelectedTeamCode(teamCode)
    if (!fixturePlayersFetched.current) {
      fixturePlayersFetched.current = true
      setFixturePlayersLoading(true)
      try {
        const r = await fetch(
          `/api/football?endpoint=/fixtures/players&fixture=${fixtureId}`,
          { signal: AbortSignal.timeout(10000) }
        )
        const data = await r.json()
        setFixturePlayersData(data.response || [])
      } catch {}
      setFixturePlayersLoading(false)
    }
  }

  const closeModal = () => {
    setSelectedPlayer(null)
    setSelectedTeam(null)
    setSelectedTeamCode(null)
  }

  // Redirigir api fixture id → id interno (ej. /partido/1539000 → /partido/7)
  // Cubre links viejos ya en circulación y el fallback de LiveScores cuando el
  // mapa aún no estaba cargado en el momento del clic.
  useEffect(() => {
    if (!isExternal) return
    getFixtureMap()
      .then(() => {
        const appId = getAppMatchId(Number(id))
        if (appId) navigate(`/partido/${appId}`, { replace: true })
      })
      .catch(() => {})
  }, [id, isExternal, navigate])

  // Guardar resultado final en caché permanente cuando se detecta FT
  useEffect(() => {
    if (!isFinished || !fixtureData || fixtureData.homeScore == null) return
    saveResult(Number(id), fixtureData.homeScore, fixtureData.awayScore)
  }, [isFinished, fixtureData, id])

  const homeCode   = matchData?.homeTeam || ''
  const awayCode   = matchData?.awayTeam || ''
  const matchDate  = matchData?.date || ''
  const group      = matchData?.group || ''

  const extData = useExternalMatchData(id, isExternal)

  const homeStats = stats?.[0]?.statistics || []
  const awayStats = stats?.[1]?.statistics || []
  const getStat   = (arr, type) => arr.find(s => s.type === type)?.value

  const liveMatchData  = fixtureData
  const isMatchStarted = fixtureData?.status != null && fixtureData.status !== 'NS'

  // ── Partido externo ──────────────────────────────────────────────────────────
  if (isExternal) {
    const { fixture: externalFixture, events: extEvents, stats: extStats,
            lineups: extLineups, loading: extLoading } = extData
    const extHomeStats  = extStats?.[0]?.statistics || []
    const extAwayStats  = extStats?.[1]?.statistics || []
    const homeTeamId    = externalFixture?.teams?.home?.id
    const extStatus     = externalFixture?.fixture?.status?.short
    const extStarted    = extStatus && extStatus !== 'NS'
    const extFinished   = ['FT', 'AET', 'PEN'].includes(extStatus)
    // extSubstMap eliminado: se pasa buildSubstMap(extEvents, team.team?.id) por equipo en el render
    const extStatsMap   = buildStatsMap(extEvents)
    const extEventsProc = markDisallowedGoals(extEvents, externalFixture)
    const visibleExtEvents = extFinished
      ? extEventsProc.filter(e => ALWAYS_SHOW_TYPES.has(e.type))
      : extEventsProc

    if (extLoading) return (
      <div className="animate-slide-up max-w-3xl mx-auto">
        <Link to="/" className="text-slate-400 hover:text-white text-sm mb-4 inline-block">← Volver</Link>
        <div className="card p-16 text-center text-slate-500">Cargando partido…</div>
      </div>
    )
    if (!externalFixture) return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-slate-400">Partido no encontrado</p>
        <Link to="/" className="btn-secondary mt-4 inline-block">← Volver al inicio</Link>
      </div>
    )

    return (
      <div className="animate-slide-up max-w-3xl mx-auto">
        {selectedPlayer && (
          <PlayerModal
            player={selectedPlayer}
            team={selectedTeam}
            teamCode={selectedTeamCode}
            fixturePlayersData={fixturePlayersData}
            loading={fixturePlayersLoading}
            onClose={closeModal}
          />
        )}

        <Link to="/" className="text-slate-400 hover:text-white text-sm mb-4 inline-block">← Volver</Link>
        <ExternalMatchHeader f={externalFixture} />

        <div className="grid grid-cols-3 gap-1 mb-6 bg-slate-800 p-1 rounded-xl">
          {[
            { id: 'events',  label: 'Minuto a min.', icon: '⚽' },
            { id: 'stats',   label: 'Estadísticas',  icon: '📊' },
            { id: 'lineups', label: 'Alineaciones',  icon: '👥' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}>
              <span>{t.icon}</span>
              <span className="hidden sm:block leading-tight text-center">{t.label}</span>
            </button>
          ))}
        </div>

        <>
          {tab === 'events' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-700/50 font-semibold text-white" style={{ backgroundColor: '#162032' }}>Minuto a minuto</div>
              {extEvents.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <p className="text-3xl mb-3">⏱️</p>
                  {['1H','2H','ET','BT','PEN'].includes(externalFixture.fixture.status.short) ? (
                    <p className="text-sm">Sin eventos aún<br/><span className="text-slate-600 text-xs">Goles, tarjetas y cambios aparecerán aquí en tiempo real</span></p>
                  ) : (
                    <p className="text-sm">Los eventos aparecerán cuando inicie el partido.</p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-700/20">
                  {[...visibleExtEvents].reverse().map((e, i) => (
                    <EventRow key={i} event={e} homeId={homeTeamId} />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'stats' && (
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-5">Estadísticas del partido</h3>
              {extHomeStats.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  {extStarted
                    ? 'Estadísticas no disponibles para este partido.'
                    : 'Disponibles cuando inicie el partido.'}
                </p>
              ) : (
                <>
                  <StatBar label="Posesión"           home={parseInt(getStat(extHomeStats,'Ball Possession'))} away={parseInt(getStat(extAwayStats,'Ball Possession'))} />
                  <StatBar label="Tiros al arco"      home={getStat(extHomeStats,'Shots on Goal')}    away={getStat(extAwayStats,'Shots on Goal')} />
                  <StatBar label="Total tiros"        home={getStat(extHomeStats,'Total Shots')}      away={getStat(extAwayStats,'Total Shots')} />
                  <StatBar label="Corners"            home={getStat(extHomeStats,'Corner Kicks')}     away={getStat(extAwayStats,'Corner Kicks')} />
                  <StatBar label="Faltas"             home={getStat(extHomeStats,'Fouls')}            away={getStat(extAwayStats,'Fouls')} />
                  <StatBar label="Fueras de juego"    home={getStat(extHomeStats,'Offsides')}         away={getStat(extAwayStats,'Offsides')} />
                  <StatBar label="Tarjetas amarillas" home={getStat(extHomeStats,'Yellow Cards')}     away={getStat(extAwayStats,'Yellow Cards')} />
                  <StatBar label="Pases completados"  home={getStat(extHomeStats,'Passes accurate')}  away={getStat(extAwayStats,'Passes accurate')} />
                </>
              )}
            </div>
          )}

          {tab === 'lineups' && (
            <div className="grid md:grid-cols-2 gap-4">
              {extLineups.length === 0 ? (
                <div className="card p-16 text-center text-slate-500 md:col-span-2">
                  <p className="text-3xl mb-3">👥</p>
                  <p>
                    {extStarted
                      ? 'Alineaciones no disponibles para este partido.'
                      : 'Las alineaciones se publicarán próximamente'}
                  </p>
                  {!extStarted && <p className="text-xs mt-2 text-slate-600">Se actualizan automáticamente cuando estén disponibles</p>}
                </div>
              ) : extLineups.map((team, i) => (
                <LineupTeamCard
                  key={i}
                  team={team}
                  substMap={buildSubstMap(extEvents, team.team?.id)}
                  statsMap={extStatsMap}
                  onPlayerClick={openPlayerModal}
                  teamCode={null}
                />
              ))}
            </div>
          )}
        </>
      </div>
    )
  }

  // ── Partido del Mundial ──────────────────────────────────────────────────────
  const wcStarted       = events.length > 0 || homeStats.length > 0
  const homeTeamApiId   = TEAM_IDS[MD_CODE_ALIAS[homeCode] ?? homeCode] ?? null
  const wcStatsMap      = buildStatsMap(events)
  const visibleWcEvents = isFinished
    ? events.filter(e => ALWAYS_SHOW_TYPES.has(e.type))
    : events

  return (
    <div className="animate-slide-up max-w-3xl mx-auto">
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          team={selectedTeam}
          teamCode={selectedTeamCode}
          fixturePlayersData={fixturePlayersData}
          loading={fixturePlayersLoading}
          onClose={closeModal}
        />
      )}

      <Link to="/calendario" className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
        ← Volver al calendario
      </Link>

      <MatchCountdownBanner match={matchData} isStarted={isMatchStarted} />
      <MatchHeader match={matchData} liveData={liveMatchData} />

      <div className="grid grid-cols-4 gap-1 mb-6 bg-slate-800 p-1 rounded-xl">
        {[
          { id: 'events',  label: 'Minuto a min.', icon: '⚽' },
          { id: 'stats',   label: 'Estadísticas',  icon: '📊' },
          { id: 'lineups', label: 'Alineaciones',  icon: '👥' },
          { id: 'ai',      label: 'Análisis IA',   icon: '🤖' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
              tab === t.id ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
            }`}>
            <span>{t.icon}</span>
            <span className="hidden sm:block leading-tight text-center">{t.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-16 text-center text-slate-500">Cargando datos del partido…</div>
      ) : (
        <>
          {tab === 'events' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-700/50 font-semibold text-white"
                style={{ backgroundColor: '#162032' }}>Minuto a minuto</div>
              {events.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <p className="text-3xl mb-3">⏱️</p>
                  <p>Los eventos aparecerán cuando inicie el partido.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/20">
                  {[...visibleWcEvents].reverse().map((e, i) => <EventRow key={i} event={e} homeId={homeTeamApiId} />)}
                </div>
              )}
            </div>
          )}

          {tab === 'stats' && (
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-5">Estadísticas del partido</h3>
              {homeStats.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  {wcStarted
                    ? 'Estadísticas no disponibles para este partido.'
                    : 'Disponibles cuando inicie el partido.'}
                </p>
              ) : (
                <>
                  <StatBar label="Posesión"           home={parseInt(getStat(homeStats,'Ball Possession'))} away={parseInt(getStat(awayStats,'Ball Possession'))} />
                  <StatBar label="Tiros al arco"      home={getStat(homeStats,'Shots on Goal')}    away={getStat(awayStats,'Shots on Goal')} />
                  <StatBar label="Total tiros"        home={getStat(homeStats,'Total Shots')}      away={getStat(awayStats,'Total Shots')} />
                  <StatBar label="Corners"            home={getStat(homeStats,'Corner Kicks')}     away={getStat(awayStats,'Corner Kicks')} />
                  <StatBar label="Faltas"             home={getStat(homeStats,'Fouls')}            away={getStat(awayStats,'Fouls')} />
                  <StatBar label="Fueras de juego"    home={getStat(homeStats,'Offsides')}         away={getStat(awayStats,'Offsides')} />
                  <StatBar label="Tarjetas amarillas" home={getStat(homeStats,'Yellow Cards')}     away={getStat(awayStats,'Yellow Cards')} />
                  <StatBar label="Pases completados"  home={getStat(homeStats,'Passes accurate')}  away={getStat(awayStats,'Passes accurate')} />
                </>
              )}
            </div>
          )}

          {tab === 'lineups' && (
            <div className="grid md:grid-cols-2 gap-4">
              {lineups.length === 0 ? (
                <div className="card p-16 text-center text-slate-500 md:col-span-2">
                  <p className="text-3xl mb-3">👥</p>
                  <p>
                    {wcStarted
                      ? 'Alineaciones no disponibles para este partido.'
                      : 'Las alineaciones se publicarán próximamente'}
                  </p>
                  {!wcStarted && <p className="text-xs mt-2 text-slate-600">Se actualizan automáticamente cuando estén disponibles</p>}
                </div>
              ) : lineups.map((team, i) => (
                <LineupTeamCard
                  key={i}
                  team={team}
                  substMap={buildSubstMap(events, team.team?.id)}
                  statsMap={wcStatsMap}
                  onPlayerClick={openPlayerModal}
                  teamCode={i === 0 ? homeCode : awayCode}
                />
              ))}
            </div>
          )}

          {tab === 'ai' && (
            <MatchAI homeCode={homeCode} awayCode={awayCode} matchDate={matchDate} group={group} />
          )}
        </>
      )}
    </div>
  )
}
