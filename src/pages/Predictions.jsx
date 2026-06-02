import { useState } from 'react'
import { GROUPS } from '../data/groups'
import { MATCHES } from '../data/matches'
import { usePredictions } from '../context/PredictionsContext'
import { formatDateShort } from '../utils/helpers'
import Flag from '../components/ui/Flag'
import { StatusBadge } from '../components/ui/Badge'

const ALL_TEAMS_MAP = Object.fromEntries(
  GROUPS.flatMap(g => g.teams.map(t => [t.code, t]))
)

function PredictionRow({ match }) {
  const { getPrediction, savePrediction, clearPrediction } = usePredictions()
  const pred  = getPrediction(match.id)
  const [home, setHome] = useState(pred?.home ?? '')
  const [away, setAway] = useState(pred?.away ?? '')
  const [saved, setSaved] = useState(false)

  const homeTeam = ALL_TEAMS_MAP[match.homeTeam]
  const awayTeam = ALL_TEAMS_MAP[match.awayTeam]
  const isLocked = match.status !== 'scheduled'

  const handleSave = () => {
    if (home === '' || away === '') return
    const h = parseInt(home), a = parseInt(away)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return
    savePrediction(match.id, h, a)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const scoreFor = (isHome) => {
    if (match.homeScore !== null)
      return <span className="font-black text-lg text-white">{isHome ? match.homeScore : match.awayScore}</span>
    return null
  }

  return (
    <div className={`p-4 border border-slate-700/50 rounded-xl transition-all ${
      pred ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/40'
    }`}>
      {/* Date & group */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500">Grupo {match.group} · J{match.matchday} · {formatDateShort(match.date)}</span>
        <div className="flex items-center gap-2">
          {pred && <span className="text-xs text-emerald-400 font-semibold">✓ Guardado</span>}
          {saved && <span className="text-xs text-amber-400 animate-pulse">💾 Salvado</span>}
          <StatusBadge status={match.status} />
        </div>
      </div>

      {/* Teams & inputs */}
      <div className="flex items-center gap-3">
        {/* Home team */}
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className="text-sm font-semibold text-white text-right hidden sm:block">
            {homeTeam?.name || match.homeTeam}
          </span>
          <span className="text-xs text-slate-400 text-right sm:hidden">
            {match.homeTeam}
          </span>
          {homeTeam && <Flag iso2={homeTeam.iso2} size="sm" />}
        </div>

        {/* Score inputs */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isLocked ? (
            <div className="flex items-center gap-2">
              {scoreFor(true)}
              <span className="text-slate-600">–</span>
              {scoreFor(false)}
            </div>
          ) : (
            <>
              <input
                type="number" min="0" max="20"
                value={home}
                onChange={e => setHome(e.target.value)}
                className="prediction-input"
                placeholder="0"
              />
              <span className="text-slate-500 font-bold">–</span>
              <input
                type="number" min="0" max="20"
                value={away}
                onChange={e => setAway(e.target.value)}
                className="prediction-input"
                placeholder="0"
              />
            </>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 flex items-center gap-2">
          {awayTeam && <Flag iso2={awayTeam.iso2} size="sm" />}
          <span className="text-sm font-semibold text-white hidden sm:block">
            {awayTeam?.name || match.awayTeam}
          </span>
          <span className="text-xs text-slate-400 sm:hidden">{match.awayTeam}</span>
        </div>
      </div>

      {/* Action buttons */}
      {!isLocked && (
        <div className="flex justify-center gap-2 mt-3">
          <button
            onClick={handleSave}
            disabled={home === '' || away === ''}
            className="btn-primary text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            💾 Guardar predicción
          </button>
          {pred && (
            <button onClick={() => { clearPrediction(match.id); setHome(''); setAway('') }} className="btn-secondary text-xs">
              ✕ Borrar
            </button>
          )}
        </div>
      )}

      {/* Prediction display */}
      {pred && isLocked && (
        <div className="mt-3 text-center text-sm">
          <span className="text-slate-500">Tu predicción: </span>
          <span className="text-white font-bold">{pred.home}–{pred.away}</span>
          {match.status === 'finished' && match.homeScore !== null && (() => {
            const pts = Math.sign(pred.home - pred.away) === Math.sign(match.homeScore - match.awayScore)
              ? (pred.home === match.homeScore && pred.away === match.awayScore ? 3 : 1) : 0
            return (
              <span className={`ml-3 font-bold ${pts === 3 ? 'text-amber-400' : pts === 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                +{pts} pts
              </span>
            )
          })()}
        </div>
      )}
    </div>
  )
}

export default function Predictions() {
  const { totalPoints, predictedCount, correctResults } = usePredictions()
  const [selectedGroup, setSelectedGroup] = useState('Todos')
  const [selectedMD, setSelectedMD] = useState('Todos')

  const filtered = MATCHES.filter(m => {
    if (selectedGroup !== 'Todos' && m.group !== selectedGroup) return false
    if (selectedMD !== 'Todos' && m.matchday !== Number(selectedMD)) return false
    return true
  })

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Predicciones & Quiniela</h1>
        <p className="text-slate-400 mt-1">Predice los resultados y acumula puntos</p>
      </div>

      {/* Points summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5 text-center">
          <div className="text-3xl font-black text-amber-400 tabular-nums">{totalPoints}</div>
          <div className="text-sm text-slate-400 mt-1">Puntos totales</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-black text-emerald-400 tabular-nums">{predictedCount}</div>
          <div className="text-sm text-slate-400 mt-1">Predicciones</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-3xl font-black text-blue-400 tabular-nums">{correctResults}</div>
          <div className="text-sm text-slate-400 mt-1">Resultados correctos</div>
        </div>
      </div>

      {/* Scoring system */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-white mb-3">Sistema de puntos</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { pts: 3, label: 'Marcador exacto', color: 'text-amber-400', icon: '🎯' },
            { pts: 1, label: 'Resultado correcto (G/E/D)', color: 'text-emerald-400', icon: '✓' },
            { pts: 0, label: 'Resultado incorrecto', color: 'text-red-400', icon: '✕' },
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
        {/* Group filter */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setSelectedGroup('Todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              selectedGroup === 'Todos' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-700 text-slate-400'
            }`}
          >
            Todos los grupos
          </button>
          {'ABCDEFGHIJKL'.split('').map(g => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g)}
              className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${
                selectedGroup === g ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Matchday filter */}
        <div className="flex gap-1">
          {['Todos', '1', '2', '3'].map(md => (
            <button
              key={md}
              onClick={() => setSelectedMD(md)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                selectedMD === md ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-700 text-slate-400'
              }`}
            >
              {md === 'Todos' ? 'Todas las jornadas' : `Jornada ${md}`}
            </button>
          ))}
        </div>
      </div>

      {/* Matches list */}
      <div className="space-y-3">
        <p className="text-sm text-slate-500">{filtered.length} partidos</p>
        {filtered.map(match => (
          <PredictionRow key={match.id} match={match} />
        ))}
      </div>
    </div>
  )
}
