import { useParams, Link } from 'react-router-dom'
import { getGroupById } from '../data/groups'
import { sortTeams, formatDayOfWeek, capitalizeFirst, getConfederationColor, toLocalTime } from '../utils/helpers'
import { getMatchesByGroup } from '../data/matches'
import Flag from '../components/ui/Flag'
import { StatusBadge, ConfederationBadge } from '../components/ui/Badge'
import { getResult } from '../data/matchResults'

const LIVE_STATUSES = new Set(['live','1H','HT','2H','ET','PEN'])

function computeGroupStandings(teams, matches) {
  const stats = {}
  teams.forEach(t => {
    stats[t.code] = { ...t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
  })
  for (const m of matches) {
    const r = getResult(m.id)
    if (!r) continue
    const h = stats[m.homeTeam]
    const a = stats[m.awayTeam]
    if (!h || !a) continue
    h.played++; a.played++
    h.gf += r.homeScore; h.ga += r.awayScore
    a.gf += r.awayScore; a.ga += r.homeScore
    h.gd = h.gf - h.ga;  a.gd = a.gf - a.ga
    if (r.homeScore > r.awayScore)        { h.won++;   h.points += 3; a.lost++ }
    else if (r.homeScore === r.awayScore) { h.drawn++; h.points++;    a.drawn++; a.points++ }
    else                                  { h.lost++;  a.won++;       a.points += 3 }
  }
  return teams.map(t => stats[t.code])
}

function TeamRow({ team, rank }) {
  const borderColor =
    rank === 1 ? 'border-l-sky-400' :
    rank === 2 ? 'border-l-blue-500' :
    rank === 3 ? 'border-l-amber-400' :
    'border-l-transparent'

  return (
    <Link to={`/equipos/${team.code}`} className={`flex items-center gap-3 px-5 py-3.5 border-l-4 ${borderColor} hover:bg-slate-700/30 transition-colors group`}>
      <span className="text-slate-500 text-sm font-bold w-4 text-right">{rank}</span>
      <Flag iso2={team.iso2} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white group-hover:text-sky-400 transition-colors">{team.name}</div>
        <ConfederationBadge confederation={team.confederation} />
      </div>
      <div className="grid grid-cols-7 gap-2 text-sm text-center text-slate-400 tabular-nums min-w-[280px]">
        {[team.played, team.won, team.drawn, team.lost, team.gf, team.ga,
          team.gd > 0 ? `+${team.gd}` : team.gd].map((v, i) => (
          <span key={i}>{v}</span>
        ))}
        <span className="font-bold text-white">{team.points}</span>
      </div>
      <span className="text-slate-600 text-xs">#{team.fifaRanking}</span>
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

  if (!group) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-slate-400 text-lg">Grupo no encontrado</p>
        <Link to="/grupos" className="btn-primary mt-4 inline-block">← Volver a Grupos</Link>
      </div>
    )
  }

  const matches    = getMatchesByGroup(group.id)
  const computed   = computeGroupStandings(group.teams, matches)
  const sorted     = sortTeams(computed)
  const byMatchday = [1, 2, 3].map(md => ({
    md,
    matches: matches.filter(m => m.matchday === md),
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
        <div className="flex items-center px-5 py-3 border-b border-slate-700/50 text-xs text-slate-600 uppercase tracking-wider">
          <span className="w-4 mr-3 text-right">#</span>
          <span className="ml-10 flex-1">Selección</span>
          <div className="grid grid-cols-7 gap-2 text-center min-w-[280px]">
            {['PJ','G','E','P','GF','GA','DG'].map(h => <span key={h}>{h}</span>)}
            <span className="font-bold text-slate-500">Pts</span>
          </div>
          <span className="w-10 ml-4"></span>
        </div>

        {sorted.map((team, i) => (
          <div key={team.code} className="border-b border-slate-700/20 last:border-0">
            <TeamRow team={team} rank={i + 1} />
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

      {/* Matches by matchday */}
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
