import { useState, useEffect } from 'react'

export default function UpdatePrompt() {
  const [countdown, setCountdown] = useState(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let intervalId = null

    navigator.serviceWorker.ready.then(r => {
      intervalId = setInterval(() => {
        r.update().catch(() => {})
      }, 30_000)
    }).catch(() => {})

    const handleControllerChange = () => setCountdown(3)
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      window.location.reload()
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  if (countdown === null) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
    >
      <div
        onClick={() => window.location.reload()}
        className="max-w-lg mx-auto rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-3 cursor-pointer"
        style={{ backgroundColor: '#1E293B', border: '1px solid rgba(56,189,248,0.35)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl flex-shrink-0">🔄</span>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">
              Nueva versión disponible — toca para actualizar
            </p>
            <p className="text-slate-400 text-xs mt-0.5">Recargando en {countdown}s...</p>
          </div>
        </div>
        <span
          className="flex-shrink-0 w-9 h-9 rounded-xl font-bold text-lg flex items-center justify-center"
          style={{ background: '#38BDF8', color: '#0F172A' }}
        >
          {countdown}
        </span>
      </div>
    </div>
  )
}
