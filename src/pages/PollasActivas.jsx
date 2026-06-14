import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { MATCHES } from '../data/matches'

function getColDateStr() {
  return new Date().toLocaleString('en-CA', { timeZone: 'America/Bogota' }).split(',')[0]
}

function getKickoffMs(polla) {
  const match = MATCHES.find(m => m.id === Number(polla.partido_id))
  if (!match || !match.timeCol) return null
  // timeCol = 'HH:MM' en hora Colombia (GMT-5 fijo)
  return new Date(`${match.date}T${match.timeCol}:00-05:00`).getTime()
}

function isMatchOver(polla) {
  const ko = getKickoffMs(polla)
  if (ko === null) {
    // Sin hora exacta: comparar solo por fecha
    return String(polla.fecha_partido).slice(0, 10) < getColDateStr()
  }
  return Date.now() > ko + 3 * 3600 * 1000
}

function formatFecha(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      weekday: 'short', day: 'numeric', month: 'short',
    })
  } catch { return dateStr }
}

function PollaCard({ polla }) {
  const ko = getKickoffMs(polla)
  const enJuego = ko !== null ? Date.now() >= ko : false
  const esPublica = !!polla.publica

  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3"
      style={{ backgroundColor: '#1E293B', borderColor: 'rgba(51,65,85,0.8)' }}
    >
      {/* Header: partido + estado */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-white text-sm leading-tight truncate">
            {polla.equipo_local} vs {polla.equipo_visitante}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            por <span className="text-slate-400">{polla.creador_nombre}</span>
            {' · '}{formatFecha(polla.fecha_partido)}
          </p>
        </div>
        <span
          className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
          style={enJuego
            ? { background: 'rgba(249,115,22,0.15)', color: '#FB923C' }
            : { background: 'rgba(34,197,94,0.12)',  color: '#4ADE80' }}
        >
          {enJuego && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />}
          {enJuego ? 'En juego' : 'Abierta'}
        </span>
      </div>

      {/* Participantes */}
      <p className="text-xs text-slate-500">
        👥 {polla.participantes ?? 0} participante{polla.participantes !== 1 ? 's' : ''}
      </p>

      {/* CTA o badge privada */}
      {esPublica ? (
        <Link
          to={`/polla/${polla.id}`}
          className="w-full py-2 rounded-lg font-bold text-white text-sm text-center transition-opacity hover:opacity-90"
          style={{ background: '#F97316' }}
        >
          ¡Participa!
        </Link>
      ) : (
        <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <span className="text-slate-500 text-xs">🔒 Privada · Solo por invitación</span>
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-700/40 p-4 animate-pulse space-y-3"
         style={{ backgroundColor: '#1E293B' }}>
      <div className="h-4 bg-slate-700 rounded w-3/4" />
      <div className="h-3 bg-slate-700/60 rounded w-1/2" />
      <div className="h-8 bg-slate-700/40 rounded" />
    </div>
  )
}

export default function PollasActivas() {
  const [pollas, setPollas]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    fetch('/api/polla?action=activas')
      .then(r => r.json())
      .then(d => { setPollas(d.pollas || []); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  // Filtrar en cliente: excluir partidos terminados (kickoff + 3h de gracia)
  const now = Date.now()
  const activePollas = (pollas || []).filter(p => !isMatchOver(p))
  const enJuego  = activePollas.filter(p => { const ko = getKickoffMs(p); return ko !== null && now >= ko })
  const proximas = activePollas.filter(p => { const ko = getKickoffMs(p); return ko === null || now < ko })
  const totalActivas = activePollas.length

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">
          🎯 Pollas activas
          {!loading && pollas && (
            <span className="text-slate-500 font-normal text-base ml-2">
              · {totalActivas} {totalActivas === 1 ? 'polla' : 'pollas'}
            </span>
          )}
        </h1>
        <p className="text-slate-400 text-sm">Únete a una polla o crea la tuya</p>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-4 text-red-400 text-sm mb-4">Error al cargar pollas: {error}</div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid sm:grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && totalActivas === 0 && (
        <div className="card p-14 text-center">
          <p className="text-4xl mb-3">🎰</p>
          <p className="text-slate-300 font-semibold mb-1">No hay pollas activas en este momento</p>
          <p className="text-slate-500 text-sm mb-5">¡Crea la primera y desafía a tus amigos!</p>
          <Link
            to="/crear-polla"
            className="inline-block px-6 py-2.5 rounded-xl font-bold text-white text-sm"
            style={{ background: '#F97316' }}
          >
            + Crear mi polla
          </Link>
        </div>
      )}

      {/* En juego */}
      {!loading && enJuego.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse inline-block" />
            En juego
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {enJuego.map(p => <PollaCard key={p.id} polla={p} />)}
          </div>
        </section>
      )}

      {/* Recibiendo predicciones */}
      {!loading && proximas.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            📝 Recibiendo predicciones
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {proximas.map(p => <PollaCard key={p.id} polla={p} />)}
          </div>
        </section>
      )}

      {createPortal(
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pt-8 bg-gradient-to-t from-[#0F172A] to-transparent">
          <Link
            to="/crear-polla"
            className="block w-full max-w-2xl mx-auto bg-[#F97316] hover:bg-orange-500 text-white font-bold py-4 rounded-xl text-center"
          >
            + Crear tu polla
          </Link>
        </div>,
        document.body
      )}
    </div>
  )
}
