import { useState } from 'react'
import { CACHE_KEYS } from '../cacheConfig'

// Lee el total de goles acumulado en el caché local de resultados FT
// (wc2026_results_v1) — sin llamar a la API. Si el device nunca guardó
// ningún resultado, devuelve null y la tarjeta de estadística no se muestra.
function readCachedGoals() {
  try {
    const store = JSON.parse(localStorage.getItem(CACHE_KEYS.RESULTS) || '{}')
    const partidos = Object.values(store)
    if (!partidos.length) return null
    const totalGoles = partidos.reduce(
      (sum, m) => sum + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0
    )
    return { totalGoles, totalPartidos: partidos.length }
  } catch {
    return null
  }
}

export default function Dashboard() {
  const [cachedStats] = useState(readCachedGoals)

  return (
    <div className="flex items-center justify-center animate-slide-up" style={{ minHeight: '65vh' }}>
      <div className="text-center max-w-xl mx-auto px-4">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span style={{ color: '#F97316', fontSize: '32px', lineHeight: 1 }}>●</span>
          <div className="leading-tight">
            <span className="font-extrabold text-3xl tracking-tight" style={{ color: '#F8FAFC' }}>marca</span>
            <span className="font-extrabold text-3xl tracking-tight" style={{ color: '#38BDF8' }}>gol</span>
            <span className="text-slate-500 text-base">.live</span>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
          ¡Gracias por seguir el Mundial 2026 con nosotros!
        </h1>

        <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-6">
          Marcagol.live cubrió en vivo la fase de grupos, dieciseisavos y octavos de final
          del Mundial 2026. Fue un torneo increíble. Nos vemos en el próximo. 🏆
        </p>

        {cachedStats && (
          <div
            className="inline-block rounded-xl px-6 py-4 mb-6"
            style={{ background: '#1E293B', border: '1px solid #334155' }}
          >
            <div className="text-3xl font-black text-sky-400 tabular-nums">{cachedStats.totalGoles}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">
              goles del Mundial 2026 · {cachedStats.totalPartidos} partidos seguidos aquí
            </div>
          </div>
        )}

        <div
          className="rounded-xl px-5 py-4 mb-8"
          style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}
        >
          <p className="text-sm md:text-base font-semibold text-white">
            🇨🇴 Hasta aquí llegó Colombia, pero dejó todo en la cancha. Orgullo total.
          </p>
        </div>

        <p className="text-xs text-slate-600">
          marcagol.live · Copa Mundial FIFA 2026
        </p>
      </div>
    </div>
  )
}
