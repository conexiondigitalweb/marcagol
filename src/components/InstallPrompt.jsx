import { useState, useEffect } from 'react'

const STORAGE_KEY = 'pwa-install-dismissed'

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  return window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showAndroid, setShowAndroid] = useState(false)
  const [showIOS, setShowIOS] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    if (isInStandaloneMode()) return

    if (isIOS()) {
      const isSafari = /safari/i.test(navigator.userAgent) && !/crios|fxios|opios/i.test(navigator.userAgent)
      if (isSafari) setShowIOS(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowAndroid(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setShowAndroid(false)
    setShowIOS(false)
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowAndroid(false)
      setDeferredPrompt(null)
    }
  }

  if (!showAndroid && !showIOS) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 animate-slide-up"
      style={{ animation: 'slideUp 0.35s ease-out both' }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div className="max-w-lg mx-auto bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5 select-none">●</span>

        <div className="flex-1 min-w-0">
          {showAndroid ? (
            <>
              <p className="text-white font-semibold text-sm leading-snug">
                Instala MarcaGol como app
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                Acceso rápido, sin barra de navegación
              </p>
              <button
                onClick={install}
                className="mt-2 px-4 py-1.5 rounded-lg text-white text-sm font-semibold"
                style={{ backgroundColor: '#F97316' }}
              >
                Instalar
              </button>
            </>
          ) : (
            <>
              <p className="text-white font-semibold text-sm leading-snug">
                Instala MarcaGol como app
              </p>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Toca <strong className="text-slate-300">Compartir</strong>{' '}
                <span className="inline-block">⬆️</span> →{' '}
                <strong className="text-slate-300">Agregar a pantalla de inicio</strong>
              </p>
            </>
          )}
        </div>

        <button
          onClick={dismiss}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1 -mt-0.5 -mr-1 flex-shrink-0"
          aria-label="Cerrar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.7 3.3a1 1 0 0 0-1.4 0L8 6.6 4.7 3.3a1 1 0 0 0-1.4 1.4L6.6 8l-3.3 3.3a1 1 0 0 0 1.4 1.4L8 9.4l3.3 3.3a1 1 0 0 0 1.4-1.4L9.4 8l3.3-3.3a1 1 0 0 0 0-1.4Z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
