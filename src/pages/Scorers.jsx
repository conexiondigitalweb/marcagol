// Scorers.jsx — Goleadores y asistidores del Mundial 2026
import { useState } from 'react'
import { useTopStats } from '../hooks/useLiveData'

function PlayerRow({ player, stat, rank, type }) {
  const goals = type === 'scorers'
    ? stat.goals?.total
    : stat.goals?.assists

  return (
    <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-700/20 last:border-0 hover:bg-slate-700/20 transition-colors">
      {/* Rank */}
      <span className={`w-8 text-center font-black text-lg ${
        rank === 1 ? 'text-yellow-400' :
        rank === 2 ? 'text-slate-300' :
        rank === 3 ? 'text-amber-600' :
        'text-slate-600'
      }`}>
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
      </span>

      {/* Photo */}
      <img
        src={player.photo}
        alt={player.name}
        width={40} height={40}
        className="rounded-full object-cover bg-slate-700 flex-shrink-0"
        onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${player.name}&background=1E293B&color=38BDF8&size=40` }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm truncate">{player.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <img
            src={stat.team?.logo}
            alt={stat.team?.name}
            width={16} height={16}
            className="object-contain"
          />
          <span className="text-xs text-slate-500 truncate">{stat.team?.name}</span>
        </div>
      </div>

      {/* Stat */}
      <div className="text-right flex-shrink-0">
        <span className="text-2xl font-black text-sky-400">{goals ?? 0}</span>
        <p className="text-xs text-slate-500">{type === 'scorers' ? 'goles' : 'asist.'}</p>
      </div>
    </div>
  )
}

export default function Scorers() {
  const { scorers, assists, loading, error, refetch } = useTopStats()
  const [tab, setTab] = useState('scorers')

  const data = tab === 'scorers' ? scorers : assists

  return (
    <div className="animate-slide-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Estadísticas · Mundial 2026</h1>
          <p className="text-slate-400 mt-1">Goleadores y asistidores del torneo</p>
        </div>
        <button onClick={refetch} className="btn-secondary text-xs" disabled={loading}>
          {loading ? '⟳' : '↺'} Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'scorers', label: '⚽ Goleadores' },
          { id: 'assists', label: '🎯 Asistidores' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              tab === t.id
                ? 'bg-sky-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700/50 flex justify-between items-center"
          style={{ backgroundColor: '#162032' }}>
          <span className="font-semibold text-white">
            {tab === 'scorers' ? 'Tabla de Goleadores' : 'Tabla de Asistidores'}
          </span>
          <span className="text-xs text-slate-500">{data.length} jugadores</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">Cargando estadísticas…</div>
        ) : error ? (
          <div className="py-20 text-center text-slate-500">
            <p className="text-3xl mb-3">⚠️</p>
            <p>Error al cargar. El torneo aún no ha comenzado.</p>
            <p className="text-xs mt-2 text-slate-600">Los datos estarán disponibles desde el 11 de junio.</p>
          </div>
        ) : data.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p className="text-3xl mb-3">⚽</p>
            <p>Los datos estarán disponibles desde el 11 de junio.</p>
          </div>
        ) : (
          data.slice(0, 20).map((item, i) => (
            <PlayerRow
              key={item.player?.id}
              player={item.player}
              stat={item.statistics?.[0]}
              rank={i + 1}
              type={tab}
            />
          ))
        )}
      </div>
    </div>
  )
}
