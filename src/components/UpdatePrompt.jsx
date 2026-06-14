import { useState, useEffect } from 'react'

export default function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let intervalId = null

    // Verificación periódica cada 60s para detectar nueva versión
    navigator.serviceWorker.ready.then(r => {
      intervalId = setInterval(() => {
        r.update().catch(() => {})
      }, 60_000)
    }).catch(() => {})

    // Cuando el nuevo SW toma control (skipWaiting ya ejecutado), mostrar banner
    const handleControllerChange = () => setShowUpdate(true)
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  if (!showUpdate) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
    >
      <div
        className="max-w-lg mx-auto rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-3"
        style={{ backgroundColor: '#1E293B', border: '1px solid rgba(56,189,248,0.35)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl flex-shrink-0">🔄</span>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">
              Nueva versión disponible
            </p>
            <p className="text-slate-400 text-xs mt-0.5">Toca para actualizar</p>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 active:opacity-75"
          style={{ background: '#38BDF8', color: '#0F172A' }}
        >
          Actualizar
        </button>
      </div>
    </div>
  )
}
