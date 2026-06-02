import { createContext, useContext, useState, useEffect } from 'react'
import { getLiveMatches } from '../data/matches'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [liveMatches, setLiveMatches]     = useState([])
  const [selectedCountry, setSelectedCountry] = useState('Todos')
  const [apiConnected, setApiConnected]   = useState(false)

  useEffect(() => {
    const live = getLiveMatches()
    setLiveMatches(live)

    // Refresh live match data every 60s
    const interval = setInterval(() => {
      setLiveMatches(getLiveMatches())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <AppContext.Provider value={{
      liveMatches,
      selectedCountry,
      setSelectedCountry,
      apiConnected,
      setApiConnected,
      hasLive: liveMatches.length > 0,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
