import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { GROUPS } from '../data/groups'
import { getUpcomingMatches, getLiveMatches } from '../data/matches'
import { getCountdown, formatDateShort, formatDayOfWeek, capitalizeFirst, flagUrl } from '../utils/helpers'
import Flag from '../components/ui/Flag'
import LiveIndicator from '../components/ui/LiveIndicator'
import { StatusBadge } from '../components/ui/Badge'

const WORLD_CUP_START = '2026-06-11T18:00:00Z'

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

function MatchCard({ match, compact = false }) {
  const isLive = ['live','1H','HT','2H','ET','PEN'].includes(match.status)
  const home = ALL_TEAMS_MAP[match.homeTeam]
  const away = ALL_TEAMS_MAP[match.awayTeam]

  const COUNTRY_FLAGS = { USA: '🇺🇸', CAN: '🇨🇦', MEX: '🇲🇽' }
  const COUNTRY_NAMES = { USA: 'Estados Unidos', CAN: 'Canadá', MEX: 'México' }

  return (
    <div
      className={`rounded-xl p-4 border transition-all ${compact ? '' : 'hover:border-sky-400'}`}
      style={{ background: '#1E293B', borderColor: '#334155' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500 uppercase tracking-wider">
          {match.group && match.group.length <= 2 ? `Grupo ${match.group}` : match.group}
          {match.matchday ? ` · J${match.matchday}` : ''}
        </span>
        {isLive ? (
          <LiveIndicator minute={match.minute} />
        ) : (
          <StatusBadge status={match.status} />
        )}
      </div>

      {/* Teams & Score */}
      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className="text-sm font-semibold text-white text-right">
            {home?.name || match.homeTeam}
          </span>
          {home && <Flag iso2={home.iso2} size="sm" />}
        </div>

        {/* Score / Time */}
        <div className="flex-shrink-0 text-center min-w-[60px]">
          {match.homeScore != null ? (
            <div className={`text-xl font-black tabular-nums ${isLive ? 'text-sky-400' : 'text-white'}`}>
              {match.homeScore}–{match.awayScore}
            </div>
          ) : (
            <div className="font-bold text-xl" style={{ color: '#F97316' }}>{match.time?.slice(0,5)}</div>
          )}
          <div className="text-xs text-slate-600 mt-0.5">ET</div>
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center gap-2">
          {away && <Flag iso2={away.iso2} size="sm" />}
          <span className="text-sm font-semibold text-white">
            {away?.name || match.awayTeam}
          </span>
        </div>
      </div>

      {/* Venue + country */}
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
  const [countdown, setCountdown] = useState(getCountdown(WORLD_CUP_START))
  const live      = getLiveMatches()
  const upcoming  = getUpcomingMatches(6)

  useEffect(() => {
    const id = setInterval(() => setCountdown(getCountdown(WORLD_CUP_START)), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-10 animate-slide-up">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative rounded-2xl overflow-hidden border border-slate-700/50 p-8 md:p-12 text-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1920&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)' }} />
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

          {/* Countdown */}
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

      {/* ── Live Matches ─────────────────────────────────────────────── */}
      {live.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <LiveIndicator size="lg" />
            <h2 className="section-title">Partidos en Vivo</h2>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {live.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
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
              <div key={m.id} className="space-y-1">
                <p className="text-xs text-slate-500 px-1 uppercase tracking-wider">
                  {capitalizeFirst(formatDayOfWeek(m.date))}
                </p>
                <MatchCard match={m} />
              </div>
            ))}
          </div>
        )}
      </section>

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
