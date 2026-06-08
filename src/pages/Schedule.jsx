import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MATCHES } from '../data/matches'
import { GROUPS } from '../data/groups'
import { VENUES_BY_NAME } from '../data/venues'
import { groupMatchesByDate, formatDayOfWeek, capitalizeFirst } from '../utils/helpers'
import Flag from '../components/ui/Flag'
import TeamCrestImg from '../components/ui/TeamCrestImg'
import { StatusBadge } from '../components/ui/Badge'

const ALL_TEAMS_MAP = Object.fromEntries(
  GROUPS.flatMap(g => g.teams.map(t => [t.code, t]))
)

function VenuePhoto({ venueName }) {
  const [imgErr, setImgErr] = useState(false)
  const venue = VENUES_BY_NAME?.[venueName]
  if (!venue) return null

  return (
    <div className="mx-4 mb-3 rounded-xl overflow-hidden border border-slate-700/40 flex flex-col sm:flex-row gap-0">
      {/* Image */}
      <div className="relative sm:w-64 flex-shrink-0" style={{ height: '140px' }}>
        {venue.image && !imgErr ? (
          <img
            src={venue.image}
            alt={venue.name}
            className="w-full h-full"
            style={{ objectFit: 'cover' }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0B1120, #1E3A5F)' }}
          >
            <span className="text-4xl">🏟️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      {/* Info */}
      <div className="flex-1 bg-slate-800/60 px-4 py-3 flex flex-col justify-center gap-1">
        <p className="text-white font-bold text-sm">{venue.name}</p>
        <p className="text-slate-400 text-xs">{venue.city} · {venue.country}</p>
        <p className="text-sky-400 text-xs font-semibold mt-1">
          🏟️ {venue.capacity.toLocaleString()} espectadores
        </p>
      </div>
    </div>
  )
}

function MatchRow({ match }) {
  const home = ALL_TEAMS_MAP[match.homeTeam]
  const away = ALL_TEAMS_MAP[match.awayTeam]
  const isLive = ['live','1H','HT','2H','ET','PEN'].includes(match.status)

  // Convertir hora ET a local
  function toLocal(date, timeET) {
    if (!timeET) return '--:--'
    try {
      const d = new Date(`${date}T${timeET.slice(0,5)}:00-04:00`)
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz })
    } catch { return timeET }
  }

  return (
    <Link
      to={`/partido/${match.id}`}
      className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-slate-700/20 transition-colors border-b border-slate-700/20 last:border-0 group"
    >
      {/* Time & group */}
      <div className="sm:w-24 flex sm:flex-col items-center sm:items-start gap-2">
        <span className={`text-sm font-mono font-bold ${isLive ? 'text-sky-400' : 'text-orange-400'}`}>
          {toLocal(match.date, match.time)}
        </span>
        <span className="text-xs text-slate-600">
          {match.group && match.group.length <= 2 ? `Grupo ${match.group}` : match.group}
          {match.matchday ? ` · J${match.matchday}` : ''}
        </span>
      </div>

      {/* Teams */}
      <div className="flex-1 flex items-center gap-4 justify-center">
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="font-semibold text-white text-sm text-right hidden md:block group-hover:text-sky-300 transition-colors">
            {home?.name || match.homeTeam}
          </span>
          <span className="text-xs text-slate-400 sm:hidden">{match.homeTeam}</span>
          {home && (
            <TeamCrestImg
              code={home.code}
              name={home.name}
              size={24}
              fallback={<Flag iso2={home.iso2} size="xs" />}
            />
          )}
        </div>

        <div className="text-center min-w-[56px]">
          {match.homeScore !== null ? (
            <span className={`font-black text-lg tabular-nums ${isLive ? 'text-sky-400' : 'text-white'}`}>
              {match.homeScore}–{match.awayScore}
            </span>
          ) : (
            <span className="text-slate-600 text-sm font-mono">vs</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1">
          {away && (
            <TeamCrestImg
              code={away.code}
              name={away.name}
              size={24}
              fallback={<Flag iso2={away.iso2} size="xs" />}
            />
          )}
          <span className="font-semibold text-white text-sm hidden md:block group-hover:text-sky-300 transition-colors">
            {away?.name || match.awayTeam}
          </span>
          <span className="text-xs text-slate-400 sm:hidden">{match.awayTeam}</span>
        </div>
      </div>

      {/* Status & venue */}
      <div className="sm:w-48 flex sm:flex-col items-center sm:items-end gap-2">
        <StatusBadge status={match.status} />
        <span className="text-xs text-slate-500 text-right truncate max-w-[180px]">
          📍 {match.venue}
        </span>
        <span className="text-xs text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Ver detalles →
        </span>
      </div>
    </Link>
  )
}

export default function Schedule() {
  const [groupFilter, setGroupFilter] = useState('Todos')
  const [mdFilter, setMdFilter]       = useState('Todos')
  const [countryFilter, setCountryFilter] = useState('Todos')
  const [search, setSearch]           = useState('')

  const filtered = useMemo(() => {
    return MATCHES.filter(m => {
      if (groupFilter !== 'Todos' && m.group !== groupFilter) return false
      if (mdFilter !== 'Todos' && m.matchday !== Number(mdFilter)) return false
      if (countryFilter !== 'Todos' && m.country !== countryFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const h = ALL_TEAMS_MAP[m.homeTeam]?.name?.toLowerCase() || m.homeTeam.toLowerCase()
        const a = ALL_TEAMS_MAP[m.awayTeam]?.name?.toLowerCase() || m.awayTeam.toLowerCase()
        const v = m.venue.toLowerCase()
        if (!h.includes(q) && !a.includes(q) && !v.includes(q)) return false
      }
      return true
    })
  }, [groupFilter, mdFilter, countryFilter, search])

  const byDate = groupMatchesByDate(filtered)

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Calendario · Mundial 2026</h1>
        <p className="text-slate-400 mt-1">
          {MATCHES.length} partidos · Haz clic en cualquier partido para ver el estadio
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total partidos', value: MATCHES.length },
          { label: 'Sedes USA',      value: MATCHES.filter(m => m.country === 'USA').length },
          { label: 'Sedes México',   value: MATCHES.filter(m => m.country === 'MEX').length },
          { label: 'Sedes Canadá',   value: MATCHES.filter(m => m.country === 'CAN').length },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl font-black text-sky-400">{s.value}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            type="text"
            placeholder="Buscar equipo o estadio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
          />
        </div>

        {/* Group + Matchday + Country */}
        <div className="flex flex-wrap gap-3">
          {/* Group */}
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-slate-500 self-center mr-1 uppercase tracking-wider">Grupo:</span>
            <button
              onClick={() => setGroupFilter('Todos')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${groupFilter === 'Todos' ? 'bg-sky-500 text-white border-sky-500' : 'border-slate-700 text-slate-400'}`}
            >
              Todos
            </button>
            {'ABCDEFGHIJKL'.split('').map(g => (
              <button
                key={g}
                onClick={() => setGroupFilter(g)}
                className={`w-7 h-7 rounded-md text-xs font-bold border transition-all ${groupFilter === g ? 'bg-sky-500 text-white border-sky-500' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Matchday */}
          <div className="flex gap-1">
            <span className="text-xs text-slate-500 self-center mr-1 uppercase tracking-wider">Jornada:</span>
            {['Todos','1','2','3'].map(md => (
              <button
                key={md}
                onClick={() => setMdFilter(md)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${mdFilter === md ? 'bg-sky-500 text-white border-sky-500' : 'border-slate-700 text-slate-400'}`}
              >
                {md === 'Todos' ? 'Todas' : `J${md}`}
              </button>
            ))}
          </div>

          {/* Host country */}
          <div className="flex gap-1">
            <span className="text-xs text-slate-500 self-center mr-1 uppercase tracking-wider">País:</span>
            {['Todos','USA','MEX','CAN'].map(c => (
              <button
                key={c}
                onClick={() => setCountryFilter(c)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${countryFilter === c ? 'bg-orange-500 text-white border-orange-500' : 'border-slate-700 text-slate-400'}`}
              >
                {c === 'Todos' ? 'Todos' : c === 'USA' ? '🇺🇸' : c === 'MEX' ? '🇲🇽' : '🇨🇦'} {c !== 'Todos' && c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">
        <span className="text-white font-semibold">{filtered.length}</span> partidos encontrados
      </p>

      {byDate.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-slate-400">No se encontraron partidos con ese filtro</p>
          <button onClick={() => { setSearch(''); setGroupFilter('Todos'); setMdFilter('Todos'); setCountryFilter('Todos') }}
            className="btn-secondary mt-4">
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {byDate.map(([date, matches]) => (
            <div key={date} className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between"
                style={{ backgroundColor: '#162032' }}>
                <h3 className="font-semibold text-white">
                  {capitalizeFirst(formatDayOfWeek(date))}
                </h3>
                <span className="text-xs text-slate-500">{matches.length} partido{matches.length !== 1 ? 's' : ''}</span>
              </div>
              {matches.map(m => <MatchRow key={m.id} match={m} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
