import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { MATCHES } from '../data/matches'
import { GROUPS } from '../data/groups'
import { getResult, saveResult } from '../data/matchResults'
import { getFixtureMap } from '../data/fixtureMap'

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
function AdminPanel({ polla, votos, adminToken, onVotoEliminado, onEstadoCambiado }) {
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
        body: JSON.stringify({ action, polla_id: polla.id, token: adminToken }),
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
        body: JSON.stringify({ action: 'eliminar-voto', voto_id, polla_id: polla.id, token: adminToken }),
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

  const [nombre, setNombre]               = useState(() => localStorage.getItem(LS_KEY) || '')
  const [golesLocal, setGolesLocal]       = useState('')
  const [golesVisitante, setGolesVisitante] = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [formError, setFormError]         = useState('')
  const [nombreAviso, setNombreAviso]     = useState('')
  const [formSuccess, setFormSuccess]     = useState(false)

  const isFinishedRef = useRef(false)
  const [apiResult, setApiResult] = useState(null)

  // Token admin: solo quien creó la polla desde este dispositivo lo tiene
  const adminToken = localStorage.getItem(`polla_token_${id}`) || null

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

  // Cuando el partido ya comenzó y no hay resultado en caché local,
  // consultar API-Football directamente para obtener el marcador final.
  useEffect(() => {
    if (!polla) return
    const m = MATCHES.find(mn => mn.id === Number(polla.partido_id))
    if (!m) return
    const ko = kickoffMs(m)
    if (ko === null || Date.now() < ko) return  // partido no comenzado
    if (getResult(m.id)) return                 // ya hay resultado en localStorage

    let alive = true
    let timer = null

    async function checkResult() {
      if (!alive) return
      try {
        const fmap = await getFixtureMap()
        const fixtureId = fmap[m.id]
        if (!fixtureId || !alive) return
        const r = await fetch(`/api/football?endpoint=/fixtures&id=${fixtureId}`, {
          signal: AbortSignal.timeout(8000),
        })
        const data = await r.json()
        if (!alive) return
        const f = data.response?.[0]
        const status = f?.fixture?.status?.short
        if (['FT', 'AET', 'PEN'].includes(status)) {
          const homeScore = f.goals?.home ?? null
          const awayScore = f.goals?.away ?? null
          if (homeScore != null && awayScore != null) {
            setApiResult({ homeScore, awayScore })
            saveResult(m.id, homeScore, awayScore)
            return  // dejar de polling
          }
        }
      } catch {}
      if (alive) timer = setTimeout(checkResult, 60_000)
    }

    checkResult()
    return () => { alive = false; clearTimeout(timer) }
  }, [polla])

  async function handleVote(e) {
    e.preventDefault()
    setFormError('')
    setNombreAviso('')

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
      if (res.status === 409) { setNombreAviso(data.mensaje || data.error); return }
      if (!res.ok) { setFormError(data.error || `Error ${res.status}`); return }

      // Guardar nombre en localStorage para futuros usos
      localStorage.setItem(LS_KEY, nombre.trim())

      // Registrar participación
      const participaciones = JSON.parse(localStorage.getItem('wc2026_mis_participaciones') || '[]')
      if (!participaciones.includes(id)) {
        participaciones.push(id)
        localStorage.setItem('wc2026_mis_participaciones', JSON.stringify(participaciones))
      }

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

  // Meta tags dinámicos para compartir la polla
  useEffect(() => {
    if (!polla) return
    const title = `Polla: ${polla.equipo_local} vs ${polla.equipo_visitante} · Marcagol.live`
    document.title = title
    const setMeta = (prop, content) => {
      let el = document.querySelector(`meta[property="${prop}"]`)
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el) }
      el.setAttribute('content', content)
    }
    const desc = `¡${polla.creador_nombre} te invita a su polla! Predice el marcador de ${polla.equipo_local} vs ${polla.equipo_visitante} y gana`
    setMeta('og:title', title)
    setMeta('og:description', desc)
    setMeta('og:url', window.location.href)
    return () => {
      document.title = '● marcagol.live — Mundial 2026'
      setMeta('og:title', 'Marcagol.live · Copa Mundial FIFA 2026')
      setMeta('og:description', 'Sigue el Mundial en vivo: marcadores, alineaciones, estadísticas y arma tu polla con amigos')
      setMeta('og:url', 'https://www.marcagol.live')
    }
  }, [polla])

  function handleShareWhatsApp() {
    const url = window.location.href
    const text = `🎯 ¡Arma tu predicción! ${polla.creador_nombre} te invita a la polla de ${polla.equipo_local} vs ${polla.equipo_visitante} 🏆\n\nPredice el marcador y compite con tus amigos en:\n${url}\n\n¡Entra antes del kickoff! ⚽`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
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

  const match           = MATCHES.find(m => m.id === Number(polla.partido_id))
  const result          = match ? getResult(match.id) : null
  const effectiveResult = result || apiResult
  const isFinished      = !!effectiveResult
  const ko              = kickoffMs(match)
  const matchStarted    = ko !== null && Date.now() >= ko
  const isCreador       = !!adminToken
  isFinishedRef.current = isFinished

  const rankedVotos = isFinished
    ? votos.map(v => rankVoto(v, effectiveResult))
        .sort((a, b) => (b.exacto ? 2 : b.resultadoOk ? 1 : 0) - (a.exacto ? 2 : a.resultadoOk ? 1 : 0))
    : votos

  const ganadores = isFinished ? rankedVotos.filter(v => v.exacto) : []

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
            onClick={handleShareWhatsApp}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 active:opacity-75"
            style={{ background: '#25D366', color: '#fff' }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Compartir en WhatsApp
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
          adminToken={adminToken}
          onVotoEliminado={voto_id => setVotos(prev => prev.filter(v => v.id !== voto_id))}
          onEstadoCambiado={activa => setPolla(prev => ({ ...prev, activa }))}
        />
      )}

      {/* Resultado final — banner dorado + ganadores */}
      {isFinished && effectiveResult && (
        <div className="mb-4 space-y-3">
          {/* Banner dorado */}
          <div className="card p-5 text-center" style={{ borderColor: 'rgba(251,191,36,0.45)', background: 'rgba(251,191,36,0.07)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(251,191,36,0.85)' }}>
              ⚽ Resultado Final
            </p>
            <div className="text-3xl font-black text-white tabular-nums mb-1">
              {effectiveResult.homeScore} – {effectiveResult.awayScore}
            </div>
            <p className="text-xs text-slate-400">{polla.equipo_local} vs {polla.equipo_visitante}</p>
          </div>

          {/* Ganadores o nadie acertó */}
          {ganadores.length > 0 ? (
            <div className="card p-5" style={{ borderColor: 'rgba(251,191,36,0.45)', background: 'rgba(251,191,36,0.07)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(251,191,36,0.9)' }}>
                🏆 ¡Ganador{ganadores.length !== 1 ? 'es' : ''} de la polla!
              </p>
              <div className="flex flex-wrap gap-2">
                {ganadores.map((v, i) => (
                  <span
                    key={v.id ?? i}
                    className="px-3 py-1.5 rounded-lg text-sm font-bold"
                    style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24' }}
                  >
                    {v.participante_nombre} · {v.goles_local}–{v.goles_visitante}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-4 text-center" style={{ borderColor: 'rgba(148,163,184,0.2)' }}>
              <p className="text-slate-400 text-sm">😅 ¡Nadie acertó el marcador exacto esta vez!</p>
            </div>
          )}
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
                  onChange={e => { setNombre(e.target.value); setNombreAviso('') }}
                  placeholder="¿Cómo te llamas?"
                  className={`w-full bg-slate-900 border rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none ${nombreAviso ? 'border-amber-500 focus:border-amber-400' : 'border-slate-700 focus:border-sky-500'}`}
                  maxLength={50}
                />
                {nombreAviso && (
                  <p className="mt-2 text-xs text-amber-400 leading-relaxed">⚠️ {nombreAviso}</p>
                )}
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
                {v.exacto && <span className="text-xs text-green-400 font-bold flex-shrink-0">¡Marcador exacto!</span>}
                {v.resultadoOk && !v.exacto && <span className="text-xs text-sky-400 flex-shrink-0">Acertó el resultado</span>}
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
