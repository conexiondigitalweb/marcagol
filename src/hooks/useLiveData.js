// useLiveData.js — Hook React para datos en vivo
// Maneja polling automático y estados de carga

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  getLiveMatches, getTodayMatches, getStandings,
  getTopScorers, getTopAssists, getMatchDetail, getFixture,
  bustFixtureCache,
} from '../data/liveData'
import { TEAM_IDS } from '../data/teamIds'

// ─── Utilidad compartida: raw API live → { [appMatchId]: liveScore } ─────────
const _LIVE_SET = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'PEN'])
const _ALIAS    = { RSA: 'ZAF', HAI: 'HTI', PAR: 'PRY' }
function _tid(code) { return TEAM_IDS[_ALIAS[code] ?? code] ?? null }

export function buildLiveScoresMap(liveApiMatches, appMatches) {
  const scores = {}
  for (const m of appMatches) {
    const hId = _tid(m.homeTeam)
    const aId = _tid(m.awayTeam)
    if (!hId || !aId) continue
    const live = (liveApiMatches || []).find(
      lm => lm.teams?.home?.id === hId && lm.teams?.away?.id === aId
    )
    if (live && _LIVE_SET.has(live.fixture?.status?.short)) {
      scores[m.id] = {
        homeScore: live.goals?.home ?? 0,
        awayScore: live.goals?.away ?? 0,
        status:    live.fixture?.status?.short,
        minute:    live.fixture?.status?.elapsed,
      }
    }
  }
  return scores
}

// ─── Normalización de fixture API → shape compatible con MatchHeader ──────────
function normalizeFixtureForHeader(f) {
  if (!f) return null
  return {
    homeScore: f.goals?.home ?? null,
    awayScore: f.goals?.away ?? null,
    minute:    f.fixture?.status?.elapsed ?? null,
    extra:     f.fixture?.status?.extra ?? null,
    status:    f.fixture?.status?.short ?? null,
    referee:   f.fixture?.referee ?? null,
  }
}

const FT_STATUSES = new Set(['FT', 'AET', 'PEN'])

// ─── Hook: Datos de fixture individual (marcador en vivo + status) ────────────
// Polling base cada 30s. Expone forceRefetch() para refetch inmediato cuando
// el feed de eventos detecta un gol o anulación (debounce mínimo 5s).
export function useFixtureData(fixtureId) {
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [isFinished, setIsFinished] = useState(false)
  const timerRef       = useRef(null)
  const aliveRef       = useRef(false)
  const isFinishedRef  = useRef(false)
  const lastForcedRef  = useRef(0)

  const poll = useCallback(async () => {
    if (!fixtureId || !aliveRef.current || isFinishedRef.current) return
    try {
      const f = await getFixture(fixtureId)
      if (!aliveRef.current) return
      setData(normalizeFixtureForHeader(f))
      setLoading(false)
      if (f && FT_STATUSES.has(f.fixture?.status?.short)) {
        isFinishedRef.current = true
        setIsFinished(true)
        try { localStorage.setItem(`wc2026_ft_fixture_${fixtureId}`, JSON.stringify(f)) } catch {}
      } else if (aliveRef.current) {
        timerRef.current = setTimeout(poll, 30_000)
      }
    } catch {
      if (aliveRef.current) { setLoading(false); timerRef.current = setTimeout(poll, 60_000) }
    }
  }, [fixtureId])

  // Refetch inmediato: cancela el timer pendiente, invalida caché, re-fetchea,
  // y el poll() reschedula el ciclo normal de 30s al terminar.
  const forceRefetch = useCallback(() => {
    const now = Date.now()
    if (now - lastForcedRef.current < 5_000) return
    if (isFinishedRef.current || !aliveRef.current) return
    lastForcedRef.current = now
    clearTimeout(timerRef.current)
    bustFixtureCache(fixtureId)
    poll()
  }, [fixtureId, poll])

  useEffect(() => {
    if (!fixtureId) { setLoading(false); return }
    aliveRef.current    = true
    isFinishedRef.current = false

    // Caché permanente de partidos FT
    try {
      const cached = localStorage.getItem(`wc2026_ft_fixture_${fixtureId}`)
      if (cached) {
        const f = JSON.parse(cached)
        setData(normalizeFixtureForHeader(f))
        isFinishedRef.current = true
        setIsFinished(true)
        setLoading(false)
        return
      }
    } catch {}

    poll()
    return () => {
      aliveRef.current = false
      clearTimeout(timerRef.current)
    }
  }, [fixtureId, poll])

  return { data, loading, isFinished, forceRefetch }
}

// ─── Hook: Partidos en vivo (polling cada 30s) ────────────────────────────────
export function useLiveMatches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const intervalRef = useRef(null)

  const fetch = useCallback(async () => {
    try {
      const data = await getLiveMatches()
      if (data) setMatches(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    intervalRef.current = setInterval(fetch, 30000) // cada 30s
    return () => clearInterval(intervalRef.current)
  }, [fetch])

  return { matches, loading, error, refetch: fetch }
}

// ─── Hook: Mapa { appMatchId → liveScore } para un array de matches estáticos ──
export function useLiveScoresMap(appMatches) {
  const { matches } = useLiveMatches()
  return useMemo(() => buildLiveScoresMap(matches, appMatches), [matches, appMatches])
}

// ─── Hook: Partidos del día (polling cada 5min) ───────────────────────────────
export function useTodayMatches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async () => {
    try {
      const data = await getTodayMatches()
      if (data) setMatches(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetch])

  return { matches, loading, error, refetch: fetch }
}

// ─── Hook: Tablas de posiciones (polling cada 10min) ──────────────────────────
export function useStandings() {
  const [standings, setStandings] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const fetch = useCallback(async () => {
    try {
      const data = await getStandings()
      if (data) setStandings(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetch])

  return { standings, loading, error, refetch: fetch }
}

// ─── Hook: Goleadores y asistidores ──────────────────────────────────────────
export function useTopStats() {
  const [scorers, setScorers]   = useState([])
  const [assists, setAssists]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const fetch = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([getTopScorers(), getTopAssists()])
      if (s) setScorers(s)
      if (a) setAssists(a)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetch])

  return { scorers, assists, loading, error, refetch: fetch }
}

// ─── Hook: Detalle de un partido (eventos + stats + alineaciones) ─────────────
// isFinished=true → fetch único desde caché, sin polling.
// isFinished=true + datos cargados → persiste en localStorage (sin TTL).
export function useMatchDetail(fixtureId, isFinished = false) {
  const [events, setEvents]       = useState([])
  const [stats, setStats]         = useState([])
  const [lineups, setLineups]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const intervalRef = useRef(null)
  const ftSavedRef  = useRef(false)

  const fetch = useCallback(async () => {
    if (!fixtureId) return
    try {
      const data = await getMatchDetail(fixtureId)
      if (data.events?.length)  setEvents(data.events)
      if (data.stats?.length)   setStats(data.stats)
      if (data.lineups?.length) setLineups(data.lineups)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [fixtureId])

  useEffect(() => {
    fetch()
    if (!isFinished) {
      intervalRef.current = setInterval(fetch, 10_000)
    }
    return () => clearInterval(intervalRef.current)
  }, [fetch, isFinished])

  // Persistir detalle FT en localStorage una sola vez
  useEffect(() => {
    if (!isFinished || ftSavedRef.current || !fixtureId) return
    if (events.length === 0 && lineups.length === 0) return
    ftSavedRef.current = true
    try {
      const key = `wc2026_ft_detail_v1_${fixtureId}`
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify({ events, stats, lineups }))
      }
    } catch {}
  }, [isFinished, events, lineups, stats, fixtureId])

  return { events, stats, lineups, loading, error, refetch: fetch }
}
