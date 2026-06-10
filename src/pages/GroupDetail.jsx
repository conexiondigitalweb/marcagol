import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGroupById } from '../data/groups'
import { sortTeams, formatDayOfWeek, capitalizeFirst, toLocalTime } from '../utils/helpers'
import { getMatchesByGroup } from '../data/matches'
import Flag from '../components/ui/Flag'
import { StatusBadge, ConfederationBadge } from '../components/ui/Badge'
import { getResult } from '../data/matchResults'
import { useLiveMatches } from '../hooks/useLiveData'
import { TEAM_IDS } from '../data/teamIds'

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'PEN'])
const CODE_ALIAS    = { RSA: 'ZAF', HAI: 'HTI', PAR: 'PRY' }

function resolveTeamId(code) {
  return TEAM_IDS[CODE_ALIAS[code] ?? code] ?? null
}

// Builds { matchId: { homeScore, awayScore, status, minute } } for live group matches
function buildLiveScores(liveMatches, groupMatches) {
  const scores = {}
  for (const m of groupMatches) {
    const hId = resolveTeamId(m.homeTeam)
    const aId = resolveTeamId(m.awayTeam)
    if (!hId || !aId) continue
    const live = liveMatches.find(lm =>
      lm.teams?.home?.id === hId && lm.teams?.away?.id === aId
    )
    if (live && LIVE_STATUSES.has(live.fixture?.status?.short)) {
      scores[m.id] = {
        homeScore: live.goals?.home ?? 0,
        awayScore: live.goals?.away ?? 0,
        status:    live.fixture?.status?.short,
        minute:    live.fixture?.status?.elapsed,
      }
    }
  }
  return scores
}

function computeGroupStandings(teams, matches, liveScores = {}) {
  const stats = {}
  teams.forEach(t => {
    stats[t.code] = {
      ...t,
      played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, points: 0,
      isLive: false, liveMinute: null,
    }
  })
  for (const m of matches) {
    const finished = getResult(m.id)
    const live     = liveScores[m.id]
    const score    = finished ?? live  // FT siempre tiene prioridad sobre en vivo
    if (!score) continue
    const h = stats[m.homeTeam]
    const a = stats[m.awayTeam]
    if (!h || !a) continue
    h.played++; a.played++
    h.gf += score.homeScore; h.ga += score.awayScore
    a.gf += score.awayScore; a.ga += score.homeScore
    h.gd = h.gf - h.ga;     a.gd = a.gf - a.ga
    if (score.homeScore > score.awayScore)        { h.won++;   h.points += 3; a.lost++ }
    else if (score.homeScore === score.awayScore) { h.drawn++; h.points++;    a.drawn++; a.points++ }
    else                                          { h.lost++;  a.won++;       a.points += 3 }
    if (live && !finished) {
      h.isLive = true; h.liveMinute = live.minute
      a.isLive = true; a.liveMinute = live.minute
    }
  }
  return teams.map(t => stats[t.code])
}

// Stat cell: w-8 fixed — alineación garantizada entre header y filas
const S = ({ v, bold = false }) => (
  <span className={`w-8 text-center tabular-nums shrink-0 ${bold ? 'font-bold text-white' : 'text-slate-400'}`}>{v}</span>
)

function TeamRow({ team, rank, posChange }) {
  const borderColor =
    rank === 1 ? 'border-l-sky-400' :
    rank === 2 ? 'border-l-blue-500' :
    rank === 3 ? 'border-l-amber-400' :
    'border-l-transparent'
  const gd = team.gd > 0 ? `+${team.gd}` : `${team.gd}`

  return (
    <Link
      to={`/equipos/${team.code}`}
      className={`flex items-center px-3 sm:px-5 py-3.5 border-l-4 ${borderColor} hover:bg-slate-700/30 transition-colors group`}
    >
      <span className="text-slate-500 text-sm font-bold w-5 text-center shrink-0 mr-2">{rank}</span>
      <span className="shrink-0 mr-2"><Flag iso2={team.iso2} size="sm" /></span>

      <div className="flex-1 min-w-0 mr-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-white text-sm truncate group-hover:text-sky-400 transition-colors">
            {team.name}
          </span>
          {team.isLive && (
            <span className="flex items-center gap-0.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              {team.liveMinute != null && (
                <span className="text-[10px] text-red-400 font-bold leading-none">{team.liveMinute}'</span>
              )}
            </span>
          )}
          {posChange > 0 && <span className="text-[10px] text-emerald-400 font-bold shrink-0">▲</span>}
          {posChange < 0 && <span className="text-[10px] text-red-400 font-bold shrink-0">▼</span>}
        </div>
        <ConfederationBadge confederation={team.confederation} />
      </div>

      {/* Desktop: todas las columnas */}
      <div className="hidden sm:flex items-center text-sm shrink-0">
        <S v={team.played} /><S v={team.won} /><S v={team.drawn} />
        <S v={team.lost} /><S v={team.gf} /><S v={team.ga} />
        <S v={gd} /><S v={team.points} bold />
      </div>
      {/* Mobile: PJ · DG · PTS */}
      <div className="flex sm:hidden items-center text-xs shrink-0">
        <S v={team.played} /><S v={gd} /><S v={team.points} bold />
      </div>

      <span className="text-slate-700 text-xs w-7 text-right shrink-0 ml-1 hidden sm:block">
        #{team.fifaRanking}
      </span>
    </Link>
  )
}

function MatchRow({ match }) {
  const allTeams  = getGroupById(match.group)?.teams || []
  const homeTeam  = allTeams.find(t => t.code === match.homeTeam) || { name: match.homeTeam, iso2: 'un' }
  const awayTeam  = allTeams.find(t => t.code === match.awayTeam) || { name: match.awayTeam, iso2: 'un' }
  const result    = getResult(match.id)
  const isLive    = LIVE_STATUSES.has(match.status)
  const isFinished = !!result
  const { time, label } = toLocalTime(match.date, match.time)

  const displayScore = result ?? (
    match.homeScore !== null ? { homeScore: match.homeScore, awayScore: match.awayScore } : null
  )

  return (
    <Link
      to={`/partido/${match.id}`}
      className="flex items-center gap-3 px-5 py-4 hover:bg-slate-700/30 transition-colors group"
    >
      <div className="w-20 text-xs">
        <div className="text-slate-500">JOR {match.matchday}</div>
        {isFinished ? (
          <div className="text-slate-500 font-semibold">Final</div>
        ) : (
          <div className="text-slate-600">{time} <span className="text-slate-700">{label}</span></div>
        )}
      </div>

      <div className="flex-1 flex items-center gap-4 justify-center">
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="font-semibold text-white text-right text-sm group-hover:text-sky-300 transition-colors">
            {homeTeam.name}
          </span>
          <Flag iso2={homeTeam.iso2} size="xs" />
        </div>

        <div className="text-center min-w-[52px]">
          {displayScore !== null ? (
            <span className={`font-black text-lg ${isLive ? 'text-sky-400' : 'text-white'}`}>
              {displayScore.homeScore}–{displayScore.awayScore}
            </span>
          ) : (
            <span className="text-slate-500 font-mono text-sm">VS</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Flag iso2={awayTeam.iso2} size="xs" />
          <span className="font-semibold text-white text-sm group-hover:text-sky-300 transition-colors">
            {awayTeam.name}
          </span>
        </div>
      </div>

      <div className="w-28 flex flex-col items-end gap-1">
        {isFinished ? (
          <span className="badge-finished">Finalizado</span>
        ) : isLive ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-xs font-bold text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />EN VIVO
          </span>
        ) : (
          <StatusBadge status={match.status} />
        )}
        <span className="text-sky-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          Ver →
        </span>
      </div>
    </Link>
  )
}

export default function GroupDetail() {
  const { id } = useParams()
  const group = getGroupById(id?.toUpperCase())

  // Hooks deben llamarse antes de cualquier return condicional
  const { matches: apiLiveMatches } = useLiveMatches()

  const groupMatches = useMemo(
    () => (group ? getMatchesByGroup(group.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [group?.id]
  )

  const liveScores = useMemo(
    () => buildLiveScores(apiLiveMatches, groupMatches),
    [apiLiveMatches, groupMatches]
  )

  if (!group) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-slate-400 text-lg">Grupo no encontrado</p>
        <Link to="/grupos" className="btn-primary mt-4 inline-block">← Volver a Grupos</Link>
      </div>
    )
  }

  const hasLive = Object.keys(liveScores).length > 0

  // Standings sin datos en vivo — para comparar posiciones
  const baseStats  = computeGroupStandings(group.teams, groupMatches)
  const baseSorted = sortTeams(baseStats)
  const basePos    = Object.fromEntries(baseSorted.map((t, i) => [t.code, i + 1]))

  // Standings con datos en vivo (provisional si hay partido en curso)
  const liveStats = computeGroupStandings(group.teams, groupMatches, liveScores)
  const sorted    = sortTeams(liveStats)

  const byMatchday = [1, 2, 3].map(md => ({
    md,
    matches: groupMatches.filter(m => m.matchday === md),
  }))

  return (
    <div className="animate-slide-up max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/grupos" className="text-slate-400 hover:text-white transition-colors text-sm">
          ← Grupos
        </Link>
        <div className="flex items-center gap-3">
          <span className="badge-group text-lg w-9 h-9">{group.id}</span>
          <h1 className="text-3xl font-black text-white">{group.name}</h1>
        </div>
      </div>

      {/* Standings */}
      <div className="card overflow-hidden">
        {/* Header de columnas */}
        <div className="flex items-center px-3 sm:px-5 py-3 border-b border-slate-700/50 text-xs text-slate-600 uppercase tracking-wider">
          <span className="w-5 text-center shrink-0 mr-2">#</span>
          <span className="w-5 sm:w-6 shrink-0 mr-2" />
          <span className="flex-1 min-w-0 mr-2">Selección</span>
          <div className="hidden sm:flex items-center shrink-0">
            {['PJ','G','E','P','GF','GA','DG'].map(h => (
              <span key={h} className="w-8 text-center">{h}</span>
            ))}
            <span className="w-8 text-center font-bold text-slate-500">PTS</span>
          </div>
          <div className="flex sm:hidden items-center shrink-0">
            <span className="w-8 text-center">PJ</span>
            <span className="w-8 text-center">DG</span>
            <span className="w-8 text-center font-bold text-slate-500">PTS</span>
          </div>
          <span className="w-7 shrink-0 ml-1 hidden sm:block" />
        </div>

        {/* Banner provisional cuando hay partido en vivo */}
        {hasLive && (
          <div className="flex items-center gap-2 px-5 py-2 bg-red-500/5 border-b border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
            <span className="text-xs text-red-400 font-semibold">Posiciones provisionales · partido en curso</span>
          </div>
        )}

        {sorted.map((team, i) => (
          <div key={team.code} className="border-b border-slate-700/20 last:border-0">
            <TeamRow
              team={team}
              rank={i + 1}
              posChange={hasLive ? (basePos[team.code] ?? i + 1) - (i + 1) : 0}
            />
          </div>
        ))}

        <div className="px-5 py-3 flex gap-6 border-t border-slate-700/30 bg-slate-800/30">
          {[
            { color: 'bg-sky-400',   label: '1° y 2° – Clasifican a Octavos' },
            { color: 'bg-amber-400', label: '3° – Posible clasificación' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Partidos por jornada */}
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-white">Calendario del Grupo</h2>
        {byMatchday.map(({ md, matches: mdMatches }) => (
          <div key={md} className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700/50 bg-slate-800/40">
              <span className="text-sm font-semibold text-slate-300">Jornada {md}</span>
              {mdMatches[0] && (
                <span className="ml-3 text-xs text-slate-600">
                  {capitalizeFirst(formatDayOfWeek(mdMatches[0].date))}
                </span>
              )}
            </div>
            {mdMatches.map((match, i) => (
              <div key={match.id} className={i < mdMatches.length - 1 ? 'border-b border-slate-700/20' : ''}>
                <MatchRow match={match} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
