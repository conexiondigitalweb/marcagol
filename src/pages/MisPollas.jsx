import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MATCHES } from '../data/matches'
import { getResult } from '../data/matchResults'

const MIS_POLLAS_KEY = 'mis_pollas'

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(String(dateStr).slice(0, 10) + 'T12:00:00')
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
      ? { label: 'Activa',  cls: 'bg-green-500/15 text-green-400'  }
      : { label: 'Cerrada', cls: 'bg-slate-700 text-slate-400'     }
  }
  const result  = getResult(match.id)
  const started = Date.now() >= (kickoffMs(match) ?? Infinity)
  if (result)        return { label: 'Finalizada', cls: 'bg-slate-700 text-slate-400',      pulse: false }
  if (started)       return { label: 'En juego',   cls: 'bg-orange-500/20 text-orange-400', pulse: true  }
  if (!polla.activa) return { label: 'Cerrada',    cls: 'bg-slate-700 text-slate-400',      pulse: false }
  return               { label: 'Activa',           cls: 'bg-green-500/15 text-green-400',  pulse: false }
}

// Lee mis_pollas del localStorage (array cache)
function getMisPollas() {
  try { return JSON.parse(localStorage.getItem(MIS_POLLAS_KEY) || '[]') } catch { return [] }
}

// Lee todos los polla_token_* del localStorage → { [pollaId]: token }
function getTokenMap() {
  const map = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('polla_token_')) {
      const pid = key.slice('polla_token_'.length)
      map[pid] = localStorage.getItem(key)
    }
  }
  return map
}

// Guarda token en ambas estructuras de localStorage
function guardarToken(pollaId, token) {
  localStorage.setItem(`polla_token_${pollaId}`, token)
}

// ── Tarjeta de polla ──────────────────────────────────────────────────────────

function PollaCard({ polla, isAdmin, onReclamar, reclamando }) {
  const match  = MATCHES.find(m => m.id === Number(polla.partido_id))
  const estado = getEstadoPolla(polla, match)

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-bold text-white text-sm leading-tight truncate">
            {polla.equipo_local} vs {polla.equipo_visitante}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatFecha(polla.fecha_partido, match?.timeCol)}
            {polla.creador_nombre && (
              <span className="text-slate-600"> · {polla.creador_nombre}</span>
            )}
          </p>
        </div>
        <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${estado.cls}`}>
          {estado.pulse && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />}
          {estado.label}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>👥 {polla.participantes ?? '–'}</span>
          {isAdmin && <span className="text-orange-400 font-semibold">⚙️ Admin</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* Reclamar admin (solo si puede_reclamar=true y no es admin) */}
          {!isAdmin && polla.puede_reclamar && onReclamar && (
            <button
              onClick={() => onReclamar(polla.id)}
              disabled={reclamando === polla.id}
              className="text-xs font-bold px-2.5 py-1 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
            >
              {reclamando === polla.id ? '…' : '🔑 Reclamar'}
            </button>
          )}
          <Link
            to={`/polla/${polla.id}`}
            className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
          >
            {isAdmin ? 'Gestionar →' : 'Ver →'}
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function MisPollas() {
  const [tokenMap, setTokenMap]           = useState(() => getTokenMap())

  // Sección 1: pollas locales (por tokens)
  const [pollasLocales, setPollasLocales] = useState(null)
  const [loadingLocal, setLoadingLocal]   = useState(false)

  // Sección 2: búsqueda por nombre
  const [nombre, setNombre]               = useState('')
  const [pollasNombre, setPollasNombre]   = useState(null)
  const [loadingNombre, setLoadingNombre] = useState(false)
  const [errorNombre, setErrorNombre]     = useState('')

  // Reclamar
  const [reclamando, setReclamando]       = useState(null)
  const [reclamarMsg, setReclamarMsg]     = useState('')

  // ── Carga pollas locales por IDs en tokenMap ────────────────────────────
  const cargarLocales = useCallback(async (tMap) => {
    const ids = Object.keys(tMap)
    if (ids.length === 0) { setPollasLocales([]); return }
    setLoadingLocal(true)
    try {
      const res  = await fetch(`/api/polla?action=mis-pollas&ids=${encodeURIComponent(ids.join(','))}`)
      const data = await res.json()
      setPollasLocales(res.ok ? (data.pollas || []) : [])
    } catch {
      setPollasLocales([])
    } finally {
      setLoadingLocal(false)
    }
  }, [])

  useEffect(() => {
    cargarLocales(tokenMap)
  }, [cargarLocales, tokenMap])

  // ── Búsqueda por nombre ─────────────────────────────────────────────────
  async function buscarPorNombre(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    setLoadingNombre(true)
    setErrorNombre('')
    setPollasNombre(null)
    setReclamarMsg('')
    try {
      const res  = await fetch(`/api/polla?action=mis-pollas&nombre=${encodeURIComponent(nombre.trim())}`)
      const data = await res.json()
      if (!res.ok) { setErrorNombre(data.error || 'Error al buscar'); return }
      setPollasNombre(data.pollas || [])
    } catch (err) {
      setErrorNombre(`Error de red: ${err.message}`)
    } finally {
      setLoadingNombre(false)
    }
  }

  // ── Reclamar admin ──────────────────────────────────────────────────────
  async function reclamar(pollaId) {
    setReclamando(pollaId)
    setReclamarMsg('')
    try {
      const res  = await fetch('/api/polla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reclamar', polla_id: pollaId, creador_nombre: nombre.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setReclamarMsg(`❌ ${data.error}`); return }

      if (data.reclamado) {
        guardarToken(pollaId, data.token_admin)
        const newMap = { ...tokenMap, [pollaId]: data.token_admin }
        setTokenMap(newMap)
        setReclamarMsg('✅ ¡Admin reclamado! Ahora puedes gestionar esta polla.')
        // Quitar puede_reclamar en resultados por nombre y recargar locales
        setPollasNombre(prev => prev?.map(p => p.id === pollaId ? { ...p, puede_reclamar: false } : p))
        cargarLocales(newMap)
      } else {
        setReclamarMsg('ℹ️ Esta polla ya fue reclamada desde otro dispositivo.')
      }
    } catch (err) {
      setReclamarMsg(`❌ Error de red: ${err.message}`)
    } finally {
      setReclamando(null)
    }
  }

  const localIds    = Object.keys(tokenMap)
  const hasLocal    = localIds.length > 0
  const cacheLocal  = getMisPollas()

  return (
    <div className="max-w-lg mx-auto animate-slide-up">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white mb-0.5">Mis Pollas</h1>
          <p className="text-slate-400 text-sm">Crea y gestiona pollas para el Mundial</p>
        </div>
        <Link
          to="/crear-polla"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-white text-sm"
          style={{ background: '#F97316' }}
        >
          + Nueva
        </Link>
      </div>

      {/* ── Sección 1: Dispositivo actual ─────────────────────────────────── */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            📱 En este dispositivo
          </h2>
          {loadingLocal && <span className="text-xs text-slate-600 animate-pulse">Cargando…</span>}
        </div>

        {!hasLocal && !loadingLocal && (
          <div className="text-center py-8 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <p className="text-2xl mb-2">🎰</p>
            <p className="text-sm mb-3">No has creado pollas desde este dispositivo</p>
            <Link to="/crear-polla" className="text-sky-400 hover:underline text-sm">
              Crear tu primera polla →
            </Link>
          </div>
        )}

        {/* Vista previa inmediata desde localStorage mientras carga */}
        {hasLocal && loadingLocal && cacheLocal.length > 0 && (
          <div className="space-y-3 opacity-50">
            {cacheLocal.slice(0, 3).map(p => (
              <div key={p.id} className="card p-4 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-700/60 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {pollasLocales && pollasLocales.length > 0 && (
          <div className="space-y-3">
            {pollasLocales.map(p => (
              <PollaCard key={p.id} polla={p} isAdmin={true} />
            ))}
          </div>
        )}

        {pollasLocales && pollasLocales.length === 0 && hasLocal && (
          <p className="text-slate-500 text-sm text-center py-4">
            No se encontraron las pollas en la base de datos.
          </p>
        )}
      </section>

      {/* Divisor */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 border-t border-slate-700/60" />
        <span className="text-xs text-slate-600 uppercase tracking-wider">o busca por nombre</span>
        <div className="flex-1 border-t border-slate-700/60" />
      </div>

      {/* ── Sección 2: Búsqueda por nombre (fallback) ─────────────────────── */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          🔍 Buscar por nombre de creador
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          Recupera pollas desde otro dispositivo. Para administrarlas, usa "Reclamar".
        </p>

        <form onSubmit={buscarPorNombre} className="flex gap-2 mb-4">
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Tu nombre de creador"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500"
            maxLength={50}
          />
          <button
            type="submit"
            disabled={loadingNombre || !nombre.trim()}
            className="px-4 py-2.5 rounded-lg font-bold text-sm disabled:opacity-50 flex-shrink-0"
            style={{ background: '#38BDF8', color: '#0F172A' }}
          >
            {loadingNombre ? '…' : 'Buscar'}
          </button>
        </form>

        {errorNombre && <p className="text-red-400 text-xs mb-3">{errorNombre}</p>}

        {reclamarMsg && (
          <div className="mb-3 p-3 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300">
            {reclamarMsg}
          </div>
        )}

        {pollasNombre !== null && pollasNombre.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">No encontramos pollas de <strong className="text-slate-300">"{nombre}"</strong></p>
          </div>
        )}

        {pollasNombre && pollasNombre.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 px-1">
              {pollasNombre.length} polla{pollasNombre.length !== 1 ? 's' : ''} encontrada{pollasNombre.length !== 1 ? 's' : ''}
              {' '}<span className="text-slate-600">· Sin token de admin local</span>
            </p>
            {pollasNombre.map(p => (
              <PollaCard
                key={p.id}
                polla={p}
                isAdmin={!!tokenMap[p.id]}
                onReclamar={reclamar}
                reclamando={reclamando}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
