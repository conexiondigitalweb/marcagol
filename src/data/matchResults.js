// matchResults.js — Caché permanente de resultados finales (sin TTL)
// Escrito desde MatchDetail cuando se detecta status FT/AET/PEN.
// Leído en Schedule y Dashboard para mostrar marcador final.

const KEY = 'wc2026_results_v1'

function readStore() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function getResult(matchId) {
  return readStore()[String(matchId)] ?? null
}

export function saveResult(matchId, homeScore, awayScore) {
  const store = readStore()
  const key = String(matchId)
  if (store[key]) return  // already saved, no overwrite
  store[key] = { homeScore, awayScore }
  try { localStorage.setItem(KEY, JSON.stringify(store)) } catch {}
}
