// LiveScores.jsx — Componente de marcadores en vivo
// Se usa en el Dashboard principal

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveMatches, useTodayMatches } from '../../hooks/useLiveData'
import { toLocalTime, getMatchStatus, getEventIcon } from '../../data/liveData'
import Flag from './Flag'

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
      <span className="text-xs font-bold text-red-400">EN VIVO</span>
    </span>
  )
}

function MatchCard({ fixture, isLive }) {
  const home = fixture.teams?.home
  const away = fixture.teams?.away
  const goals = fixture.goals
  const status = fixture.fixture?.status
  const minute = status?.elapsed

  const isActive = ['1H','HT','2H','ET','P','LIVE'].includes(status?.short)

  return (
    <Link
      to={`/partido/${fixture.fixture?.id}`}
      className={`block p-4 rounded-xl border transition-all hover:border-sky-500/40 ${
        isActive
          ? 'bg-slate-800/80 border-red-500/30'
          : 'bg-slate-800/40 border-slate-700/40'
      }`}
    >
      {/* Status */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500">
          {fixture.league?.round?.replace('Group Stage -', 'Grupo')}
        </span>
        {isActive ? (
          <span className="text-xs font-bold text-red-400">
            {minute ? `${minute}'` : getMatchStatus(fixture.fixture)}
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            {status?.short === 'FT' ? 'Final' : toLocalTime(fixture.fixture?.date)}
          </span>
        )}
      </div>

      {/* Teams & Score */}
      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className={`text-sm font-semibold truncate ${
            goals?.home > goals?.away ? 'text-white' : 'text-slate-400'
          }`}>
            {home?.name}
          </span>
          {home?.logo ? (
            <img src={home.logo} alt="" width={24} height={24} className="object-contain" />
          ) : null}
        </div>

        {/* Score */}
        <div className={`text-center min-w-[52px] px-2 py-1 rounded-lg ${
          isActive ? 'bg-red-500/10' : 'bg-slate-700/40'
        }`}>
          {status?.short === 'NS' ? (
            <span className="text-xs text-slate-500">vs</span>
          ) : (
            <span className={`font-black text-lg tabular-nums ${
              isActive ? 'text-red-400' : 'text-white'
            }`}>
              {goals?.home ?? 0}–{goals?.away ?? 0}
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center gap-2">
          {away?.logo ? (
            <img src={away.logo} alt="" width={24} height={24} className="object-contain" />
          ) : null}
          <span className={`text-sm font-semibold truncate ${
            goals?.away > goals?.home ? 'text-white' : 'text-slate-400'
          }`}>
            {away?.name}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function LiveScores() {
  const { matches: liveMatches, loading: liveLoading } = useLiveMatches()
  const { matches: todayMatches, loading: todayLoading } = useTodayMatches()
  const [tab, setTab] = useState('today')

  const hasLive = liveMatches.length > 0
  const displayed = tab === 'live' ? liveMatches : todayMatches

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between"
        style={{ backgroundColor: '#162032' }}>
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-white">Partidos</h3>
          {hasLive && <LiveBadge />}
        </div>
        <div className="flex gap-1">
          {hasLive && (
            <button
              onClick={() => setTab('live')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                tab === 'live'
                  ? 'bg-red-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              En vivo ({liveMatches.length})
            </button>
          )}
          <button
            onClick={() => setTab('today')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              tab === 'today'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {(tab === 'live' ? liveLoading : todayLoading) ? (
          <div className="text-center py-8 text-slate-500 text-sm">Cargando partidos…</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">⚽</p>
            <p className="text-slate-500 text-sm">
              {tab === 'live' ? 'No hay partidos en vivo ahora' : 'No hay partidos hoy'}
            </p>
          </div>
        ) : (
          displayed.map(f => (
            <MatchCard
              key={f.fixture?.id}
              fixture={f}
              isLive={tab === 'live'}
            />
          ))
        )}
      </div>
    </div>
  )
}
