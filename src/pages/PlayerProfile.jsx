import { useParams, Link } from 'react-router-dom'
import { getSquad }        from '../data/squads'
import { getTeamByCode }   from '../data/groups'
import { formatDate }      from '../utils/helpers'
import { usePlayerData }   from '../hooks/usePlayerData'
import { TEAM_IDS }        from '../data/teamIds'
import Flag                from '../components/ui/Flag'

const POS_CONFIG = {
  Portero:       { color: '#F59E0B', bg: 'bg-amber-500/10   border-amber-500/30',   text: 'text-amber-400',   icon: '🧤' },
  Defensor:      { color: '#38BDF8', bg: 'bg-sky-500/10     border-sky-500/30',     text: 'text-sky-400',     icon: '🛡️' },
  Mediocampista: { color: '#34D399', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', icon: '⚙️' },
  Delantero:     { color: '#F87171', bg: 'bg-red-500/10     border-red-500/30',     text: 'text-red-400',     icon: '⚽' },
}

function StatBox({ icon, value, label }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-black text-xl text-white">{value ?? '—'}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

function ApiStatRow({ label, value }) {
  if (value === null || value === undefined) return null
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-700/30 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  )
}

function StatsSection({ stats, season }) {
  if (!stats) return null
  const g  = stats.games    || {}
  const gl = stats.goals    || {}
  const sh = stats.shots    || {}
  const dr = stats.dribbles || {}
  const ca = stats.cards    || {}
  const pa = stats.passes   || {}

  const rating = g.rating ? parseFloat(g.rating).toFixed(1) : null

  return (
    <div className="card p-5 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-white">Estadísticas {season}</h2>
        {rating && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400">
            Rating {rating}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-8">
        <div>
          <ApiStatRow label="Partidos"    value={g.appearences} />
          <ApiStatRow label="Minutos"     value={g.minutes != null ? `${g.minutes}'` : null} />
          <ApiStatRow label="Goles"       value={gl.total} />
          <ApiStatRow label="Asistencias" value={gl.assists} />
        </div>
        <div>
          <ApiStatRow label="Remates"          value={sh.total != null ? `${sh.on ?? 0}/${sh.total}` : null} />
          <ApiStatRow label="Regates (éxito)"  value={dr.attempts != null ? `${dr.success ?? 0}/${dr.attempts}` : null} />
          <ApiStatRow label="Pases clave"      value={pa.key} />
          <ApiStatRow label="Tarjetas"         value={
            (ca.yellow != null || ca.red != null)
              ? `🟨${ca.yellow ?? 0}  🟥${ca.red ?? 0}`
              : null
          } />
        </div>
      </div>
    </div>
  )
}

export default function PlayerProfile() {
  const { team: teamCode, number } = useParams()
  const code   = teamCode?.toUpperCase()
  const num    = parseInt(number, 10)
  const squad  = getSquad(code)
  const team   = getTeamByCode(code)
  const player = squad?.players?.find(p => p.number === num)

  const { photo, stats, season, loading } = usePlayerData(player?.name ?? null, TEAM_IDS[code])

  if (!player || !team) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-slate-400 text-lg">Jugador no encontrado</p>
        <Link to="/equipos" className="text-sky-400 hover:text-sky-300 mt-4 inline-block">
          ← Volver a Equipos
        </Link>
      </div>
    )
  }

  const pos        = POS_CONFIG[player.position] || POS_CONFIG.Defensor
  const clubName   = player.club.replace(/\s*\([A-Z]{2,3}\)$/, '')
  const clubCountry = player.club.match(/\(([A-Z]{2,3})\)$/)?.[1] || ''

  return (
    <div className="animate-slide-up max-w-2xl mx-auto">

      {/* Back */}
      <Link
        to={`/equipos/${code}`}
        className="text-slate-400 hover:text-white text-sm transition-colors mb-4 inline-flex items-center gap-1"
      >
        ← {team.name}
      </Link>

      {/* Hero banner */}
      <div
        className="relative rounded-xl overflow-hidden mb-6 flex items-center justify-center"
        style={{
          height: '180px',
          background: `linear-gradient(135deg, ${pos.color}33 0%, ${pos.color}11 100%)`,
          backgroundColor: '#0F172A',
        }}
      >
        <img
          src={`https://flagcdn.com/w320/${team.iso2.toLowerCase()}.png`}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />
        <div className="relative z-10 flex flex-col items-center gap-2">
          {photo ? (
            <img
              src={photo}
              alt={player.shirtName}
              className="w-20 h-20 rounded-full object-cover shadow-xl"
              style={{ border: `3px solid ${pos.color}66` }}
              onError={(e) => { e.target.onerror = null; e.target.style.display = 'none' }}
            />
          ) : loading ? (
            <div className="w-20 h-20 rounded-full bg-slate-700/60 animate-pulse" />
          ) : (
            <span className="text-5xl">{pos.icon}</span>
          )}
          <div className="flex items-center gap-2">
            <Flag iso2={team.iso2} size="sm" />
            <span className="text-slate-300 text-sm">{team.name}</span>
          </div>
        </div>
      </div>

      {/* Name card */}
      <div className="card p-6 mb-4 relative overflow-hidden" style={{ borderColor: pos.color + '30' }}>
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: `radial-gradient(circle at top left, ${pos.color}, transparent 60%)` }}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border mb-3 ${pos.bg} ${pos.text}`}>
              {pos.icon} {player.position}
            </span>
            <h1 className="text-3xl font-black text-white leading-tight">
              {player.name.split(' ').slice(1).join(' ') || player.name}
            </h1>
            <p className="text-slate-400 text-lg font-medium">
              {player.name.split(' ')[0]}
            </p>
          </div>
          <div
            className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-black"
            style={{ background: pos.color + '22', color: pos.color }}
          >
            {player.number}
          </div>
        </div>
      </div>

      {/* Stats grid (datos squads) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatBox icon="🎽" value={`#${player.number}`}    label="Dorsal"    />
        <StatBox icon="🎂" value={`${player.age} años`}   label="Edad"      />
        <StatBox icon="📏" value={`${player.height} cm`}  label="Altura"    />
        <StatBox icon="🌍" value={team.code}               label="Selección" />
      </div>

      {/* Detail rows */}
      <div className="card p-5 space-y-0">
        {[
          { label: 'Nombre completo',    value: player.name },
          { label: 'Nombre en camiseta', value: player.shirtName },
          { label: 'Fecha de nacimiento', value: formatDate(player.birth) },
          { label: 'Club',               value: clubName + (clubCountry ? ` · ${clubCountry}` : '') },
          { label: 'Posición',           value: player.position },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex justify-between items-center py-3 border-b border-slate-700/30 last:border-0 gap-4"
          >
            <span className="text-sm text-slate-500 flex-shrink-0">{label}</span>
            <span className="text-sm font-medium text-white text-right">{value}</span>
          </div>
        ))}
      </div>

      {/* API stats — solo cuando hay datos */}
      {loading && (
        <div className="card p-5 mt-4 flex items-center gap-3 text-slate-500 text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-sky-400 animate-spin flex-shrink-0" />
          Buscando estadísticas de temporada…
        </div>
      )}
      <StatsSection stats={stats} season={season} />

      <p className="text-xs text-slate-600 text-center mt-4">
        Datos FIFA: convocatoria oficial Mundial 2026
        {stats && season ? ` · Estadísticas: API-Football ${season}` : ''}
      </p>
    </div>
  )
}
