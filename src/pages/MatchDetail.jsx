// MatchDetail.jsx — Página de detalle de un partido con minuto a minuto
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MATCHES } from '../data/matches'
import MatchAI from '../components/ui/MatchAI'
import { useMatchDetail } from '../hooks/useLiveData'
import { getEventIcon, toLocalTime } from '../data/liveData'
import Flag from '../components/ui/Flag'

function EventRow({ event }) {
  const { icon, label } = getEventIcon(event.type, event.detail)
  const isHome = event.team?.id === event.fixture?.homeTeam?.id

  return (
    <div className={`flex items-center gap-3 py-2.5 border-b border-slate-700/20 last:border-0 ${
      isHome ? 'flex-row' : 'flex-row-reverse'
    }`}>
      <span className="text-slate-500 text-xs font-mono w-8 text-center flex-shrink-0">
        {event.time?.elapsed}'
      </span>
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div className={`flex-1 ${isHome ? 'text-left' : 'text-right'}`}>
        <p className="text-sm font-semibold text-white">
          {event.player?.name}
        </p>
        {event.assist?.name && (
          <p className="text-xs text-slate-500">Asistencia: {event.assist.name}</p>
        )}
        <p className="text-xs text-slate-600">{label}</p>
      </div>
    </div>
  )
}

function StatBar({ label, home, away }) {
  const total = (home || 0) + (away || 0)
  const homePct = total > 0 ? Math.round((home / total) * 100) : 50
  const awayPct = 100 - homePct

  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span className="font-bold text-white">{home ?? 0}</span>
        <span className="text-slate-500">{label}</span>
        <span className="font-bold text-white">{away ?? 0}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-700">
        <div className="bg-sky-500 transition-all" style={{ width: `${homePct}%` }} />
        <div className="bg-orange-500 transition-all" style={{ width: `${awayPct}%` }} />
      </div>
    </div>
  )
}

export default function MatchDetail() {
  const { id } = useParams()
  const { events, stats, lineups, loading, error } = useMatchDetail(id)
  const [tab, setTab] = useState('events')
  const matchData = MATCHES?.find(m => m.id === Number(id))
  const homeCode  = matchData?.homeTeam || ''
  const awayCode  = matchData?.awayTeam || ''
  const matchDate = matchData?.date || ''
  const group     = matchData?.group || ''

  const homeStats = stats?.[0]?.statistics || []
  const awayStats = stats?.[1]?.statistics || []

  const getStat = (arr, type) => arr.find(s => s.type === type)?.value

  return (
    <div className="animate-slide-up max-w-3xl mx-auto">
      <Link to="/" className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
        ← Volver
      </Link>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { id: 'events',   label: '⚽ Minuto a minuto' },
          { id: 'stats',    label: '📊 Estadísticas' },
          { id: 'lineups',  label: '👥 Alineaciones' },
          { id: 'ai',       label: '🤖 Análisis IA' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              tab === t.id
                ? 'bg-sky-500 text-white'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-16 text-center text-slate-500">Cargando datos del partido…</div>
      ) : error ? (
        <div className="card p-16 text-center text-slate-500">
          <p className="text-3xl mb-3">⚠️</p>
          <p>No se pudieron cargar los datos.</p>
        </div>
      ) : (
        <>
          {/* Minuto a minuto */}
          {tab === 'events' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-700/50 font-semibold text-white"
                style={{ backgroundColor: '#162032' }}>
                Minuto a minuto
              </div>
              {events.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <p className="text-3xl mb-3">⏱️</p>
                  <p>Los eventos aparecerán cuando inicie el partido.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/20">
                  {[...events].reverse().map((e, i) => (
                    <EventRow key={i} event={e} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Estadísticas */}
          {tab === 'stats' && (
            <div className="card p-5">
              <h3 className="font-semibold text-white mb-5">Estadísticas del partido</h3>
              {homeStats.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Disponibles cuando inicie el partido.</p>
              ) : (
                <>
                  <StatBar label="Posesión" home={parseInt(getStat(homeStats,'Ball Possession'))} away={parseInt(getStat(awayStats,'Ball Possession'))} />
                  <StatBar label="Tiros al arco" home={getStat(homeStats,'Shots on Goal')} away={getStat(awayStats,'Shots on Goal')} />
                  <StatBar label="Total tiros" home={getStat(homeStats,'Total Shots')} away={getStat(awayStats,'Total Shots')} />
                  <StatBar label="Corners" home={getStat(homeStats,'Corner Kicks')} away={getStat(awayStats,'Corner Kicks')} />
                  <StatBar label="Faltas" home={getStat(homeStats,'Fouls')} away={getStat(awayStats,'Fouls')} />
                  <StatBar label="Fueras de juego" home={getStat(homeStats,'Offsides')} away={getStat(awayStats,'Offsides')} />
                  <StatBar label="Tarjetas amarillas" home={getStat(homeStats,'Yellow Cards')} away={getStat(awayStats,'Yellow Cards')} />
                  <StatBar label="Pases completados" home={getStat(homeStats,'Passes accurate')} away={getStat(awayStats,'Passes accurate')} />
                </>
              )}
            </div>
          )}

          {/* Alineaciones */}
          {tab === 'lineups' && (
            <div className="grid md:grid-cols-2 gap-4">
              {lineups.length === 0 ? (
                <div className="card p-16 text-center text-slate-500 md:col-span-2">
                  <p className="text-3xl mb-3">👥</p>
                  <p>Las alineaciones se publican 1 hora antes del partido.</p>
                </div>
              ) : lineups.map((team, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-3"
                    style={{ backgroundColor: '#162032' }}>
                    <img src={team.team?.logo} alt="" width={24} height={24} className="object-contain" />
                    <span className="font-bold text-white text-sm">{team.team?.name}</span>
                    <span className="text-xs text-slate-500 ml-auto">{team.formation}</span>
                  </div>
                  <div className="divide-y divide-slate-700/20">
                    {team.startXI?.map((p, j) => (
                      <div key={j} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="w-6 text-center text-xs font-bold text-sky-400">
                          {p.player?.number}
                        </span>
                        <span className="text-sm text-white">{p.player?.name}</span>
                        <span className="text-xs text-slate-500 ml-auto">{p.player?.pos}</span>
                      </div>
                    ))}
                  </div>
                  {team.substitutes?.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-slate-800/50 text-xs text-slate-500 uppercase tracking-wider">
                        Suplentes
                      </div>
                      {team.substitutes.map((p, j) => (
                        <div key={j} className="flex items-center gap-3 px-4 py-2 opacity-60">
                          <span className="w-6 text-center text-xs font-bold text-slate-500">
                            {p.player?.number}
                          </span>
                          <span className="text-sm text-slate-400">{p.player?.name}</span>
                          <span className="text-xs text-slate-600 ml-auto">{p.player?.pos}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          {/* Análisis IA */}
          {tab === 'ai' && (
            <MatchAI
              homeCode={homeCode}
              awayCode={awayCode}
              matchDate={matchDate}
              group={group}
            />
          )}
        </>
      )}
    </div>
  )
}
