import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MATCHES } from '../data/matches'
import { getResult } from '../data/matchResults'

const LS_KEY = 'polla_nombre'

// Extrae solo YYYY-MM-DD aunque Supabase devuelva timestamp completo
function safeDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr.slice(0, 10) + 'T12:00:00')
  return isNaN(d.getTime()) ? null : d
}

function formatFecha(dateStr, timeCol) {
  const d = safeDate(dateStr)
  if (!d) return timeCol || ''
  const parte = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
  return timeCol ? `${parte} · ${timeCol} COL` : parte
}

function kickoffMs(match) {
  if (!match?.date || !match?.timeCol) return null
  return new Date(`${match.date}T${match.timeCol.slice(0, 5)}:00-05:00`).getTime()
}

function getEstadoPolla(polla, match) {
  if (!match) {
    return polla.activa
      ? { label: 'Activa', cls: 'bg-green-500/15 text-green-400' }
      : { label: 'Cerrada', cls: 'bg-slate-700 text-slate-400' }
  }
  const result  = getResult(match.id)
  const started = Date.now() >= (kickoffMs(match) ?? Infinity)

  if (result)   return { label: 'Finalizada', cls: 'bg-slate-700 text-slate-400', pulse: false }
  if (started)  return { label: 'En juego',   cls: 'bg-orange-500/20 text-orange-400', pulse: true }
  if (!polla.activa) return { label: 'Cerrada', cls: 'bg-slate-700 text-slate-400', pulse: false }
  return { label: 'Activa', cls: 'bg-green-500/15 text-green-400', pulse: false }
}

export default function MisPollas() {
  const [nombre, setNombre]     = useState(() => localStorage.getItem(LS_KEY) || '')
  const [pollas, setPollas]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Auto-buscar si ya hay nombre guardado
  useEffect(() => {
    if (nombre.trim()) buscar(nombre.trim())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function buscar(nombreBuscar) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/polla?action=mis-pollas&nombre=${encodeURIComponent(nombreBuscar)}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al buscar'); return }
      setPollas(data.pollas || [])
      localStorage.setItem(LS_KEY, nombreBuscar)
    } catch (err) {
      setError(`Error de red: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    buscar(nombre.trim())
  }

  return (
    <div className="max-w-lg mx-auto animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white mb-0.5">Mis Pollas</h1>
          <p className="text-slate-400 text-sm">Gestiona las pollas que creaste</p>
        </div>
        <Link
          to="/crear-polla"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-white text-sm"
          style={{ background: '#F97316' }}
        >
          + Nueva
        </Link>
      </div>

      {/* Buscador por nombre */}
      <form onSubmit={handleSubmit} className="card p-5 mb-6">
        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
          Tu nombre de creador
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="¿Con qué nombre creaste tus pollas?"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500"
            maxLength={50}
          />
          <button
            type="submit"
            disabled={loading || !nombre.trim()}
            className="px-4 py-2.5 rounded-lg font-bold text-white text-sm disabled:opacity-50 flex-shrink-0"
            style={{ background: '#38BDF8', color: '#0F172A' }}
          >
            {loading ? '…' : 'Buscar'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </form>

      {/* Resultados */}
      {pollas === null && !loading && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-3xl mb-3">🎯</p>
          <p className="text-sm">Ingresa tu nombre para ver tus pollas</p>
        </div>
      )}

      {pollas !== null && pollas.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-sm mb-4">No encontramos pollas creadas por <strong className="text-slate-300">"{nombre}"</strong></p>
          <Link to="/crear-polla" className="text-sky-400 hover:underline text-sm">
            Crear tu primera polla →
          </Link>
        </div>
      )}

      {pollas && pollas.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider px-1">
            {pollas.length} polla{pollas.length !== 1 ? 's' : ''} encontrada{pollas.length !== 1 ? 's' : ''}
          </p>
          {pollas.map(p => {
            const match  = MATCHES.find(m => m.id === p.partido_id)
            const estado = getEstadoPolla(p, match)
            return (
              <div key={p.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm leading-tight truncate">
                      {p.equipo_local} vs {p.equipo_visitante}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatFecha(p.fecha_partido, match?.timeCol)}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${estado.cls}`}>
                    {estado.pulse && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />
                    )}
                    {estado.label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>👥 {p.participantes} participante{p.participantes !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{p.permite_repetir ? (p.max_repeticiones ? `Máx. ${p.max_repeticiones}` : 'Repetible') : 'Sin repetir'}</span>
                  </div>
                  <Link
                    to={`/polla/${p.id}`}
                    className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    Gestionar →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
