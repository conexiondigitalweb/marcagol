import { createContext, useContext, useState, useEffect } from 'react'
import { calculatePredictionPoints } from '../utils/helpers'
import { getResult } from '../data/matchResults'

const PredictionsContext = createContext(null)
const STORAGE_KEY = 'marcagol_predictions'

export function PredictionsProvider({ children }) {
  const [predictions, setPredictions] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} }
    catch { return {} }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions))
  }, [predictions])

  const savePrediction = (matchId, home, away) => {
    setPredictions(prev => ({
      ...prev,
      [matchId]: { home: Number(home), away: Number(away), savedAt: new Date().toISOString(), points: null },
    }))
  }

  const getPrediction  = (matchId) => predictions[matchId] || null
  const clearPrediction = (matchId) => {
    setPredictions(prev => { const n = { ...prev }; delete n[matchId]; return n })
  }

  // Compute stats from getResult() — the only source of truth for finished scores
  const totalPoints = Object.entries(predictions).reduce((sum, [id, pred]) => {
    const result = getResult(Number(id))
    if (!result) return sum
    return sum + (calculatePredictionPoints(pred, result.homeScore, result.awayScore) || 0)
  }, 0)

  const predictedCount = Object.keys(predictions).length

  const correctResults = Object.entries(predictions).filter(([id, pred]) => {
    const result = getResult(Number(id))
    if (!result) return false
    return calculatePredictionPoints(pred, result.homeScore, result.awayScore) > 0
  }).length

  return (
    <PredictionsContext.Provider value={{
      predictions, savePrediction, getPrediction, clearPrediction,
      totalPoints, predictedCount, correctResults,
    }}>
      {children}
    </PredictionsContext.Provider>
  )
}

export const usePredictions = () => {
  const ctx = useContext(PredictionsContext)
  if (!ctx) throw new Error('usePredictions must be used within PredictionsProvider')
  return ctx
}
