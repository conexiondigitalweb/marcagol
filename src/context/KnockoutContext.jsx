import { createContext, useContext, useState, useEffect } from 'react'
import { MATCHES } from '../data/matches'
import { getKnockoutWinners } from '../utils/knockoutResults'

const KnockoutContext = createContext({})

// Proveedor global: polling cada 60s para ganadores R32 → alimenta Bracket y Calendario
export function KnockoutProvider({ children }) {
  const [knockoutWinners, setKnockoutWinners] = useState({})

  useEffect(() => {
    const allFixtures = MATCHES
      .filter(m => (m.group === 'R32' || m.group === 'R16') && m.fixtureId)
      .map(m => ({ matchId: m.id, fixtureId: m.fixtureId }))
    if (!allFixtures.length) return
    let cancelled = false
    async function poll() {
      const w = await getKnockoutWinners(allFixtures)
      if (!cancelled) setKnockoutWinners(prev => ({ ...prev, ...w }))
    }
    poll()
    const timer = setInterval(poll, 60_000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [])

  return (
    <KnockoutContext.Provider value={{ knockoutWinners }}>
      {children}
    </KnockoutContext.Provider>
  )
}

export function useKnockoutWinners() {
  return useContext(KnockoutContext).knockoutWinners
}
