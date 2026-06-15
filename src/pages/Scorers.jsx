import { useTopStats } from '../hooks/useLiveData'
import { GROUPS } from '../data/groups'
import { TEAM_IDS } from '../data/teamIds'
import { esTeamName } from '../data/teamNames'
import Flag from '../components/ui/Flag'

// Alias inverso: claves TEAM_IDS → códigos de GROUPS
const CODE_ALIAS_REV = { ZAF: 'RSA', HTI: 'HAI', PRY: 'PAR' }
const ALL_TEAMS = Object.fromEntries(GROUPS.flatMap(g => g.teams.map(t => [t.code, t])))

// API team id → iso2
const TEAM_ID_TO_ISO2 = {}
for (const [code, id] of Object.entries(TEAM_IDS)) {
  const matchCode = CODE_ALIAS_REV[code] ?? code
  const team = ALL_TEAMS[matchCode]
  if (team) TEAM_ID_TO_ISO2[id] = team.iso2
}

function PlayerRow({ item, rank, type }) {
  const player = item.player
  const stat   = item.statistics?.[0]
  const count  = type === 'scorers' ? stat?.goals?.total : stat?.goals?.assists
  const iso2   = TEAM_ID_TO_ISO2[stat?.team?.id]

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/20 last:border-0 hover:bg-slate-700/20 transition-colors">
      {/* Rank */}
      <span className={`w-7 text-center font-black text-sm flex-shrink-0 ${
        rank === 1 ? 'text-yellow-400' :
        rank === 2 ? 'text-slate-300' :
        rank === 3 ? 'text-amber-600' :
        'text-slate-600'
      }`}>
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
      </span>

      {/* Foto con fallback a bandera del país */}
      <img
        src={player?.photo}
        alt={player?.name}
        width={36} height={36}
        className="w-9 h-9 rounded-full object-cover bg-slate-700 flex-shrink-0"
        onError={e => {
          if (iso2 && e.currentTarget.src !== `https://flagcdn.com/40x30/${iso2}.png`) {
            e.currentTarget.src = `https://flagcdn.com/40x30/${iso2}.png`
            e.currentTarget.className = 'w-9 h-7 rounded object-cover bg-slate-700 flex-shrink-0 mt-1'
          } else {
            e.currentTarget.style.display = 'none'
          }
        }}
      />

      {/* Nombre + Equipo con bandera */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm truncate">{player?.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {iso2 && <Flag iso2={iso2} size="xs" />}
          <span className="text-xs text-slate-500 truncate">{esTeamName(stat?.team)}</span>
        </div>
      </div>

      {/* Stat */}
      <div className="text-right flex-shrink-0 min-w-[2.5rem]">
        <span className="text-xl font-black text-sky-400">{count ?? 0}</span>
        <p className="text-[10px] text-slate-500">{type === 'scorers' ? 'goles' : 'asist.'}</p>
      </div>
    </div>
  )
}

function StatsSection({ data, type, loading, title, icon, emptyMsg }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-3">
        <span>{icon}</span> {title}
      </h2>
      <div className="card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-700/50 flex justify-between items-center"
          style={{ backgroundColor: '#162032' }}>
          <span className="text-xs text-slate-500 uppercase tracking-wider">{title} del torneo</span>
          <span className="text-xs text-slate-600">{loading ? '…' : `${data.length} jugadores`}</span>
        </div>

        {type === 'scorers' && (
          <p className="px-4 pt-2.5 text-[10px] text-slate-600">
            * Los autogoles no se contabilizan en esta tabla
          </p>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Cargando estadísticas…</div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p className="text-3xl mb-2">{icon}</p>
            <p className="text-sm">{emptyMsg}</p>
          </div>
        ) : (
          <div>
            {/* Header fila */}
            <div className="flex items-center gap-3 px-4 py-1.5 border-b border-slate-700/30 text-[10px] text-slate-600 uppercase tracking-wider">
              <span className="w-7 text-center flex-shrink-0">#</span>
              <span className="w-9 flex-shrink-0" />
              <span className="flex-1">Jugador</span>
              <span className="min-w-[2.5rem] text-right">{type === 'scorers' ? 'Goles' : 'Asist.'}</span>
            </div>
            {data.map((item, i) => (
              <PlayerRow key={item.player?.id ?? i} item={item} rank={i + 1} type={type} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Scorers() {
  const { scorers, assists, loading, refetch } = useTopStats()

  const filteredScorers = [...(scorers ?? [])]
    .filter(item => (item.statistics?.[0]?.goals?.total ?? 0) > 0)
    .sort((a, b) => {
      const ga = a.statistics?.[0]?.goals?.total ?? 0
      const gb = b.statistics?.[0]?.goals?.total ?? 0
      if (gb !== ga) return gb - ga
      const aa = a.statistics?.[0]?.goals?.assists ?? 0
      const ab = b.statistics?.[0]?.goals?.assists ?? 0
      return ab - aa
    })

  const filteredAssists = [...(assists ?? [])]
    .filter(item => (item.statistics?.[0]?.goals?.assists ?? 0) > 0)
    .sort((a, b) => {
      const aa = a.statistics?.[0]?.goals?.assists ?? 0
      const ab = b.statistics?.[0]?.goals?.assists ?? 0
      if (ab !== aa) return ab - aa
      const ga = a.statistics?.[0]?.goals?.total ?? 0
      const gb = b.statistics?.[0]?.goals?.total ?? 0
      return gb - ga
    })

  return (
    <div className="animate-slide-up space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Estadísticas · Mundial 2026</h1>
          <p className="text-slate-400 mt-1">Goleadores y asistidores del torneo</p>
        </div>
        <button onClick={refetch} className="btn-secondary text-xs" disabled={loading}>
          {loading ? '⟳' : '↺'} Actualizar
        </button>
      </div>

      <StatsSection
        data={filteredScorers}
        type="scorers"
        loading={loading}
        title="Goleadores"
        icon="⚽"
        emptyMsg="Aún no hay goleadores registrados"
      />

      <StatsSection
        data={filteredAssists}
        type="assists"
        loading={loading}
        title="Asistidores"
        icon="🎯"
        emptyMsg="Aún no hay asistidores registrados"
      />
    </div>
  )
}
