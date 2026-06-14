import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { GROUPS } from '../data/groups'
import { MATCHES, getUpcomingMatches } from '../data/matches'
import { getCountdown, formatDateShort, formatDayOfWeek, capitalizeFirst, flagUrl, getKickoffCountdown } from '../utils/helpers'
import { getResult } from '../data/matchResults'
import Flag from '../components/ui/Flag'
import LiveIndicator from '../components/ui/LiveIndicator'
import { TEAM_IDS } from '../data/teamIds'
import { StatusBadge } from '../components/ui/Badge'
import { startLivePolling } from '../services/liveData'
import { usePredictions } from '../context/PredictionsContext'
import { useLiveScoresMap } from '../hooks/useLiveData'
import { esTeamName } from '../data/teamNames'

const WORLD_CUP_START = '2026-06-11T19:00:00+00:00'

const ALL_TEAMS_MAP = Object.fromEntries(
  GROUPS.flatMap(g => g.teams.map(t => [t.code, t]))
)

function CountdownBox({ value, label }) {
  return (
    <div className="countdown-box">
      <div className="text-3xl md:text-4xl font-black text-sky-400 tabular-nums">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">{label}</div>
    </div>
  )
}

// Card for API live matches (uses logo URLs from API directly)
function ApiMatchCard({ match }) {
  return (
    <div
      className="rounded-xl p-4 border transition-all hover:border-sky-400"
      style={{ background: '#1E293B', borderColor: '#334155' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500 uppercase tracking-wider">En vivo</span>
        <LiveIndicator minute={match.minute} />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className="text-sm font-semibold text-white text-right">{esTeamName({ id: match.homeTeamId, name: match.homeTeam })}</span>
          {match.homeLogo && (
            <img src={match.homeLogo} alt={match.homeTeam} width={28} height={28}
                 className="object-contain" loading="lazy" />
          )}
        </div>
        <div className="flex-shrink-0 text-center min-w-[60px]">
          <div className="text-xl font-black tabular-nums text-sky-400">
            {match.homeScore ?? '–'}–{match.awayScore ?? '–'}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">{match.minute ?? ''}′</div>
        </div>
        <div className="flex-1 flex items-center gap-2">
          {match.awayLogo && (
            <img src={match.awayLogo} alt={match.awayTeam} width={28} height={28}
                 className="object-contain" loading="lazy" />
          )}
          <span className="text-sm font-semibold text-white">{esTeamName({ id: match.awayTeamId, name: match.awayTeam })}</span>
        </div>
      </div>
      {(match.venue || match.city) && (
        <p className="mt-3 text-center text-xs text-slate-600 truncate">
          📍 {[match.venue, match.city].filter(Boolean).join(', ')}
        </p>
      )}
    </div>
  )
}

function toLocalTime(date, timeCol) {
  if (!timeCol) return { time: '--:--', label: '' }
  try {
    const d = new Date(`${date}T${timeCol.slice(0, 5)}:00-05:00`)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const time  = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz })
    const label = d.toLocaleTimeString('en',    { timeZoneName: 'short', timeZone: tz }).split(' ').pop()
    return { time, label }
  } catch { return { time: timeCol?.slice(0, 5) ?? '--:--', label: 'COL' } }
}

function MatchCard({ match, liveData, compact = false }) {
  const home       = ALL_TEAMS_MAP[match.homeTeam]
  const away       = ALL_TEAMS_MAP[match.awayTeam]
  const result     = getResult(match.id)
  const isFinished = !!result
  const isLive     = !isFinished && !!liveData

  const [countdown, setCountdown] = useState(() =>
    (!isLive && !isFinished) ? getKickoffCountdown(match.date, match.timeCol) : null
  )
  useEffect(() => {
    if (isLive || isFinished) return
    const initial = getKickoffCountdown(match.date, match.timeCol)
    if (!initial) return
    const id = setInterval(() => setCountdown(getKickoffCountdown(match.date, match.timeCol)), 1000)
    return () => clearInterval(id)
  }, [isLive, isFinished, match.date, match.timeCol])

  const COUNTRY_FLAGS = { USA: '🇺🇸', CAN: '🇨🇦', MEX: '🇲🇽' }
  const COUNTRY_NAMES = { USA: 'Estados Unidos', CAN: 'Canadá', MEX: 'México' }

  const displayScore = result
    ?? (liveData ? { homeScore: liveData.homeScore, awayScore: liveData.awayScore } : null)
  const { time: localTime, label: tzLabel } = toLocalTime(match.date, match.timeCol)

  function fmtCountdown(cd) {
    if (!cd) return ''
    if (cd.hh > 0) return `${cd.hh}h ${String(cd.mm).padStart(2, '0')}m`
    if (cd.mm > 0) return `${cd.mm}m ${String(cd.ss).padStart(2, '0')}s`
    return `${cd.ss}s`
  }

  return (
    <div
      className={`rounded-xl p-4 border transition-all ${compact ? '' : 'hover:border-sky-400'}`}
      style={{ background: '#1E293B', borderColor: '#334155' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500 uppercase tracking-wider">
          {match.group && match.group.length <= 2 ? `Grupo ${match.group}` : match.group}
          {match.matchday ? ` · J${match.matchday}` : ''}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-xs text-red-400 font-bold uppercase tracking-wider">
              {liveData.status === 'HT' ? 'Descanso' : 'EN VIVO'}
            </span>
          </span>
        ) : isFinished ? (
          <span className="badge-finished">Finalizado</span>
        ) : (
          <StatusBadge status={match.status} />
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className="text-sm font-semibold text-white text-right">
            {home?.name || match.homeTeam}
          </span>
          {home && (
            <img
              src={`https://media.api-sports.io/football/teams/${TEAM_IDS[home.code]}.png`}
              width={28}
              height={28}
              alt={home.name}
              className="object-contain flex-shrink-0"
              onError={(e) => { e.target.onerror = null; e.target.src = `https://flagcdn.com/28x21/${home.iso2.toLowerCase()}.png` }}
              loading="lazy"
            />
          )}
        </div>

        {/* Score / Time / Countdown */}
        <div className="flex-shrink-0 text-center min-w-[60px]">
          {displayScore != null ? (
            <>
              <div className={`text-xl font-black tabular-nums ${isLive ? 'text-sky-400' : 'text-white'}`}>
                {displayScore.homeScore}–{displayScore.awayScore}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {isFinished ? 'Final' : isLive ? (liveData.status === 'HT' ? 'Descanso' : `${liveData.minute ?? ''}′`) : ''}
              </div>
            </>
          ) : countdown ? (
            <>
              <div className="text-xs font-bold text-orange-400 leading-tight">Inicia en</div>
              <div className="text-sm font-black text-orange-400 tabular-nums">{fmtCountdown(countdown)}</div>
            </>
          ) : (
            <>
              <div className="font-bold text-xl" style={{ color: '#F97316' }}>{localTime}</div>
              <div className="text-xs text-slate-600 mt-0.5">{tzLabel}</div>
            </>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center gap-2">
          {away && (
            <img
              src={`https://media.api-sports.io/football/teams/${TEAM_IDS[away.code]}.png`}
              width={28}
              height={28}
              alt={away.name}
              className="object-contain flex-shrink-0"
              onError={(e) => { e.target.onerror = null; e.target.src = `https://flagcdn.com/28x21/${away.iso2.toLowerCase()}.png` }}
              loading="lazy"
            />
          )}
          <span className="text-sm font-semibold text-white">
            {away?.name || match.awayTeam}
          </span>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 text-center">
          <p className="text-xs text-slate-600 truncate">📍 {match.venue}, {match.city}</p>
          {match.country && (
            <p className="text-xs text-slate-500 mt-0.5">
              {COUNTRY_FLAGS[match.country]} {COUNTRY_NAMES[match.country]}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, value, label, sub }) {
  return (
    <div className="card p-5 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="text-sm font-semibold text-slate-300 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [countdown, setCountdown]           = useState(getCountdown(WORLD_CUP_START))
  const [apiLiveMatches, setApiLiveMatches] = useState([])
  const [pollasActivas, setPollasActivas]   = useState(null)

  // Countdown ticker
  useEffect(() => {
    const id = setInterval(() => setCountdown(getCountdown(WORLD_CUP_START)), 1000)
    return () => clearInterval(id)
  }, [])

  // Live match polling
  useEffect(() => {
    return startLivePolling(matches => setApiLiveMatches(matches))
  }, [])

  // Pollas activas (una sola vez al montar)
  useEffect(() => {
    fetch('/api/polla?action=activas')
      .then(r => r.json())
      .then(d => setPollasActivas(d.pollas || []))
      .catch(() => setPollasActivas([]))
  }, [])

  const upcoming       = getUpcomingMatches(6)
  const hasApiLive     = apiLiveMatches.length > 0
  const liveScoresMap  = useLiveScoresMap(MATCHES)
  const { totalPoints, predictedCount } = usePredictions()

  return (
    <div className="space-y-10 animate-slide-up">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="rounded-2xl border border-slate-700/50 p-8 md:p-12 text-center"
        style={{
          backgroundImage: 'url(/images/wc2026-hero.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Dark overlay so React text stays readable */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(11,17,32,0.62)',
          pointerEvents: 'none',
        }} />
        {/* Extra sky-blue radial glow */}
        <div style={{
          position: 'absolute',
          width: '600px', height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #38BDF815 0%, transparent 70%)',
          top: '-200px', right: '-100px',
          pointerEvents: 'none',
        }} />
        {/* Bottom orange accent line */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #F97316, transparent)',
          pointerEvents: 'none',
        }} />

        <div className="relative">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-3xl">🇺🇸</span>
            <span className="text-3xl">🇨🇦</span>
            <span className="text-3xl">🇲🇽</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tight">
            Copa del Mundo
          </h1>
          <p className="text-sky-400 text-xl md:text-2xl font-bold mb-1">FIFA 2026</p>
          <p className="text-slate-400 text-sm mb-8">11 jun – 27 jul · USA, Canadá, México</p>

          {countdown ? (
            <>
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-4 font-medium">Faltan</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <CountdownBox value={countdown.days}    label="Días"    />
                <span className="text-2xl text-slate-600 font-black pb-4">:</span>
                <CountdownBox value={countdown.hours}   label="Horas"   />
                <span className="text-2xl text-slate-600 font-black pb-4">:</span>
                <CountdownBox value={countdown.minutes} label="Minutos" />
                <span className="text-2xl text-slate-600 font-black pb-4">:</span>
                <CountdownBox value={countdown.seconds} label="Segundos"/>
              </div>
            </>
          ) : (
            <div className="inline-flex items-center gap-3 bg-sky-500/20 border border-sky-500/40 rounded-2xl px-8 py-4">
              <LiveIndicator size="lg" />
              <span className="text-sky-300 text-xl font-bold">¡El Mundial ha comenzado!</span>
            </div>
          )}
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="🌍" value="48"  label="Selecciones"  sub="6 confederaciones" />
          <StatCard icon="🏟️" value="16"  label="Sedes"        sub="3 países sede"     />
          <StatCard icon="⚽" value="104" label="Partidos"      sub="72 fase de grupos" />
          <StatCard icon="🏆" value="32"  label="Días"         sub="Jun 11 – Jul 27"   />
        </div>
      </section>

      {/* ── Mis Predicciones ─────────────────────────────────────────── */}
      <section>
        <div
          className="rounded-xl border border-slate-700/50 p-5 flex items-center justify-between gap-4 flex-wrap"
          style={{ background: '#1E293B' }}
        >
          {predictedCount === 0 ? (
            <div>
              <p className="text-sm font-semibold text-white">
                🎯 ¿Cuánto quedará México vs Sudáfrica?
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Haz tu primera predicción del Mundial</p>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-black text-amber-400 tabular-nums">{totalPoints}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Puntos</div>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div className="text-center">
                <div className="text-2xl font-black text-sky-400 tabular-nums">{predictedCount}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Predicciones</div>
              </div>
              <p className="text-sm text-slate-400 hidden md:block">¡Sigue prediciendo para subir!</p>
            </div>
          )}
          <Link to="/predicciones" className="btn-outline text-xs flex-shrink-0">
            Ver mis predicciones →
          </Link>
        </div>
      </section>

      {/* ── Live Matches ─────────────────────────────────────────────── */}
      {!countdown && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <LiveIndicator size="lg" />
            <h2 className="section-title">Partidos en Vivo</h2>
            {hasApiLive && (
              <span className="text-xs text-sky-400 ml-auto">Actualización en tiempo real</span>
            )}
          </div>
          {hasApiLive ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {apiLiveMatches.map(m => (
                <Link key={m.id} to={`/partido/${m.id}`} className="block">
                  <ApiMatchCard match={m} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center text-slate-500">
              No hay partidos en vivo en este momento
            </div>
          )}
        </section>
      )}

      {/* ── Upcoming Matches ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="section-title">Próximos Partidos</h2>
            <p className="section-subtitle">Fase de grupos · Mundial 2026</p>
          </div>
          <Link to="/calendario" className="btn-outline text-sm">Ver calendario →</Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">No hay partidos próximos</div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {upcoming.map(m => (
              <Link key={m.id} to={`/partido/${m.id}`} className="space-y-1 block group">
                <p className="text-xs text-slate-500 px-1 uppercase tracking-wider">
                  {capitalizeFirst(formatDayOfWeek(m.date))}
                </p>
                <MatchCard match={m} liveData={liveScoresMap[m.id]} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Pollas Activas ───────────────────────────────────────────── */}
      {(!countdown || (pollasActivas && pollasActivas.length > 0)) && (
        <section>
          <div
            className="rounded-2xl border p-5"
            style={{ backgroundColor: '#1E293B', borderColor: 'rgba(51,65,85,0.7)' }}
          >
            {/* Título */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-white text-lg leading-tight">
                  🎯 Pollas activas
                  {pollasActivas && (
                    <span className="font-normal text-slate-500 text-sm ml-2">
                      · {pollasActivas.length} {pollasActivas.length === 1 ? 'polla' : 'pollas'}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Predice marcadores y compite con amigos
                </p>
              </div>
              <Link
                to="/pollas-activas"
                className="text-xs font-semibold flex-shrink-0"
                style={{ color: '#38BDF8' }}
              >
                Ver todas →
              </Link>
            </div>

            {/* Preview: hasta 3 pollas públicas */}
            {pollasActivas === null && (
              <div className="space-y-2 mb-4">
                {[1,2].map(i => (
                  <div key={i} className="h-12 rounded-xl bg-slate-800/60 animate-pulse" />
                ))}
              </div>
            )}

            {pollasActivas && pollasActivas.filter(p => p.publica).slice(0, 3).length > 0 && (
              <div className="space-y-2 mb-4">
                {pollasActivas.filter(p => p.publica).slice(0, 3).map(p => (
                  <Link
                    key={p.id}
                    to={`/polla/${p.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-700/30 transition-colors"
                    style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(51,65,85,0.5)' }}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-white truncate block">
                        {p.equipo_local} vs {p.equipo_visitante}
                      </span>
                      <span className="text-xs text-slate-500">
                        👥 {p.participantes ?? 0} participantes · por {p.creador_nombre}
                      </span>
                    </span>
                    <span
                      className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg"
                      style={{ background: 'rgba(249,115,22,0.15)', color: '#FB923C' }}
                    >
                      Ver →
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* CTAs */}
            <div className="flex gap-2 mt-2">
              <Link
                to="/pollas-activas"
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-center border border-slate-700 text-slate-300 hover:border-slate-500 transition-colors"
              >
                Ver todas las pollas
              </Link>
              <Link
                to="/crear-polla"
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white text-center transition-opacity hover:opacity-90"
                style={{ background: '#F97316' }}
              >
                + Crear tu polla
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Quick Links ──────────────────────────────────────────────── */}
      <section>
        <h2 className="section-title mb-5">Explorar el Mundial</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { to: '/grupos',       icon: '📊', title: 'Grupos',       sub: '12 grupos · 48 equipos'   },
            { to: '/llaves',       icon: '🔗', title: 'Llaves',       sub: 'Árbol eliminatorio'        },
            { to: '/equipos',      icon: '👕', title: 'Equipos',      sub: 'Perfiles y estadísticas'   },
            { to: '/predicciones', icon: '🎯', title: 'Predicciones', sub: 'Predice los resultados'    },
            { to: '/calendario',   icon: '📅', title: 'Calendario',   sub: 'Todos los partidos'        },
            { to: '/historia',     icon: '🏆', title: 'Historia',     sub: 'Campeones desde 1930'      },
          ].map(card => (
            <Link key={card.to} to={card.to} className="card-hover p-5 group">
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">{card.icon}</div>
              <div className="font-bold text-white mb-1">{card.title}</div>
              <div className="text-xs text-slate-500">{card.sub}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Groups preview ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Vista de Grupos</h2>
          <Link to="/grupos" className="btn-outline text-sm">Ver todos →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {GROUPS.map(group => (
            <Link key={group.id} to={`/grupos/${group.id}`} className="card-hover p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-group">{group.id}</span>
                <span className="font-semibold text-white text-sm">Grupo {group.id}</span>
              </div>
              <div className="space-y-1.5">
                {group.teams.map(team => (
                  <div key={team.code} className="flex items-center gap-2">
                    <Flag iso2={team.iso2} size="xs" />
                    <span className="text-sm text-slate-300 truncate">{team.name}</span>
                    <span className="ml-auto text-xs text-slate-600">#{team.fifaRanking}</span>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}
