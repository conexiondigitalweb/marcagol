import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ALL_TEAMS } from '../data/groups'
import { getConfederationColor } from '../utils/helpers'
import Flag from '../components/ui/Flag'
import { ConfederationBadge, GroupBadge } from '../components/ui/Badge'

const CONFEDERATIONS = ['Todos', 'UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC']

function TeamCard({ team }) {
  return (
    <Link to={`/equipos/${team.code}`} className="card-hover p-4 flex items-center gap-3 group">
      <Flag iso2={team.iso2} size="md" className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white group-hover:text-sky-400 transition-colors truncate">
          {team.name}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <ConfederationBadge confederation={team.confederation} />
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <GroupBadge group={team.group} />
        <div className="text-xs text-orange-400 mt-1 font-semibold">#{team.fifaRanking} FIFA</div>
      </div>
    </Link>
  )
}

export default function Teams() {
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('Todos')
  const [sortBy, setSortBy]   = useState('ranking')

  const teams = useMemo(() => {
    let result = ALL_TEAMS.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                         t.code.toLowerCase().includes(search.toLowerCase())
      const matchFilter = filter === 'Todos' || t.confederation === filter
      return matchSearch && matchFilter
    })
    if (sortBy === 'ranking')  result.sort((a, b) => a.fifaRanking - b.fifaRanking)
    if (sortBy === 'name')     result.sort((a, b) => a.name.localeCompare(b.name))
    if (sortBy === 'group')    result.sort((a, b) => a.group.localeCompare(b.group))
    return result
  }, [search, filter, sortBy])

  const confCounts = useMemo(() =>
    CONFEDERATIONS.slice(1).reduce((acc, c) => ({
      ...acc, [c]: ALL_TEAMS.filter(t => t.confederation === c).length,
    }), {})
  , [])

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Equipos · Mundial 2026</h1>
        <p className="text-slate-400 mt-1">48 selecciones clasificadas de 6 confederaciones</p>
      </div>

      {/* Confederation summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {CONFEDERATIONS.slice(1).map(conf => (
          <button
            key={conf}
            onClick={() => setFilter(f => f === conf ? 'Todos' : conf)}
            className={`p-3 rounded-xl border text-center transition-all ${
              filter === conf
                ? getConfederationColor(conf) + ' scale-105'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <div className="text-xs font-bold mb-0.5">{conf}</div>
            <div className="text-2xl font-black text-white">{confCounts[conf]}</div>
            <div className="text-xs text-slate-500">equipos</div>
          </button>
        ))}
      </div>

      {/* Search & Sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            type="text"
            placeholder="Buscar selección..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
          />
        </div>

        <div className="flex gap-2">
          {[
            { value: 'ranking', label: '🏅 Ranking' },
            { value: 'name',    label: '🔤 Nombre'  },
            { value: 'group',   label: '📊 Grupo'   },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`btn-secondary text-xs px-3 ${sortBy === opt.value ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {CONFEDERATIONS.map(conf => (
          <button
            key={conf}
            onClick={() => setFilter(conf)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              filter === conf
                ? 'bg-sky-500 text-white border-sky-500'
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {conf} {conf !== 'Todos' && `(${confCounts[conf] || 0})`}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">
        Mostrando <span className="text-white font-semibold">{teams.length}</span> de 48 equipos
      </p>

      {/* Teams grid */}
      {teams.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-slate-400">No se encontraron equipos para "{search}"</p>
          <button onClick={() => { setSearch(''); setFilter('Todos') }} className="btn-secondary mt-4">
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {teams.map(team => <TeamCard key={team.code} team={team} />)}
        </div>
      )}
    </div>
  )
}
