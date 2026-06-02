import { createContext, useContext, useState, useEffect } from 'react'
import { MATCHES } from '../data/matches'
import { calculatePredictionPoints } from '../utils/helpers'

const PredictionsContext = createContext(null)

const STORAGE_KEY = 'marcagol_predictions'

export function PredictionsProvider({ children }) {
  const [predictions, setPredictions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions))
  }, [predictions])

  const savePrediction = (matchId, home, away) => {
    setPredictions(prev => ({
      ...prev,
      [matchId]: { home: Number(home), away: Number(away), savedAt: Date.now() },
    }))
  }

  const getPrediction = (matchId) => predictions[matchId] || null

  const clearPrediction = (matchId) => {
    setPredictions(prev => {
      const next = { ...prev }
      delete next[matchId]
      return next
    })
  }

  const totalPoints = Object.entries(predictions).reduce((sum, [id, pred]) => {
    const match = MATCHES.find(m => m.id === Number(id))
    if (!match || match.status !== 'finished') return sum
    return sum + (calculatePredictionPoints(pred, match.homeScore, match.awayScore) || 0)
  }, 0)

  const predictedCount  = Object.keys(predictions).length
  const finishedPreds   = MATCHES.filter(m => m.status === 'finished' && predictions[m.id])
  const correctResults  = finishedPreds.filter(m => {
    const p = predictions[m.id]
    return calculatePredictionPoints(p, m.homeScore, m.awayScore) > 0
  }).length

  return (
    <PredictionsContext.Provider value={{
      predictions,
      savePrediction,
      getPrediction,
      clearPrediction,
      totalPoints,
      predictedCount,
      correctResults,
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
