// MatchDetail.jsx — Página de detalle de un partido
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MATCHES } from '../data/matches'
import { VENUES_BY_NAME } from '../data/venues'
import { BROADCAST_BY_COUNTRY } from '../data/broadcast'
import MatchAI from '../components/ui/MatchAI'
import { useMatchDetail } from '../hooks/useLiveData'
import { getEventIcon } from '../data/liveData'
import Flag from '../components/ui/Flag'
import { GROUPS } from '../data/groups'

const ALL_TEAMS = Object.fromEntries(
  GROUPS.flatMap(g => g.teams.map(t => [t.code, t]))
)

const API_KEY = '217e3ccfd4e714fba62caf18ed3ef01d'

// Convierte hora ET a local del usuario
function toLocal(date, timeET) {
  if (!timeET) return { time: '--:--', tz: '' }
  try {
    const d = new Date(`${date}T${timeET.slice(0,5)}:00-04:00`)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const time = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz })
    const tzAbbr = d.toLocaleTimeString('en', { timeZoneName: 'short', timeZone: tz }).split(' ').pop()
    return { time, tz: tzAbbr }
  } catch { return { time: timeET, tz: 'ET' } }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  } catch { return dateStr }
}

// ─── Header del partido ───────────────────────────────────────────────────────
function MatchHeader({ match, liveData }) {
  const home = ALL_TEAMS[match.homeTeam]
  const away = ALL_TEAMS[match.awayTeam]
  const venue = VENUES_BY_NAME[match.venue]
  const { time, tz } = toLocal(match.date, match.time)
  const isLive = liveData && ['1H','HT','2H','ET','PEN','LIVE'].includes(liveData.status)
  const isFinished = liveData && ['FT','AET','PEN'].includes(liveData.status)

  // Canales para Colombia
  const colBroadcast = BROADCAST_BY_COUNTRY
    .flatMap(r => r.countries)
    .find(c => c.iso2 === 'co')

  return (
    <div className="card overflow-hidden mb-6">
      {/* Fondo degradado */}
      <div className="relative p-6" style={{
        background: 'linear-gradient(135deg, #0F2442 0%, #162032 100%)',
        borderBottom: '1px solid rgba(56,189,248,0.15)'
      }}>
        {/* Grupo + Jornada */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
            Grupo {match.group} · Jornada {match.matchday} · Copa Mundial 2026
          </span>
          {isLive && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"/>
              <span className="text-xs font-bold text-red-400">EN VIVO</span>
            </span>
          )}
          {isFinished && (
            <span className="px-3 py-1 rounded-full bg-slate-700 text-xs text-slate-400 font-semibold">
              Finalizado
            </span>
          )}
          {!isLive && !isFinished && (
            <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-xs text-orange-400 font-semibold">
              Próximo
            </span>
          )}
        </div>

        {/* Equipos y marcador */}
        <div className="flex items-center justify-between gap-4">
          {/* Local */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <img
              src={`https://flagcdn.com/w80/${home?.iso2?.toLowerCase()}.png`}
              alt={home?.name}
              className="w-16 h-12 object-cover rounded-lg shadow-lg"
              onError={e => e.target.style.display='none'}
            />
            <Link to={`/equipos/${match.homeTeam}`} className="text-white font-black text-center text-lg hover:text-sky-400 transition-colors">
              {home?.name || match.homeTeam}
            </Link>
            <span className="text-xs text-slate-500">#{home?.fifaRanking} FIFA</span>
          </div>

          {/* Marcador / Hora */}
          <div className="text-center flex-shrink-0">
            {(isLive || isFinished) && liveData ? (
              <div>
                <div className={`text-5xl font-black tabular-nums ${isLive ? 'text-sky-400' : 'text-white'}`}>
                  {liveData.homeScore ?? 0} – {liveData.awayScore ?? 0}
                </div>
                {isLive && liveData.minute && (
                  <div className="text-red-400 text-sm font-bold mt-1">{liveData.minute}'</div>
                )}
                {isFinished && <div className="text-slate-500 text-xs mt-1">Final</div>}
              </div>
            ) : (
              <div>
                <div className="text-4xl font-black text-orange-400">{time}</div>
                <div className="text-xs text-slate-500 mt-1">{tz}</div>
                <div className="text-xs text-slate-600 mt-1">{formatDate(match.date)}</div>
              </div>
            )}
          </div>

          {/* Visitante */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <img
              src={`https://flagcdn.com/w80/${away?.iso2?.toLowerCase()}.png`}
              alt={away?.name}
              className="w-16 h-12 object-cover rounded-lg shadow-lg"
              onError={e => e.target.style.display='none'}
            />
            <Link to={`/equipos/${match.awayTeam}`} className="text-white font-black text-center text-lg hover:text-sky-400 transition-colors">
              {away?.name || match.awayTeam}
            </Link>
            <span className="text-xs text-slate-500">#{away?.fifaRanking} FIFA</span>
          </div>
        </div>
      </div>

      {/* Info del partido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-700/50">
        <div className="p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">🏟️ Estadio</p>
          <p className="text-sm font-semibold text-white truncate">{match.venue}</p>
          <p className="text-xs text-slate-500">{match.city}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">👥 Capacidad</p>
          <p className="text-sm font-semibold text-white">
            {venue?.capacity ? venue.capacity.toLocaleString() : '—'}
          </p>
          <p className="text-xs text-slate-500">{match.country === 'USA' ? '🇺🇸' : match.country === 'MEX' ? '🇲🇽' : '🇨🇦'} {match.country}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">📺 Ver en Colombia</p>
          <div className="flex flex-wrap justify-center gap-1">
            {colBroadcast?.channels?.slice(0,2).map(ch => (
              <span key={ch.name} className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400">
                {ch.name}
              </span>
            )) || <span className="text-xs text-slate-500">Por confirmar</span>}
          </div>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">🟨 Árbitro</p>
          <p className="text-sm font-semibold text-white">
            {liveData?.referee || 'Por confirmar'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Odds de apuestas ─────────────────────────────────────────────────────────
function OddsPanel({ fixtureId }) {
  const [odds, setOdds] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!fixtureId) return
    fetch(`https://v3.api-football.com/odds?fixture=${fixtureId}&bet=1`, {
      headers: { 'x-apisports-key': API_KEY }
    })
      .then(r => r.json())
      .then(data => {
        const bookmakers = data.response?.[0]?.bookmakers || []
        const bet365 = bookmakers.find(b => b.name === 'Bet365') || bookmakers[0]
        if (bet365) {
          const market = bet365.bets?.find(b => b.name === 'Match Winner')
          setOdds({
            bookmaker: bet365.name,
            home:  market?.values?.find(v => v.value === 'Home')?.odd,
            draw:  market?.values?.find(v => v.value === 'Draw')?.odd,
            away:  market?.values?.find(v => v.value === 'Away')?.odd,
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [fixtureId])

  if (loading) return (
    <div className="card p-4 mb-6 text-center text-slate-500 text-sm">Cargando cuotas...</div>
  )

  if (!odds) return null

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cuotas 1X2</p>
          <p className="text-xs text-slate-600">{odds.bookmaker} · Solo referencial</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
          ⚠️ Info. No apostar
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Local gana', value: odds.home, color: 'text-sky-400' },
          { label: 'Empate',     value: odds.draw, color: 'text-slate-300' },
          { label: 'Visitante gana', value: odds.away, color: 'text-orange-400' },
        ].map(o => (
          <div key={o.label} className="bg-slate-700/30 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">{o.label}</p>
            <p className={`text-2xl font-black ${o.color}`}>{o.value || '—'}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-600 mt-3 text-center">
        Las cuotas son información de referencia. marcagol.live no promueve apuestas.
      </p>
    </div>
  )
}

// ─── EventRow ─────────────────────────────────────────────────────────────────
function EventRow({ event }) {
  const { icon, label } = getEventIcon(event.type, event.detail)
  const isHome = event.team?.id === event.fixture?.homeTeam?.id
  return (
    <div className={`flex items-center gap-3 py-2.5 border-b border-slate-700/20 last:border-0 ${isHome ? 'flex-row' : 'flex-row-reverse'}`}>
      <span className="text-slate-500 text-xs font-mono w-8 text-center flex-shrink-0">{event.time?.elapsed}'</span>
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div className={`flex-1 ${isHome ? 'text-left' : 'text-right'}`}>
        <p className="text-sm font-semibold text-white">{event.player?.name}</p>
        {event.assist?.name && <p className="text-xs text-slate-500">Asistencia: {event.assist.name}</p>}
        <p className="text-xs text-slate-600">{label}</p>
      </div>
    </div>
  )
}

// ─── StatBar ─────────────────────────────────────────────────────────────────
function StatBar({ label, home, away }) {
  const total = (home || 0) + (away || 0)
  const homePct = total > 0 ? Math.round((home / total) * 100) : 50
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span className="font-bold text-white">{home ?? 0}</span>
        <span className="text-slate-500">{label}</span>
        <span className="font-bold text-white">{away ?? 0}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-700">
        <div className="bg-sky-500 transition-all" style={{ width: `${homePct}%` }} />
        <div className="bg-orange-500 transition-all" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
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
  const getStat   = (arr, type) => arr.find(s => s.type === type)?.value

  // Datos en vivo del partido (del hook)
  const liveMatchData = events.length > 0 || stats.length > 0 ? {
    homeScore: stats?.[0]?.team ? null : null, // vendrá de API
    awayScore: null,
    status: null,
    minute: null,
    referee: null,
  } : null

  if (!matchData) return (
    <div className="text-center py-20">
      <p className="text-4xl mb-4">🔍</p>
      <p className="text-slate-400">Partido no encontrado</p>
      <Link to="/calendario" className="btn-secondary mt-4 inline-block">← Volver al calendario</Link>
    </div>
  )

  return (
    <div className="animate-slide-up max-w-3xl mx-auto">
      <Link to="/calendario" className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
        ← Volver al calendario
      </Link>

      {/* Header con info completa del partido */}
      <MatchHeader match={matchData} liveData={liveMatchData} />

      {/* Cuotas de apuestas */}
      <OddsPanel fixtureId={id} />

      {/* Tabs — compactas para móvil */}
      <div className="grid grid-cols-4 gap-1 mb-6 bg-slate-800 p-1 rounded-xl">
        {[
          { id: 'events',  label: 'Minuto a min.', icon: '⚽' },
          { id: 'stats',   label: 'Estadísticas',  icon: '📊' },
          { id: 'lineups', label: 'Alineaciones',  icon: '👥' },
          { id: 'ai',      label: 'Análisis IA',   icon: '🤖' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
              tab === t.id ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
            }`}>
            <span>{t.icon}</span>
            <span className="hidden sm:block leading-tight text-center">{t.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-16 text-center text-slate-500">Cargando datos del partido…</div>
      ) : (
        <>
          {/* Minuto a minuto */}
          {tab === 'events' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-700/50 font-semibold text-white"
                style={{ backgroundColor: '#162032' }}>Minuto a minuto</div>
              {events.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <p className="text-3xl mb-3">⏱️</p>
                  <p>Los eventos aparecerán cuando inicie el partido.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/20">
                  {[...events].reverse().map((e, i) => <EventRow key={i} event={e} />)}
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
                  <StatBar label="Posesión"           home={parseInt(getStat(homeStats,'Ball Possession'))} away={parseInt(getStat(awayStats,'Ball Possession'))} />
                  <StatBar label="Tiros al arco"      home={getStat(homeStats,'Shots on Goal')}    away={getStat(awayStats,'Shots on Goal')} />
                  <StatBar label="Total tiros"        home={getStat(homeStats,'Total Shots')}      away={getStat(awayStats,'Total Shots')} />
                  <StatBar label="Corners"            home={getStat(homeStats,'Corner Kicks')}     away={getStat(awayStats,'Corner Kicks')} />
                  <StatBar label="Faltas"             home={getStat(homeStats,'Fouls')}            away={getStat(awayStats,'Fouls')} />
                  <StatBar label="Fueras de juego"    home={getStat(homeStats,'Offsides')}         away={getStat(awayStats,'Offsides')} />
                  <StatBar label="Tarjetas amarillas" home={getStat(homeStats,'Yellow Cards')}     away={getStat(awayStats,'Yellow Cards')} />
                  <StatBar label="Pases completados"  home={getStat(homeStats,'Passes accurate')}  away={getStat(awayStats,'Passes accurate')} />
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
                        <span className="w-6 text-center text-xs font-bold text-sky-400">{p.player?.number}</span>
                        <span className="text-sm text-white">{p.player?.name}</span>
                        <span className="text-xs text-slate-500 ml-auto">{p.player?.pos}</span>
                      </div>
                    ))}
                  </div>
                  {team.substitutes?.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-slate-800/50 text-xs text-slate-500 uppercase tracking-wider">Suplentes</div>
                      {team.substitutes.map((p, j) => (
                        <div key={j} className="flex items-center gap-3 px-4 py-2 opacity-60">
                          <span className="w-6 text-center text-xs font-bold text-slate-500">{p.player?.number}</span>
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
            <MatchAI homeCode={homeCode} awayCode={awayCode} matchDate={matchDate} group={group} />
          )}
        </>
      )}
    </div>
  )
}
