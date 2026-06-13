import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { MATCHES } from '../data/matches'
import { GROUPS } from '../data/groups'
import { getResult } from '../data/matchResults'
import { supabase } from '../lib/supabase'

const ALL_TEAMS = Object.fromEntries(
  GROUPS.flatMap(g => g.teams.map(t => [t.code, t]))
)

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

export default function PollaDetalle() {
  const { id } = useParams()
  const { state: navState } = useLocation()

  const [polla, setPolla] = useState(null)
  const [votos, setVotos] = useState([])
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const [nombre, setNombre] = useState('')
  const [golesLocal, setGolesLocal] = useState('')
  const [golesVisitante, setGolesVisitante] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  // Load polla + initial votes
  useEffect(() => {
    async function load() {
      const { data: pollaData, error: pollaErr } = await supabase
        .from('pollas')
        .select('*')
        .eq('id', id)
        .single()

      if (pollaErr || !pollaData) {
        setPageError('Polla no encontrada')
        setPageLoading(false)
        return
      }
      setPolla(pollaData)

      const { data: votosData } = await supabase
        .from('votos')
        .select('*')
        .eq('polla_id', id)
        .order('created_at', { ascending: true })
      setVotos(votosData || [])
      setPageLoading(false)
    }
    load()
  }, [id])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`polla-votos-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'votos',
        filter: `polla_id=eq.${id}`,
      }, payload => {
        setVotos(prev => [...prev, payload.new])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  async function handleVote(e) {
    e.preventDefault()
    setFormError('')

    if (!nombre.trim()) { setFormError('Escribe tu nombre'); return }
    if (golesLocal === '' || golesVisitante === '') { setFormError('Completa el marcador'); return }

    const local = Number(golesLocal)
    const visit = Number(golesVisitante)

    if (local < 0 || visit < 0 || !Number.isInteger(local) || !Number.isInteger(visit)) {
      setFormError('El marcador debe ser un número entero positivo')
      return
    }

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
    const { error: dbError } = await supabase.from('votos').insert({
      polla_id: id,
      participante_nombre: nombre.trim(),
      goles_local: local,
      goles_visitante: visit,
    })
    setSubmitting(false)

    if (dbError) { setFormError('Error al enviar. Intenta de nuevo.'); return }
    setFormSuccess(true)
    setNombre('')
    setGolesLocal('')
    setGolesVisitante('')
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
      <Link to="/" className="text-sky-400 hover:underline text-sm">← Volver al inicio</Link>
    </div>
  )

  const match = MATCHES.find(m => m.id === polla.partido_id)
  const result = match ? getResult(match.id) : null
  const isFinished = !!result

  const rankedVotos = isFinished
    ? votos.map(v => rankVoto(v, result))
        .sort((a, b) => (b.exacto ? 2 : b.resultadoOk ? 1 : 0) - (a.exacto ? 2 : a.resultadoOk ? 1 : 0))
    : votos

  const pollaUrl = window.location.href

  return (
    <div className="max-w-lg mx-auto animate-slide-up">
      <Link to="/" className="text-slate-400 hover:text-white text-sm mb-6 inline-block">← Volver</Link>

      {/* Creada con éxito */}
      {navState?.created && (
        <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
          <p className="text-green-400 font-bold text-sm">¡Polla creada!</p>
          <p className="text-slate-400 text-xs mt-0.5">Comparte el link con tus amigos para que participen.</p>
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
              background: copied ? 'rgba(34,197,94,0.1)' : '#1E293B',
              borderColor: copied ? 'rgba(34,197,94,0.4)' : '#334155',
              color: copied ? '#4ade80' : '#94a3b8',
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
              ? polla.max_repeticiones
                ? `Máx. ${polla.max_repeticiones} por marcador`
                : 'Marcadores repetibles'
              : 'Sin marcadores repetidos'}
          </span>
        </div>

        {/* Share box on creation */}
        {navState?.created && (
          <div className="mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-700">
            <p className="text-xs text-slate-500 mb-1.5">Link para compartir:</p>
            <p className="text-xs text-sky-400 break-all font-mono">{pollaUrl}</p>
          </div>
        )}
      </div>

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

      {/* Formulario de voto */}
      {!isFinished && (
        <div className="card p-5 mb-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Tu predicción</h2>

          {formSuccess ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-green-400 font-bold mb-1">¡Predicción enviada!</p>
              <p className="text-slate-500 text-sm mb-3">Tu voto fue registrado correctamente.</p>
              <button
                onClick={() => setFormSuccess(false)}
                className="text-sky-400 text-sm hover:underline"
              >
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
            {votos.length > 0 && (
              <span className="text-slate-500 font-normal ml-1.5">({votos.length})</span>
            )}
          </span>
          {!isFinished && (
            <span className="flex items-center gap-1.5 text-xs text-sky-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse inline-block" />
              En vivo
            </span>
          )}
          {isFinished && <span className="text-xs text-slate-500">Partido finalizado</span>}
        </div>

        {votos.length === 0 ? (
          <div className="py-14 text-center text-slate-500">
            <p className="text-3xl mb-3">🎯</p>
            <p className="text-sm">Sé el primero en enviar tu predicción</p>
          </div>
        ) : isFinished ? (
          <div className="divide-y divide-slate-700/30">
            {rankedVotos.map((v, i) => (
              <div
                key={v.id ?? i}
                className={`flex items-center gap-3 px-5 py-3.5 ${
                  v.exacto ? 'bg-green-500/5' : v.resultadoOk ? 'bg-sky-500/5' : ''
                }`}
              >
                <span className="text-lg flex-shrink-0 w-7 text-center">
                  {v.exacto ? '🏆' : v.resultadoOk ? '✅' : '❌'}
                </span>
                <span className="flex-1 text-sm font-semibold text-white truncate">
                  {v.participante_nombre}
                </span>
                <span
                  className={`font-black tabular-nums text-sm ${
                    v.exacto ? 'text-green-400' : v.resultadoOk ? 'text-sky-400' : 'text-slate-500'
                  }`}
                >
                  {v.goles_local}–{v.goles_visitante}
                </span>
                {v.exacto && (
                  <span className="text-xs text-green-400 font-bold flex-shrink-0">¡Exacto!</span>
                )}
                {v.resultadoOk && !v.exacto && (
                  <span className="text-xs text-sky-400 flex-shrink-0">Resultado</span>
                )}
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
