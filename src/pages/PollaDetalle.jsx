import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { MATCHES } from '../data/matches'
import { GROUPS } from '../data/groups'
import { getResult } from '../data/matchResults'

const ALL_TEAMS = Object.fromEntries(
  GROUPS.flatMap(g => g.teams.map(t => [t.code, t]))
)

const LS_KEY        = 'polla_nombre'
const POLL_INTERVAL = 5000

// Kickoff en milisegundos usando timeCol (GMT-5 fijo)
function kickoffMs(match) {
  if (!match?.date || !match?.timeCol) return null
  return new Date(`${match.date}T${match.timeCol.slice(0, 5)}:00-05:00`).getTime()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  } catch { return dateStr }
}

function ScoreInput({ label, value, onChange }) {
  return (
    <div className="flex-1 text-center">
      <div className="text-xs text-slate-400 mb-1.5 font-medium truncate">{label}</div>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        min="0"
        max="30"
        placeholder="0"
        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-3 text-white text-3xl font-black text-center focus:outline-none focus:border-sky-500 tabular-nums"
      />
    </div>
  )
}

function rankVoto(v, result) {
  const exacto = v.goles_local === result.homeScore && v.goles_visitante === result.awayScore
  const resultadoOk = !exacto && (
    (v.goles_local > v.goles_visitante && result.homeScore > result.awayScore) ||
    (v.goles_local < v.goles_visitante && result.homeScore < result.awayScore) ||
    (v.goles_local === v.goles_visitante && result.homeScore === result.awayScore)
  )
  return { ...v, exacto, resultadoOk }
}

// ── Panel de administración ───────────────────────────────────────────────────
function AdminPanel({ polla, votos, onVotoEliminado, onEstadoCambiado }) {
  const [toggling, setToggling]     = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [adminError, setAdminError] = useState('')

  async function toggleActiva() {
    setToggling(true)
    setAdminError('')
    const action = polla.activa ? 'cerrar' : 'reabrir'
    try {
      const res = await fetch('/api/polla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, polla_id: polla.id }),
      })
      const data = await res.json()
      if (!res.ok) { setAdminError(data.error || 'Error'); return }
      onEstadoCambiado(!polla.activa)
    } catch (err) {
      setAdminError(err.message)
    } finally {
      setToggling(false)
    }
  }

  async function eliminarVoto(voto_id) {
    setDeletingId(voto_id)
    setAdminError('')
    try {
      const res = await fetch('/api/polla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'eliminar-voto', voto_id }),
      })
      const data = await res.json()
      if (!res.ok) { setAdminError(data.error || 'Error'); return }
      onVotoEliminado(voto_id)
    } catch (err) {
      setAdminError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="card overflow-hidden mb-4" style={{ borderColor: 'rgba(251,146,60,0.3)' }}>
      <div
        className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between"
        style={{ backgroundColor: 'rgba(249,115,22,0.08)' }}
      >
        <span className="font-semibold text-orange-400 text-sm">⚙️ Administrar polla</span>
        <button
          onClick={toggleActiva}
          disabled={toggling}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors ${
            polla.activa
              ? 'bg-slate-700 text-slate-300 hover:bg-red-500/20 hover:text-red-400'
              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
          }`}
        >
          {toggling ? '…' : polla.activa ? 'Cerrar polla' : 'Reabrir polla'}
        </button>
      </div>

      {adminError && (
        <p className="text-red-400 text-xs px-5 pt-3">{adminError}</p>
      )}

      {votos.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-6">Sin votos aún</p>
      ) : (
        <div className="divide-y divide-slate-700/30">
          {votos.map((v, i) => (
            <div key={v.id ?? i} className="flex items-center gap-3 px-5 py-2.5">
              <span className="w-5 text-xs text-slate-600 text-center flex-shrink-0">{i + 1}</span>
              <span className="flex-1 text-sm text-white truncate">{v.participante_nombre}</span>
              <span className="font-black tabular-nums text-orange-400 text-sm">
                {v.goles_local}–{v.goles_visitante}
              </span>
              <button
                onClick={() => eliminarVoto(v.id)}
                disabled={deletingId === v.id}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40 text-sm"
                title="Eliminar voto"
              >
                {deletingId === v.id ? '…' : '🗑️'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PollaDetalle() {
  const { id } = useParams()
  const { state: navState } = useLocation()

  const [polla, setPolla]           = useState(null)
  const [votos, setVotos]           = useState([])
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError]   = useState('')

  const [nombre, setNombre]               = useState('')
  const [golesLocal, setGolesLocal]       = useState('')
  const [golesVisitante, setGolesVisitante] = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [formError, setFormError]         = useState('')
  const [formSuccess, setFormSuccess]     = useState(false)
  const [copied, setCopied]               = useState(false)

  const isFinishedRef = useRef(false)

  // Nombre guardado en localStorage
  const miNombre = localStorage.getItem(LS_KEY) || ''

  const fetchDetalle = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch(`/api/polla?id=${id}`)
      if (!res.ok) {
        if (isInitial) setPageError('Polla no encontrada')
        return
      }
      const { polla: p, votos: v } = await res.json()
      if (isInitial) {
        setPolla(p)
        setPageLoading(false)
      } else {
        // Actualización parcial: solo refrescar activa y votos
        setPolla(prev => prev ? { ...prev, activa: p.activa } : p)
      }
      setVotos(v || [])
    } catch (err) {
      if (isInitial) setPageError(`Error de red: ${err.message}`)
    }
  }, [id])

  useEffect(() => { fetchDetalle(true) }, [fetchDetalle])

  useEffect(() => {
    if (isFinishedRef.current) return
    const timer = setInterval(() => fetchDetalle(false), POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [fetchDetalle])

  async function handleVote(e) {
    e.preventDefault()
    setFormError('')

    if (!nombre.trim()) { setFormError('Escribe tu nombre'); return }
    if (golesLocal === '' || golesVisitante === '') { setFormError('Completa el marcador'); return }

    const local = Number(golesLocal)
    const visit = Number(golesVisitante)
    if (!Number.isInteger(local) || !Number.isInteger(visit) || local < 0 || visit < 0) {
      setFormError('El marcador debe ser un número entero positivo')
      return
    }

    // Validación optimista en cliente
    if (!polla.permite_repetir) {
      const taken = votos.some(v => v.goles_local === local && v.goles_visitante === visit)
      if (taken) { setFormError('Ese marcador ya fue tomado. Elige uno diferente.'); return }
    } else if (polla.max_repeticiones) {
      const count = votos.filter(v => v.goles_local === local && v.goles_visitante === visit).length
      if (count >= polla.max_repeticiones) {
        setFormError(`Ese marcador ya alcanzó el máximo de ${polla.max_repeticiones} repetición(es).`)
        return
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/polla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:              'votar',
          polla_id:            id,
          participante_nombre: nombre.trim(),
          goles_local:         local,
          goles_visitante:     visit,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || `Error ${res.status}`); return }

      // Guardar nombre en localStorage para futuros usos
      localStorage.setItem(LS_KEY, nombre.trim())
      setFormSuccess(true)
      setNombre('')
      setGolesLocal('')
      setGolesVisitante('')
      fetchDetalle(false)
    } catch (err) {
      setFormError(`Error de red: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (pageLoading) return (
    <div className="max-w-lg mx-auto animate-slide-up">
      <div className="card p-16 text-center text-slate-500">Cargando polla…</div>
    </div>
  )

  if (pageError) return (
    <div className="max-w-lg mx-auto animate-slide-up text-center py-20">
      <p className="text-4xl mb-4">🔍</p>
      <p className="text-slate-400 mb-4">{pageError}</p>
      <Link to="/mis-pollas" className="text-sky-400 hover:underline text-sm">← Mis pollas</Link>
    </div>
  )

  const match        = MATCHES.find(m => m.id === polla.partido_id)
  const result       = match ? getResult(match.id) : null
  const isFinished   = !!result
  const ko           = kickoffMs(match)
  const matchStarted = ko !== null && Date.now() >= ko
  const isCreador    = miNombre && miNombre.toLowerCase() === polla.creador_nombre?.toLowerCase()
  isFinishedRef.current = isFinished

  const rankedVotos = isFinished
    ? votos.map(v => rankVoto(v, result))
        .sort((a, b) => (b.exacto ? 2 : b.resultadoOk ? 1 : 0) - (a.exacto ? 2 : a.resultadoOk ? 1 : 0))
    : votos

  return (
    <div className="max-w-lg mx-auto animate-slide-up">
      <Link to="/mis-pollas" className="text-slate-400 hover:text-white text-sm mb-6 inline-block">
        ← Mis pollas
      </Link>

      {/* Creada con éxito */}
      {navState?.created && (
        <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
          <p className="text-green-400 font-bold text-sm">¡Polla creada!</p>
          <p className="text-slate-400 text-xs mt-0.5">Comparte el link con tus amigos para que participen.</p>
        </div>
      )}

      {/* Banner polla cerrada manualmente */}
      {!polla.activa && !matchStarted && (
        <div className="mb-4 flex items-center gap-3 p-4 rounded-xl border border-slate-600 bg-slate-800/50">
          <span className="text-slate-400 text-lg">🔒</span>
          <div>
            <p className="text-slate-300 font-bold text-sm">Polla cerrada</p>
            <p className="text-slate-500 text-xs mt-0.5">El creador ha cerrado esta polla. No se aceptan más predicciones.</p>
          </div>
        </div>
      )}

      {/* Banner cierre automático al kickoff */}
      {matchStarted && !isFinished && (
        <div className="mb-4 flex items-center gap-3 p-4 rounded-xl border border-orange-500/30 bg-orange-500/8">
          <span className="text-orange-400 text-lg">⏱️</span>
          <div>
            <p className="text-orange-300 font-bold text-sm">El partido ya comenzó</p>
            <p className="text-slate-500 text-xs mt-0.5">No se aceptan más predicciones.</p>
          </div>
        </div>
      )}

      {/* Header de la polla */}
      <div className="card p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Polla de marcador</div>
            <h1 className="text-lg font-black text-white leading-tight">
              {polla.equipo_local} vs {polla.equipo_visitante}
            </h1>
            {match && (
              <p className="text-xs text-slate-400 mt-1">
                {formatDate(match.date)} · {match.timeCol} COL
              </p>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
            style={{
              background:  copied ? 'rgba(34,197,94,0.1)' : '#1E293B',
              borderColor: copied ? 'rgba(34,197,94,0.4)' : '#334155',
              color:       copied ? '#4ade80' : '#94a3b8',
            }}
          >
            {copied ? '✓ Copiado' : '🔗 Compartir'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>Creada por <strong className="text-slate-300">{polla.creador_nombre}</strong></span>
          <span>·</span>
          <span>
            {polla.permite_repetir
              ? polla.max_repeticiones ? `Máx. ${polla.max_repeticiones} por marcador` : 'Marcadores repetibles'
              : 'Sin marcadores repetidos'}
          </span>
        </div>

        {navState?.created && (
          <div className="mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-700">
            <p className="text-xs text-slate-500 mb-1.5">Link para compartir:</p>
            <p className="text-xs text-sky-400 break-all font-mono">{window.location.href}</p>
          </div>
        )}
      </div>

      {/* Panel de administración */}
      {isCreador && (
        <AdminPanel
          polla={polla}
          votos={votos}
          onVotoEliminado={voto_id => setVotos(prev => prev.filter(v => v.id !== voto_id))}
          onEstadoCambiado={activa => setPolla(prev => ({ ...prev, activa }))}
        />
      )}

      {/* Resultado final */}
      {isFinished && result && (
        <div className="card p-5 mb-4 text-center" style={{ borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.05)' }}>
          <p className="text-xs text-sky-400 uppercase tracking-wider mb-2 font-bold">Resultado Final</p>
          <div className="text-4xl font-black text-white tabular-nums mb-1">
            {result.homeScore} – {result.awayScore}
          </div>
          <p className="text-xs text-slate-400">{polla.equipo_local} · {polla.equipo_visitante}</p>
        </div>
      )}

      {/* Formulario de voto — solo si activa, no iniciado y no finalizado */}
      {polla.activa && !matchStarted && !isFinished && (
        <div className="card p-5 mb-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Tu predicción</h2>

          {formSuccess ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-green-400 font-bold mb-1">¡Predicción enviada!</p>
              <p className="text-slate-500 text-sm mb-3">Tu voto fue registrado correctamente.</p>
              <button onClick={() => setFormSuccess(false)} className="text-sky-400 text-sm hover:underline">
                Enviar otra predicción
              </button>
            </div>
          ) : (
            <form onSubmit={handleVote} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Tu nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="¿Cómo te llamas?"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Marcador</label>
                <div className="flex items-center gap-3">
                  <ScoreInput label={polla.equipo_local} value={golesLocal} onChange={setGolesLocal} />
                  <span className="text-slate-500 font-black text-2xl mt-5">–</span>
                  <ScoreInput label={polla.equipo_visitante} value={golesVisitante} onChange={setGolesVisitante} />
                </div>
              </div>

              {formError && <p className="text-red-400 text-sm">{formError}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-opacity"
                style={{ background: '#F97316' }}
              >
                {submitting ? 'Enviando…' : 'Enviar mi predicción'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tabla de votos / ranking */}
      <div className="card overflow-hidden">
        <div
          className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between"
          style={{ backgroundColor: '#162032' }}
        >
          <span className="font-semibold text-white text-sm">
            Predicciones
            {votos.length > 0 && <span className="text-slate-500 font-normal ml-1.5">({votos.length})</span>}
          </span>
          {polla.activa && !matchStarted && !isFinished && (
            <span className="flex items-center gap-1.5 text-xs text-sky-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse inline-block" />
              En vivo
            </span>
          )}
          {matchStarted && !isFinished && (
            <span className="flex items-center gap-1.5 text-xs text-orange-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />
              En juego
            </span>
          )}
          {isFinished && <span className="text-xs text-slate-500">Partido finalizado</span>}
          {!polla.activa && !matchStarted && !isFinished && <span className="text-xs text-slate-500">🔒 Cerrada</span>}
        </div>

        {votos.length === 0 ? (
          <div className="py-14 text-center text-slate-500">
            <p className="text-3xl mb-3">🎯</p>
            <p className="text-sm">
              {polla.activa ? 'Sé el primero en enviar tu predicción' : 'Sin predicciones registradas'}
            </p>
          </div>
        ) : isFinished ? (
          <div className="divide-y divide-slate-700/30">
            {rankedVotos.map((v, i) => (
              <div
                key={v.id ?? i}
                className={`flex items-center gap-3 px-5 py-3.5 ${v.exacto ? 'bg-green-500/5' : v.resultadoOk ? 'bg-sky-500/5' : ''}`}
              >
                <span className="text-lg flex-shrink-0 w-7 text-center">
                  {v.exacto ? '🏆' : v.resultadoOk ? '✅' : '❌'}
                </span>
                <span className="flex-1 text-sm font-semibold text-white truncate">{v.participante_nombre}</span>
                <span className={`font-black tabular-nums text-sm ${v.exacto ? 'text-green-400' : v.resultadoOk ? 'text-sky-400' : 'text-slate-500'}`}>
                  {v.goles_local}–{v.goles_visitante}
                </span>
                {v.exacto && <span className="text-xs text-green-400 font-bold flex-shrink-0">¡Exacto!</span>}
                {v.resultadoOk && !v.exacto && <span className="text-xs text-sky-400 flex-shrink-0">Resultado</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {votos.map((v, i) => (
              <div key={v.id ?? i} className="flex items-center gap-3 px-5 py-3.5">
                <span className="w-5 text-xs text-slate-600 text-center flex-shrink-0">{i + 1}</span>
                <span className="flex-1 text-sm text-white truncate">{v.participante_nombre}</span>
                <span className="font-black tabular-nums text-orange-400 text-sm">
                  {v.goles_local}–{v.goles_visitante}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
