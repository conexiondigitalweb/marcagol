// useLiveData.js — Hook React para datos en vivo
// Maneja polling automático y estados de carga

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getLiveMatches, getTodayMatches, getStandings,
  getTopScorers, getTopAssists, getMatchDetail
} from '../data/liveData'

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
export function useMatchDetail(fixtureId) {
  const [events, setEvents]       = useState([])
  const [stats, setStats]         = useState([])
  const [lineups, setLineups]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const intervalRef = useRef(null)

  const fetch = useCallback(async () => {
    if (!fixtureId) return
    try {
      const data = await getMatchDetail(fixtureId)
      if (data.events)  setEvents(data.events)
      if (data.stats)   setStats(data.stats)
      if (data.lineups) setLineups(data.lineups)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [fixtureId])

  useEffect(() => {
    fetch()
    // Polling cada 30s solo si hay partido activo
    intervalRef.current = setInterval(fetch, 30000)
    return () => clearInterval(intervalRef.current)
  }, [fetch])

  return { events, stats, lineups, loading, error, refetch: fetch }
}
