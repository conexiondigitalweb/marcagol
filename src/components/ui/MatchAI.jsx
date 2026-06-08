// MatchAI.jsx — Análisis con IA y simulación estadística del partido

import { useState, useCallback } from 'react'
import { useAnalysis } from '../../hooks/useAnalysis'
import { getHistory } from '../../data/history'
import { GROUPS } from '../../data/groups'

const ALL_TEAMS = Object.fromEntries(
  GROUPS.flatMap(g => g.teams.map(t => [t.code, t]))
)

// ─── Motor de simulación estadística ─────────────────────────────────────────
function simulateMatch(homeCode, awayCode, iterations = 1000) {
  const homeTeam = ALL_TEAMS[homeCode]
  const awayTeam = ALL_TEAMS[awayCode]
  const homeHist = getHistory(homeCode)
  const awayHist = getHistory(awayCode)

  if (!homeTeam || !awayTeam) return null

  // Factores base
  const homeRank = homeTeam.fifaRanking || 50
  const awayRank = awayTeam.fifaRanking || 50

  // Fuerza relativa basada en ranking FIFA (1 = mejor)
  const homeStrength = Math.max(0.1, (100 - homeRank) / 100)
  const awayStrength = Math.max(0.1, (100 - awayRank) / 100)

  // Factor histórico mundialista
  const homeExp = homeHist ? (homeHist.won / Math.max(homeHist.matches, 1)) : 0.33
  const awayExp = awayHist ? (awayHist.won / Math.max(awayHist.matches, 1)) : 0.33

  // Ventaja de sede / neutralidad (todos juegan en neutral en este Mundial)
  const HOME_ADVANTAGE = 1.08

  // Métricas combinadas
  const homePower = (homeStrength * 0.6 + homeExp * 0.4) * HOME_ADVANTAGE
  const awayPower = awayStrength * 0.6 + awayExp * 0.4

  const total = homePower + awayPower
  const homeWinProb = homePower / total
  const awayWinProb = awayPower / total
  const drawProb = 0.25 // probabilidad base de empate en fútbol

  // Ajustar para que sumen 1
  const adjHome = homeWinProb * (1 - drawProb)
  const adjAway = awayPower / total * (1 - drawProb)

  // Goles esperados por partido (basado en historial)
  const homeAvgGF = homeHist && homeHist.matches > 0 ? homeHist.gf / homeHist.matches : 1.3
  const awayAvgGF = awayHist && awayHist.matches > 0 ? awayHist.gf / awayHist.matches : 1.1

  // Simulación Monte Carlo
  let homeWins = 0, draws = 0, awayWins = 0
  const scores = {}
  let totalGoals = 0
  let cleanSheetsHome = 0, cleanSheetsAway = 0
  let bothScore = 0

  for (let i = 0; i < iterations; i++) {
    // Generar goles con distribución de Poisson aproximada
    const homeGoals = poissonRandom(homeAvgGF * (homePower / (homePower + awayPower) * 1.5 + 0.3))
    const awayGoals = poissonRandom(awayAvgGF * (awayPower / (homePower + awayPower) * 1.5 + 0.3))

    const key = `${homeGoals}-${awayGoals}`
    scores[key] = (scores[key] || 0) + 1
    totalGoals += homeGoals + awayGoals

    if (homeGoals === 0) cleanSheetsHome++
    if (awayGoals === 0) cleanSheetsAway++
    if (homeGoals > 0 && awayGoals > 0) bothScore++

    if (homeGoals > awayGoals) homeWins++
    else if (homeGoals === awayGoals) draws++
    else awayWins++
  }

  // Top 5 marcadores más probables
  const topScores = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([score, count]) => ({
      score,
      probability: Math.round((count / iterations) * 100)
    }))

  return {
    homeCode, awayCode,
    homeName: homeTeam.name,
    awayName: awayTeam.name,
    homeRank, awayRank,
    iterations,
    homeWin:  Math.round((homeWins / iterations) * 100),
    draw:     Math.round((draws    / iterations) * 100),
    awayWin:  Math.round((awayWins / iterations) * 100),
    avgGoals: (totalGoals / iterations).toFixed(2),
    cleanSheetHome: Math.round((cleanSheetsHome / iterations) * 100),
    cleanSheetAway: Math.round((cleanSheetsAway / iterations) * 100),
    bothScore: Math.round((bothScore / iterations) * 100),
    topScores,
    homeHist, awayHist,
  }
}

function poissonRandom(lambda) {
  // Aproximación de Poisson usando método de Knuth
  const L = Math.exp(-lambda)
  let k = 0, p = 1
  do { k++; p *= Math.random() } while (p > L)
  return Math.min(k - 1, 8) // máximo 8 goles
}

// ─── Componente de barra de probabilidad ─────────────────────────────────────
function ProbBar({ homeVal, drawVal, awayVal, homeName, awayName }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span className="font-semibold text-white">{homeName}</span>
        <span>Empate</span>
        <span className="font-semibold text-white">{awayName}</span>
      </div>
      <div className="flex h-8 rounded-xl overflow-hidden text-xs font-black">
        <div
          className="flex items-center justify-center text-white transition-all duration-700"
          style={{ width: `${homeVal}%`, background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)' }}
        >
          {homeVal}%
        </div>
        <div
          className="flex items-center justify-center text-slate-300 transition-all duration-700"
          style={{ width: `${drawVal}%`, background: '#334155' }}
        >
          {drawVal}%
        </div>
        <div
          className="flex items-center justify-center text-white transition-all duration-700"
          style={{ width: `${awayVal}%`, background: 'linear-gradient(90deg, #f97316, #fb923c)' }}
        >
          {awayVal}%
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MatchAI({ homeCode, awayCode, matchDate, group }) {
  const [sim, setSim] = useState(null)
  const [simLoading, setSimLoading] = useState(false)
  const [simCount, setSimCount] = useState(1000)

  const [question, setQuestion] = useState('')
  const { text: aiResponse, streaming, loading: aiLoading, error: aiError, ask } = useAnalysis()

  const homeTeam = ALL_TEAMS[homeCode]
  const awayTeam = ALL_TEAMS[awayCode]
  const homeHist = getHistory(homeCode)
  const awayHist = getHistory(awayCode)

  // Ejecutar simulación
  const runSimulation = useCallback(() => {
    setSimLoading(true)
    setTimeout(() => {
      const result = simulateMatch(homeCode, awayCode, simCount)
      setSim(result)
      setSimLoading(false)
    }, 800)
  }, [homeCode, awayCode, simCount])

  // Preguntar a Claude
  const askClaude = useCallback(() => {
    if (!question.trim()) return

    const context = `
Partido: ${homeTeam?.name} vs ${awayTeam?.name}
Fecha: ${matchDate || 'Copa Mundial 2026'}
Grupo: ${group || '—'}
Ranking FIFA: ${homeTeam?.name} #${homeTeam?.fifaRanking} | ${awayTeam?.name} #${awayTeam?.fifaRanking}
Historial mundialista ${homeTeam?.name}: ${homeHist ? `${homeHist.participations} participaciones, ${homeHist.won}V/${homeHist.drawn}E/${homeHist.lost}D, mejor resultado: ${homeHist.best}` : 'Sin datos'}
Historial mundialista ${awayTeam?.name}: ${awayHist ? `${awayHist.participations} participaciones, ${awayHist.won}V/${awayHist.drawn}E/${awayHist.lost}D, mejor resultado: ${awayHist.best}` : 'Sin datos'}
${sim ? `Simulación (${sim.iterations.toLocaleString()} iteraciones): ${homeTeam?.name} gana ${sim.homeWin}% | Empate ${sim.draw}% | ${awayTeam?.name} gana ${sim.awayWin}%` : ''}
    `.trim()

    ask({
      system: `Eres un analista deportivo experto en fútbol mundial. Respondes en español, de forma clara, informativa y apasionada.
IMPORTANTE: Nunca hagas recomendaciones de apuestas. Solo análisis deportivo basado en datos históricos y estadísticas.
Contexto del partido: ${context}`,
      message: question,
      matchId: `${homeCode}-${awayCode}`,
    })
  }, [question, homeTeam, awayTeam, homeHist, awayHist, matchDate, group, sim, ask, homeCode, awayCode])

  const suggestedQuestions = [
    `¿Cuáles son las fortalezas y debilidades de ${homeTeam?.name} para este partido?`,
    `¿Cómo ha sido históricamente el rendimiento de ${awayTeam?.name} en Mundiales?`,
    `¿Qué factores tácticos pueden ser decisivos en este partido?`,
    `¿Cuál es el jugador clave que podría definir el partido?`,
  ]

  return (
    <div className="space-y-6">

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
        <span className="text-amber-400 text-lg flex-shrink-0">⚠️</span>
        <p className="text-xs text-amber-300/80 leading-relaxed">
          <strong className="text-amber-400">Análisis estadístico con fines informativos.</strong> Las simulaciones y proyecciones son modelos matemáticos basados en datos históricos. 
          No constituyen recomendaciones de apuestas ni predicciones garantizadas. El fútbol es impredecible por naturaleza.
        </p>
      </div>

      {/* ── Simulación Monte Carlo ── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between"
          style={{ backgroundColor: '#162032' }}>
          <div>
            <h3 className="font-bold text-white">🎲 Simulación estadística</h3>
            <p className="text-xs text-slate-500 mt-0.5">Modelo Monte Carlo basado en ranking FIFA e historial mundialista</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={simCount}
              onChange={e => setSimCount(Number(e.target.value))}
              className="text-xs bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-white"
            >
              <option value={1000}>1,000 sim.</option>
              <option value={5000}>5,000 sim.</option>
              <option value={10000}>10,000 sim.</option>
              <option value={50000}>50,000 sim.</option>
            </select>
            <button
              onClick={runSimulation}
              disabled={simLoading}
              className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {simLoading ? '⟳ Simulando...' : '▶ Simular'}
            </button>
          </div>
        </div>

        <div className="p-5">
          {!sim && !simLoading && (
            <div className="text-center py-10">
              <p className="text-5xl mb-3">🎲</p>
              <p className="text-slate-400 text-sm">Ejecuta la simulación para ver las probabilidades</p>
              <p className="text-slate-600 text-xs mt-1">Puedes seleccionar hasta 50,000 iteraciones</p>
            </div>
          )}

          {simLoading && (
            <div className="text-center py-10">
              <div className="inline-flex items-center gap-3 text-sky-400">
                <span className="text-2xl animate-spin">⟳</span>
                <span className="text-sm">Ejecutando {simCount.toLocaleString()} simulaciones...</span>
              </div>
            </div>
          )}

          {sim && !simLoading && (
            <div className="space-y-6 animate-fade-in">
              {/* Barra principal */}
              <ProbBar
                homeVal={sim.homeWin}
                drawVal={sim.draw}
                awayVal={sim.awayWin}
                homeName={sim.homeName}
                awayName={sim.awayName}
              />

              {/* Stats secundarias */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Goles promedio', value: sim.avgGoals, icon: '⚽' },
                  { label: 'Ambos anotan', value: `${sim.bothScore}%`, icon: '🎯' },
                  { label: `Arco ${sim.homeName.split(' ')[0]} en 0`, value: `${sim.cleanSheetHome}%`, icon: '🧤' },
                  { label: `Arco ${sim.awayName.split(' ')[0]} en 0`, value: `${sim.cleanSheetAway}%`, icon: '🛡️' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-700/30 rounded-xl p-3 text-center">
                    <div className="text-xl mb-1">{s.icon}</div>
                    <div className="text-lg font-black text-white">{s.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Marcadores más probables */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Marcadores más probables
                </p>
                <div className="flex flex-wrap gap-2">
                  {sim.topScores.map((s, i) => (
                    <div key={s.score} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${
                      i === 0
                        ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                        : 'bg-slate-700/40 border-slate-600/40 text-slate-300'
                    }`}>
                      <span className={`font-black text-lg ${i === 0 ? 'text-sky-400' : 'text-white'}`}>
                        {s.score}
                      </span>
                      <span className="text-xs opacity-70">{s.probability}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Factores usados */}
              <div className="text-xs text-slate-600 border-t border-slate-700/50 pt-3">
                Modelo basado en: Ranking FIFA ({sim.homeName} #{sim.homeRank} · {sim.awayName} #{sim.awayRank}) + historial mundialista + distribución de Poisson · {sim.iterations.toLocaleString()} iteraciones
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Análisis con IA ── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700/50"
          style={{ backgroundColor: '#162032' }}>
          <h3 className="font-bold text-white">🤖 Análisis con IA</h3>
          <p className="text-xs text-slate-500 mt-0.5">Pregúntale a la IA sobre este partido</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Preguntas sugeridas */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Preguntas sugeridas</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setQuestion(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-400 hover:border-sky-500/40 hover:text-sky-400 transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !(aiLoading || streaming) && askClaude()}
              placeholder={`Pregunta sobre ${homeTeam?.name} vs ${awayTeam?.name}...`}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            <button
              onClick={askClaude}
              disabled={aiLoading || streaming || !question.trim()}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-all disabled:opacity-40 flex-shrink-0"
            >
              {(aiLoading || streaming) ? '⟳' : '→'}
            </button>
          </div>

          {/* Respuesta */}
          {aiLoading && !streaming && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-700/30">
              <span className="text-orange-400 animate-pulse text-xl">🤖</span>
              <span className="text-slate-400 text-sm">Analizando el partido...</span>
            </div>
          )}

          {aiError && !aiLoading && !streaming && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {aiError}
            </div>
          )}

          {(aiResponse || streaming) && (
            <div className="p-4 rounded-xl bg-slate-700/20 border border-slate-600/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-orange-400">🤖</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Análisis IA</span>
                {streaming && (
                  <span className="ml-auto text-xs text-orange-400 animate-pulse">Escribiendo...</span>
                )}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {aiResponse}
                {streaming && <span className="inline-block w-0.5 h-4 bg-orange-400 animate-pulse ml-0.5 align-middle" />}
              </p>
              {!streaming && aiResponse && (
                <p className="text-xs text-slate-600 mt-3 border-t border-slate-700 pt-2">
                  ⚠️ Este análisis es informativo y no constituye recomendación de apuesta.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
