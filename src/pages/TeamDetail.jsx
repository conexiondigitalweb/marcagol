import { useParams, Link } from 'react-router-dom'
import { getTeamByCode, getGroupById } from '../data/groups'
import { sortTeams, toLocalTime } from '../utils/helpers'
import { getMatchesByGroup } from '../data/matches'
import { getConfederationColor } from '../utils/helpers'
import Flag from '../components/ui/Flag'
import { ConfederationBadge, StatusBadge } from '../components/ui/Badge'
import { getSquad, getCoach } from '../data/squads'
import { getResult } from '../data/matchResults'
import { getHistory } from '../data/history'

const TEAM_COLORS = {
  USA:'#002868', ENG:'#CF091F', TUN:'#E70013', ECU:'#FFD100',
  MEX:'#006847', GER:'#000000', AUS:'#00843D', SEN:'#00853F',
  CAN:'#FF0000', FRA:'#002395', KOR:'#003478', MAR:'#C1272D',
  BRA:'#009C3B', ESP:'#AA151B', IRN:'#239F40', CMR:'#007A5E',
  ARG:'#74ACDF', POR:'#006600', NGA:'#008751', NZL:'#00247D',
  NED:'#FF6600', COL:'#FCD116', JPN:'#BC002D', ALG:'#006233',
  ITA:'#003399', URU:'#5AAAFF', KSA:'#006C35', GHA:'#006B3F',
  BEL:'#EF3340', PAR:'#D52B1E', CRO:'#FF0000', JOR:'#007A3D',
  SUI:'#FF0000', CRC:'#002B7F', EGY:'#CE1126', SRB:'#C6363C',
  DEN:'#C60C30', PAN:'#DA121A', IRQ:'#007A3D', POL:'#DC143C',
  TUR:'#E30A17', HON:'#0073CF', CIV:'#F77F00', AUT:'#ED2939',
  SCO:'#003F83', WAL:'#C8102E', UAE:'#00732F', QAT:'#8D1B3D',
}

// KEY_PLAYERS eliminado — ahora usamos squads.js con datos oficiales FIFA

export default function TeamDetail() {
  const { code } = useParams()
  const team = getTeamByCode(code?.toUpperCase())

  if (!team) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-slate-400 text-lg">Equipo no encontrado</p>
        <Link to="/equipos" className="btn-primary mt-4 inline-block">← Volver a Equipos</Link>
      </div>
    )
  }

  const group = getGroupById(team.group)
  const groupMatches = getMatchesByGroup(team.group)
  const teamMatches = groupMatches.filter(m => m.homeTeam === team.code || m.awayTeam === team.code)
  const sortedGroup = sortTeams(group.teams)
  const squad = getSquad(team.code)
  const hist  = getHistory(team.code)
  const coach = getCoach(team.code)
  const accentColor = TEAM_COLORS[team.code] || '#38BDF8'
  const posIcons = { Portero: '🧤', Defensor: '🛡️', Mediocampista: '⚙️', Delantero: '⚽' }
  const positions = ['Portero', 'Defensor', 'Mediocampista', 'Delantero']
  const playersByPos = positions.reduce((acc, pos) => {
    acc[pos] = squad?.players?.filter(p => p.position === pos) || []
    return acc
  }, {})

  return (
    <div className="animate-slide-up max-w-4xl mx-auto">
      {/* Back */}
      <Link to="/equipos" className="text-slate-400 hover:text-white text-sm transition-colors mb-4 inline-block">
        ← Todos los equipos
      </Link>

      {/* Banner con color del equipo */}
      <div
        className="relative rounded-xl overflow-hidden mb-6 flex items-center justify-center"
        style={{
          height: '200px',
          background: `linear-gradient(135deg, ${accentColor}CC 0%, ${accentColor}66 100%)`,
          backgroundColor: '#0F172A',
        }}
      >
        <img
          src={`https://flagcdn.com/w320/${team.iso2.toLowerCase()}.png`}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', opacity: 0.15,
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <img
            src={`https://flagcdn.com/w80/${team.iso2.toLowerCase()}.png`}
            alt={team.name}
            style={{ height: '52px', borderRadius: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
          />
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-xl">
            {team.name}
          </h1>
        </div>
      </div>

      {/* Hero card */}
      <div
        className="card p-8 mb-6 relative overflow-hidden"
        style={{ borderColor: accentColor + '40' }}
      >
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: `radial-gradient(circle at top right, ${accentColor}, transparent 60%)` }}
        />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Flag iso2={team.iso2} size="xl" className="rounded-lg shadow-xl" />
          <div className="text-center sm:text-left">
            <ConfederationBadge confederation={team.confederation} />
            <h1 className="text-4xl font-black text-white mt-2 mb-1">{team.name}</h1>
            <p className="text-slate-400 text-lg font-mono">{team.code}</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Ranking FIFA',  value: `#${team.fifaRanking}`, icon: '🏅' },
          { label: 'Grupo',         value: `Grupo ${team.group}`,  icon: '🏆' },
          { label: 'Confederación', value: team.confederation,     icon: '🌍' },
          { label: 'Edad promedio', value: squad?.avgAge ? `${squad.avgAge} años` : '—', icon: '📊' },
        ].map(stat => (
          <div key={stat.label} className="card p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="font-bold text-white">{stat.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Group standing */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700/50 font-semibold text-white">
            Posición en {group.name}
          </div>
          {sortedGroup.map((t, i) => (
            <Link
              to={`/equipos/${t.code}`}
              key={t.code}
              className={`flex items-center gap-3 px-5 py-3 hover:bg-slate-700/30 transition-colors border-b border-slate-700/20 last:border-0
                ${t.code === team.code ? 'bg-sky-500/5 border-l-2 border-l-sky-400' : ''}`}
            >
              <span className="text-slate-500 text-sm font-bold w-4">{i + 1}</span>
              <Flag iso2={t.iso2} size="xs" />
              <span className={`flex-1 text-sm font-medium ${t.code === team.code ? 'text-sky-400' : 'text-slate-300'}`}>
                {t.name}
              </span>
              <div className="grid grid-cols-4 gap-3 text-xs text-center text-slate-500 tabular-nums">
                <span>{t.played}</span>
                <span>{t.gf}:{t.ga}</span>
                <span>{t.gd > 0 ? `+${t.gd}` : t.gd}</span>
                <span className="text-white font-bold">{t.points}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Matches */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700/50 font-semibold text-white">
            Partidos de Fase de Grupos
          </div>
          {teamMatches.map(match => {
            const isHome       = match.homeTeam === team.code
            const opponentCode = isHome ? match.awayTeam : match.homeTeam
            const opponent     = group.teams.find(t => t.code === opponentCode)
            const result       = getResult(match.id)
            const { time, label } = toLocalTime(match.date, match.time)
            return (
              <Link key={match.id} to={`/partido/${match.id}`}
                className="flex items-center gap-3 px-5 py-3 border-b border-slate-700/20 last:border-0 hover:bg-slate-700/20 transition-colors group">
                <div className="text-xs text-slate-600 w-12">J{match.matchday}</div>
                {opponent && <Flag iso2={opponent.iso2} size="xs" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-300 group-hover:text-sky-300 transition-colors">
                    {isHome ? 'vs' : 'en'} {opponent?.name || opponentCode}
                  </div>
                  <div className="text-xs text-slate-600">
                    {match.date} · {time} {label}
                  </div>
                </div>
                {result ? (
                  <span className="text-white font-bold tabular-nums">
                    {isHome ? result.homeScore : result.awayScore}–{isHome ? result.awayScore : result.homeScore}
                  </span>
                ) : (
                  <StatusBadge status={match.status} />
                )}
              </Link>
            )
          })}
        </div>

        {/* Técnico */}
        {coach && (
          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4">Cuerpo Técnico</h3>
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-700/30">
              <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-2xl flex-shrink-0">
                👔
              </div>
              <div>
                <p className="font-bold text-white">{coach}</p>
                <p className="text-xs text-slate-500 mt-0.5">Director Técnico</p>
              </div>
            </div>
          </div>
        )}

        {/* Convocatoria oficial */}
        {squad && (
          <div className="card p-5 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">
                Convocatoria Oficial · Mundial 2026
              </h3>
              <span className="text-xs text-slate-500">{squad.players?.length} jugadores</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {positions.map(pos => (
                <div key={pos}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span>{posIcons[pos]}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      {pos}s ({playersByPos[pos].length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {playersByPos[pos].map(player => (
                      <Link
                        key={player.number}
                        to={`/jugador/${team.code}/${player.number}`}
                        className="block bg-slate-700/30 hover:bg-slate-700/60 rounded-lg px-3 py-2 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-sky-400 w-5 text-center flex-shrink-0">
                            {player.number}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium leading-tight truncate">
                              {player.shirtName}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{player.club}</p>
                          </div>
                          <span className="text-xs text-slate-600 flex-shrink-0 ml-auto">
                            {player.age}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-3">
              Fuente: FIFA Squad Lists oficial · {squad.avgAge} años promedio
            </p>
          </div>
        )}

        {/* Historial mundialista */}
        {hist && (
          <div className="card p-5 md:col-span-2">
            <h3 className="font-semibold text-white mb-4">Historial Mundialista</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Participaciones', value: hist.participations || '—', icon: '🏟️' },
                { label: 'Partidos',        value: hist.matches,                icon: '⚽' },
                { label: 'Victorias',       value: hist.won,                    icon: '✅' },
                { label: 'Goles a favor',   value: hist.gf,                     icon: '🎯' },
              ].map(s => (
                <div key={s.label} className="bg-slate-700/30 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-2xl font-black text-white">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {hist.titles > 0 && <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30">🏆 {hist.titles} título{hist.titles > 1 ? 's' : ''}</span>}
              {hist.runnerUp > 0 && <span className="px-3 py-1 rounded-full bg-slate-500/20 text-slate-300 text-xs font-bold border border-slate-500/30">🥈 {hist.runnerUp} subcampeonato{hist.runnerUp > 1 ? 's' : ''}</span>}
              {hist.semis > 0 && <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">🔥 {hist.semis} semifinal{hist.semis > 1 ? 'es' : ''}</span>}
              {hist.quarters > 0 && <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold border border-sky-500/30">⚡ {hist.quarters} cuartos</span>}
            </div>
            <div className="bg-slate-700/30 rounded-xl p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Mejor participación histórica</p>
              <p className="text-sm font-semibold text-white">{hist.best}</p>
            </div>
            {hist.participations === 0 && (
              <div className="mt-3 bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-center">
                <p className="text-sky-400 text-sm font-semibold">🌟 Debutante en Copa del Mundo 2026</p>
              </div>
            )}
          </div>
        )}

        {/* Tournament Stats */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4">Estadísticas de Fase de Grupos</h3>
          <div className="space-y-3">
            {[
              { label: 'Partidos jugados', value: team.played },
              { label: 'Victorias',        value: team.won    },
              { label: 'Empates',          value: team.drawn  },
              { label: 'Derrotas',         value: team.lost   },
              { label: 'Goles a favor',    value: team.gf     },
              { label: 'Goles en contra',  value: team.ga     },
              { label: 'Diferencia',       value: team.gd > 0 ? `+${team.gd}` : team.gd },
              { label: 'Puntos',           value: `${team.points} pts` },
            ].map(stat => (
              <div key={stat.label} className="flex justify-between items-center py-1.5 border-b border-slate-700/30 last:border-0">
                <span className="text-sm text-slate-400">{stat.label}</span>
                <span className="font-bold text-white">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
