import { useParams, Link } from 'react-router-dom'
import { getTeamByCode, getGroupById } from '../data/groups'
import { sortTeams } from '../utils/helpers'
import { getMatchesByGroup } from '../data/matches'
import { getConfederationColor } from '../utils/helpers'
import Flag from '../components/ui/Flag'
import { ConfederationBadge, StatusBadge } from '../components/ui/Badge'
import { TEAM_IDS } from '../data/teamIds'

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

const KEY_PLAYERS = {
  USA: ['Tyler Adams', 'Christian Pulisic', 'Gio Reyna'],
  ENG: ['Jude Bellingham', 'Harry Kane', 'Bukayo Saka'],
  ARG: ['Lionel Messi', 'Julián Álvarez', 'Enzo Fernández'],
  FRA: ['Kylian Mbappé', 'Antoine Griezmann', 'Aurélien Tchouaméni'],
  BRA: ['Vinicius Jr.', 'Rodrygo', 'Endrick'],
  ESP: ['Pedri', 'Yamal', 'Morata'],
  POR: ['Cristiano Ronaldo', 'Bruno Fernandes', 'Rafael Leão'],
  GER: ['Florian Wirtz', 'Jamal Musiala', 'Toni Kroos'],
  NED: ['Virgil van Dijk', 'Cody Gakpo', 'Tijjani Reijnders'],
  ITA: ['Sandro Tonali', 'Federico Chiesa', 'Gianluigi Donnarumma'],
  BEL: ['Romelu Lukaku', 'Kevin De Bruyne', 'Yannick Carrasco'],
  MEX: ['Guillermo Ochoa', 'Hirving Lozano', 'Santiago Giménez'],
  CAN: ['Alphonso Davies', 'Jonathan David', 'Tajon Buchanan'],
  COL: ['James Rodríguez', 'Luis Díaz', 'Rafael Santos Borré'],
  URU: ['Luis Suárez', 'Darwin Núñez', 'Federico Valverde'],
  MAR: ['Achraf Hakimi', 'Hakim Ziyech', 'Youssef En-Nesyri'],
  SEN: ['Sadio Mané', 'Édouard Mendy', 'Kalidou Koulibaly'],
  JPN: ['Takehiro Tomiyasu', 'Kaoru Mitoma', 'Ritsu Doan'],
  CRO: ['Luka Modrić', 'Ivan Perišić', 'Mateo Kovačić'],
}

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
  const players = KEY_PLAYERS[team.code] || ['Datos próximamente']
  const accentColor = TEAM_COLORS[team.code] || '#38BDF8'

  return (
    <div className="animate-slide-up max-w-4xl mx-auto">
      {/* Back */}
      <Link to="/equipos" className="text-slate-400 hover:text-white text-sm transition-colors mb-4 inline-block">
        ← Todos los equipos
      </Link>

      {/* Flag / special banner */}
      <div className="relative rounded-xl overflow-hidden mb-6" style={{ height: '120px' }}>
        {team.code === 'COL' ? (
          <img
            src="/images/colombia-banner.svg"
            alt="Colombia"
            className="w-full h-full"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <>
            <img
              src={`https://flagcdn.com/w320/${team.iso2.toLowerCase()}.png`}
              alt={team.name}
              className="w-full h-full"
              style={{ objectFit: 'cover', filter: 'blur(10px)', transform: 'scale(1.15)' }}
            />
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-xl">{team.name}</h1>
            </div>
          </>
        )}
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
          <img
            src={`https://media.api-sports.io/football/teams/${TEAM_IDS[team.code]}.png`}
            width={80}
            height={80}
            alt={team.name}
            className="rounded-lg shadow-xl object-contain flex-shrink-0"
            style={{ background: '#1E293B', padding: '6px' }}
            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none' }}
            loading="lazy"
          />
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
          { label: 'Ranking FIFA', value: `#${team.fifaRanking}`, icon: '🏅' },
          { label: 'Grupo',        value: `Grupo ${team.group}`, icon: '🏆' },
          { label: 'Confederación',value: team.confederation,    icon: '🌍' },
          { label: 'Puntos',       value: `${team.points} pts`,  icon: '📊' },
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
            const isHome = match.homeTeam === team.code
            const opponentCode = isHome ? match.awayTeam : match.homeTeam
            const opponent = group.teams.find(t => t.code === opponentCode)
            return (
              <div key={match.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-700/20 last:border-0">
                <div className="text-xs text-slate-600 w-12">J{match.matchday}</div>
                {opponent && <Flag iso2={opponent.iso2} size="xs" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-300">
                    {isHome ? 'vs' : 'en'} {opponent?.name || opponentCode}
                  </div>
                  <div className="text-xs text-slate-600">{match.date} · {match.time?.slice(0,5)} UTC</div>
                </div>
                {match.homeScore !== null ? (
                  <span className="text-white font-bold">
                    {isHome ? match.homeScore : match.awayScore}–{isHome ? match.awayScore : match.homeScore}
                  </span>
                ) : (
                  <StatusBadge status={match.status} />
                )}
              </div>
            )
          })}
        </div>

        {/* Key Players */}
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4">Jugadores Destacados</h3>
          <div className="space-y-2">
            {players.map((player, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-700/30">
                <span className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-sm">
                  {i + 1}
                </span>
                <span className="text-slate-200 font-medium">{player}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Squad */}
        {team.players && (() => {
          const positions = ['Arquero', 'Defensor', 'Volante', 'Delantero']
          const grouped = positions.reduce((acc, pos) => {
            acc[pos] = team.players.filter(p => p.position === pos)
            return acc
          }, {})
          const posIcons = { Arquero: '🧤', Defensor: '🛡️', Volante: '⚙️', Delantero: '⚽' }
          return (
            <div className="card p-5 md:col-span-2">
              <h3 className="font-semibold text-white mb-4">
                Convocatoria Oficial · Mundial 2026
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {positions.map(pos => (
                  <div key={pos}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span>{posIcons[pos]}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{pos}es</span>
                    </div>
                    <div className="space-y-1.5">
                      {grouped[pos].map(player => (
                        <div key={player.name} className="bg-slate-700/30 rounded-lg px-3 py-2">
                          <p className="text-sm text-white font-medium leading-tight">{player.name}</p>
                          <p className="text-xs text-slate-500 truncate">{player.club}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

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
