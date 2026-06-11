import { useState, useEffect } from 'react'
import { GROUPS } from '../data/groups'
import { MATCHES } from '../data/matches'
import { usePredictions } from '../context/PredictionsContext'
import { formatDateShort, getKickoffDate } from '../utils/helpers'
import { getResult } from '../data/matchResults'
import Flag from '../components/ui/Flag'

const ALL_TEAMS = Object.fromEntries(
  GROUPS.flatMap(g => g.teams.map(t => [t.code, t]))
)

const LOCKED_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'PEN', 'live', 'FT', 'AET', 'finished'])

function isLocked(match) {
  return LOCKED_STATUSES.has(match.status) || !!getResult(match.id)
}

function timeUntil(match) {
  const kickoff = getKickoffDate(match.date, match.time)
  if (!kickoff) return ''
  const diff = kickoff - Date.now()
  if (diff <= 0) return 'ahora'
  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins  = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `en ${days}d ${hours}h`
  if (hours > 0) return `en ${hours}h ${mins}m`
  return `en ${mins} min`
}

function nextUpcomingMatch() {
  return [...MATCHES]
    .filter(m => !isLocked(m))
    .sort((a, b) => {
      const da = getKickoffDate(a.date, a.time) ?? new Date(8640000000000000)
      const db = getKickoffDate(b.date, b.time) ?? new Date(8640000000000000)
      return da - db
    })[0] ?? null
}

// ── Motivation banner ────────────────────────────────────────────────────────
function MotivationBanner({ predictedCount, totalPoints }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const next = nextUpcomingMatch()
  if (!next) return null

  const home = ALL_TEAMS[next.homeTeam]
  const away = ALL_TEAMS[next.awayTeam]
  const name = `${home?.name || next.homeTeam} vs ${away?.name || next.awayTeam}`
  const when = timeUntil(next)

  let emoji, text
  if (predictedCount === 0) {
    emoji = '🎯'
    text = `¡Predice el próximo partido! ${name} arranca ${when}. ¿Cuánto quedará?`
  } else if (totalPoints === 0) {
    emoji = '⏳'
    text = `Tienes ${predictedCount} predicción${predictedCount !== 1 ? 'es' : ''} guardada${predictedCount !== 1 ? 's' : ''}. ¡Los partidos están por comenzar!`
  } else {
    emoji = '🔥'
    text = `Llevas ${totalPoints} punto${totalPoints !== 1 ? 's' : ''} — estás en racha. ¡Sigue prediciendo para subir!`
  }

  return (
    <div
      className="rounded-xl p-5 mb-6"
      style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
    >
      <p className="text-white font-semibold text-sm md:text-base leading-snug">
        <span className="mr-1.5">{emoji}</span>{text}
      </p>
    </div>
  )
}

// ── Single-digit score input ──────────────────────────────────────────────────
function ScoreInput({ value, onChange }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={e => {
        const v = e.target.value.replace(/\D/g, '')
        onChange(v ? v[v.length - 1] : '')
      }}
      placeholder="–"
      className="prediction-input"
    />
  )
}

// ── Prediction card ───────────────────────────────────────────────────────────
function PredictionCard({ match }) {
  const { getPrediction, savePrediction } = usePredictions()
  const pred   = getPrediction(match.id)
  const result = getResult(match.id)
  const locked = isLocked(match)

  const [editing, setEditing] = useState(false)
  const [homeVal, setHomeVal] = useState('')
  const [awayVal, setAwayVal] = useState('')

  const homeTeam = ALL_TEAMS[match.homeTeam]
  const awayTeam = ALL_TEAMS[match.awayTeam]

  // true while the user is actively entering a score
  const showInputs = !locked && (!pred || editing)

  // Points once match is finished
  let points = null
  if (pred && result) {
    if (pred.home === result.homeScore && pred.away === result.awayScore) points = 3
    else if (Math.sign(pred.home - pred.away) === Math.sign(result.homeScore - result.awayScore)) points = 1
    else points = 0
  }

  const handleSave = () => {
    if (homeVal === '' || awayVal === '') return
    const h = parseInt(homeVal, 10)
    const a = parseInt(awayVal, 10)
    if (isNaN(h) || isNaN(a)) return
    savePrediction(match.id, h, a)
    setEditing(false)
    setHomeVal('')
    setAwayVal('')
  }

  const handleEdit = () => {
    setHomeVal(String(pred.home))
    setAwayVal(String(pred.away))
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    setHomeVal('')
    setAwayVal('')
  }

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      pred ? 'bg-slate-800/60 border-sky-500/20' : 'bg-slate-800/40 border-slate-700/50'
    }`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-slate-500 uppercase tracking-wider">
          {match.group && match.group.length <= 2 ? `Grupo ${match.group}` : match.group}
          {match.matchday ? ` · J${match.matchday}` : ''} · {formatDateShort(match.date)}
        </span>
        <div>
          {result ? (
            <span className="text-[11px] text-slate-400 font-medium">
              Final {result.homeScore}–{result.awayScore}
            </span>
          ) : locked ? (
            <span className="badge-live text-[10px]">En curso</span>
          ) : pred && !editing ? (
            <span className="text-[11px] text-sky-400 font-semibold">✓ Guardado</span>
          ) : null}
        </div>
      </div>

      {/* Teams + inputs */}
      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className="text-sm font-semibold text-white text-right hidden sm:block">
            {homeTeam?.name || match.homeTeam}
          </span>
          <span className="text-xs text-slate-400 text-right sm:hidden">{match.homeTeam}</span>
          {homeTeam && <Flag iso2={homeTeam.iso2} size="sm" />}
        </div>

        {/* Score area */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {showInputs ? (
            <>
              <ScoreInput value={homeVal} onChange={setHomeVal} />
              <span className="text-slate-500 font-bold text-lg select-none">–</span>
              <ScoreInput value={awayVal} onChange={setAwayVal} />
            </>
          ) : (
            <div className="w-16 flex items-center justify-center">
              {pred ? (
                <span className="text-sky-300 font-black text-lg tabular-nums">
                  {pred.home}–{pred.away}
                </span>
              ) : (
                <span className="text-slate-700 font-bold text-lg">–</span>
              )}
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center gap-2">
          {awayTeam && <Flag iso2={awayTeam.iso2} size="sm" />}
          <span className="text-sm font-semibold text-white hidden sm:block">
            {awayTeam?.name || match.awayTeam}
          </span>
          <span className="text-xs text-slate-400 sm:hidden">{match.awayTeam}</span>
        </div>
      </div>

      {/* Action row */}
      <div className="mt-3 flex items-center justify-center gap-2 min-h-[32px]">
        {showInputs ? (
          <>
            <button
              onClick={handleSave}
              disabled={homeVal === '' || awayVal === ''}
              className="text-xs font-semibold px-4 py-1.5 rounded-lg text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#F97316' }}
            >
              Predecir
            </button>
            {editing && (
              <button onClick={handleCancel} className="btn-secondary text-xs py-1.5 px-3">
                Cancelar
              </button>
            )}
          </>
        ) : pred && !locked ? (
          <>
            <span
              className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border"
              style={{ background: 'rgba(56,189,248,0.08)', borderColor: '#38BDF8', color: '#38BDF8' }}
            >
              Tu predicción: {pred.home}–{pred.away}
            </span>
            <button onClick={handleEdit} className="btn-secondary text-xs py-1 px-3">
              Editar
            </button>
          </>
        ) : pred && locked && points !== null ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Tu predicción:{' '}
              <span className="text-white font-bold">{pred.home}–{pred.away}</span>
            </span>
            <span className={`font-black text-sm ${
              points === 3 ? 'text-amber-400' : points === 1 ? 'text-sky-400' : 'text-red-400'
            }`}>
              {points === 3 ? '🎯' : points === 1 ? '✓' : '✕'} +{points} pts
            </span>
          </div>
        ) : pred && locked ? (
          <span className="text-xs text-slate-500">
            Tu predicción:{' '}
            <span className="text-slate-300 font-bold">{pred.home}–{pred.away}</span>
            <span className="text-slate-600 ml-2">· esperando resultado</span>
          </span>
        ) : null}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Predictions() {
  const { totalPoints, predictedCount, correctResults } = usePredictions()
  const [selectedGroup, setSelectedGroup] = useState('Todos')
  const [selectedMD, setSelectedMD]       = useState('Todos')

  const filtered = MATCHES.filter(m => {
    if (selectedGroup !== 'Todos' && m.group !== selectedGroup) return false
    if (selectedMD !== 'Todos' && m.matchday !== Number(selectedMD)) return false
    return true
  })

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Predicciones & Quiniela</h1>
        <p className="text-slate-400 mt-1">Predice los resultados y acumula puntos</p>
      </div>

      {/* Motivation banner */}
      <MotivationBanner predictedCount={predictedCount} totalPoints={totalPoints} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5 text-center">
          <div className="text-3xl font-black text-amber-400 tabular-nums">{totalPoints}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Puntos totales</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-black text-sky-400 tabular-nums">{predictedCount}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Predicciones</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-black text-orange-400 tabular-nums">{correctResults}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Resultados correctos</div>
        </div>
      </div>

      {/* Scoring system */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-white mb-3">Sistema de puntos</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { pts: 3, label: 'Marcador exacto',      color: 'text-amber-400', icon: '🎯' },
            { pts: 1, label: 'Resultado correcto',   color: 'text-sky-400',   icon: '✓'  },
            { pts: 0, label: 'Resultado incorrecto', color: 'text-red-400',   icon: '✕'  },
          ].map(item => (
            <div key={item.pts} className="bg-slate-700/30 rounded-lg p-3 text-center">
              <span className="text-2xl">{item.icon}</span>
              <div className={`font-black text-2xl ${item.color}`}>+{item.pts}</div>
              <div className="text-xs text-slate-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setSelectedGroup('Todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              selectedGroup === 'Todos'
                ? 'bg-sky-500 text-white border-sky-500'
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            Todos los grupos
          </button>
          {'ABCDEFGHIJKL'.split('').map(g => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g)}
              className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${
                selectedGroup === g
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['Todos', '1', '2', '3'].map(md => (
            <button
              key={md}
              onClick={() => setSelectedMD(md)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                selectedMD === md
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {md === 'Todos' ? 'Todas las jornadas' : `Jornada ${md}`}
            </button>
          ))}
        </div>
      </div>

      {/* Match cards */}
      <div className="space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider">{filtered.length} partidos</p>
        {filtered.map(match => (
          <PredictionCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  )
}
