// useLiveData.js — Hook React para datos en vivo
// Maneja polling automático y estados de carga

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getLiveMatches, getTodayMatches, getStandings,
  getTopScorers, getTopAssists, getMatchDetail, getFixture
} from '../data/liveData'

// ─── Normalización de fixture API → shape compatible con MatchHeader ──────────
function normalizeFixtureForHeader(f) {
  if (!f) return null
  return {
    homeScore: f.goals?.home ?? null,
    awayScore: f.goals?.away ?? null,
    minute:    f.fixture?.status?.elapsed ?? null,
    status:    f.fixture?.status?.short ?? null,
    referee:   f.fixture?.referee ?? null,
  }
}

const FT_STATUSES = new Set(['FT', 'AET', 'PEN'])

// ─── Hook: Datos de fixture individual (marcador en vivo + status) ────────────
// Polling cada 30s mientras no esté finalizado.
// Caché permanente en localStorage para partidos FT.
export function useFixtureData(fixtureId) {
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [isFinished, setIsFinished] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!fixtureId) { setLoading(false); return }
    let alive = true

    // Comprobar caché permanente de partidos FT
    try {
      const cached = localStorage.getItem(`wc2026_ft_fixture_${fixtureId}`)
      if (cached) {
        const f = JSON.parse(cached)
        setData(normalizeFixtureForHeader(f))
        setIsFinished(true)
        setLoading(false)
        return
      }
    } catch {}

    async function poll() {
      try {
        const f = await getFixture(fixtureId)
        if (!alive) return
        setData(normalizeFixtureForHeader(f))
        setLoading(false)
        if (f && FT_STATUSES.has(f.fixture?.status?.short)) {
          setIsFinished(true)
          try { localStorage.setItem(`wc2026_ft_fixture_${fixtureId}`, JSON.stringify(f)) } catch {}
        } else if (alive) {
          timerRef.current = setTimeout(poll, 30_000)
        }
      } catch {
        if (alive) setLoading(false)
        if (alive) timerRef.current = setTimeout(poll, 60_000)  // retry más lento en error
      }
    }

    poll()
    return () => {
      alive = false
      clearTimeout(timerRef.current)
    }
  }, [fixtureId])

  return { data, loading, isFinished }
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
