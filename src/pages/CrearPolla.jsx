import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { MATCHES } from '../data/matches'
import { GROUPS } from '../data/groups'
import { supabase, supabaseReady } from '../lib/supabase'

const ALL_TEAMS = Object.fromEntries(
  GROUPS.flatMap(g => g.teams.map(t => [t.code, t]))
)

function getAvailableMatches() {
  const todayCol = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return MATCHES
    .filter(m => m.date >= todayCol)
    .sort((a, b) => (a.date + a.timeCol) < (b.date + b.timeCol) ? -1 : 1)
}

function formatMatchOption(m) {
  const home = ALL_TEAMS[m.homeTeam]
  const away = ALL_TEAMS[m.awayTeam]
  const date = new Date(m.date + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
  return `${home?.name || m.homeTeam} vs ${away?.name || m.awayTeam} — ${date} ${m.timeCol}`
}

export default function CrearPolla() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialMatchId = searchParams.get('partido') || ''

  const availableMatches = getAvailableMatches()

  const [partidoId, setPartidoId] = useState(
    initialMatchId && availableMatches.some(m => String(m.id) === initialMatchId)
      ? initialMatchId
      : String(availableMatches[0]?.id ?? '')
  )
  const [creadorNombre, setCreadorNombre] = useState('')
  const [permiteRepetir, setPermiteRepetir] = useState(true)
  const [maxRepeticiones, setMaxRepeticiones] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedMatch = MATCHES.find(m => m.id === Number(partidoId))
  const homeTeam = selectedMatch ? ALL_TEAMS[selectedMatch.homeTeam] : null
  const awayTeam = selectedMatch ? ALL_TEAMS[selectedMatch.awayTeam] : null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!partidoId || !creadorNombre.trim()) {
      setError('Selecciona un partido y escribe tu nombre')
      return
    }
    setLoading(true)
    setError('')

    if (!supabaseReady) {
      setLoading(false)
      setError('Error de configuración: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están definidas en producción. Agrega estas variables en Vercel → Settings → Environment Variables.')
      return
    }

    const payload = {
      partido_id:       Number(partidoId),
      equipo_local:     homeTeam?.name || selectedMatch?.homeTeam,
      equipo_visitante: awayTeam?.name || selectedMatch?.awayTeam,
      fecha_partido:    selectedMatch?.date,
      creador_nombre:   creadorNombre.trim(),
      permite_repetir:  permiteRepetir,
      max_repeticiones: maxRepeticiones ? Number(maxRepeticiones) : null,
      activa:           true,
    }
    console.log('[CrearPolla] payload:', payload)
    console.log('[CrearPolla] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
    console.log('[CrearPolla] VITE_SUPABASE_ANON_KEY set:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)

    const { data, error: dbError } = await supabase
      .from('pollas')
      .insert(payload)
      .select()
      .single()

    setLoading(false)
    if (dbError) {
      console.error('[CrearPolla] Supabase error:', dbError)
      setError(`Error Supabase: ${dbError.message} (código: ${dbError.code})`)
      return
    }
    navigate(`/polla/${data.id}`, { state: { created: true } })
  }

  if (availableMatches.length === 0) {
    return (
      <div className="max-w-lg mx-auto animate-slide-up text-center py-20">
        <p className="text-4xl mb-4">⏰</p>
        <p className="text-slate-400 mb-2">No hay partidos próximos disponibles</p>
        <Link to="/" className="text-sky-400 hover:underline text-sm">← Volver al inicio</Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto animate-slide-up">
      <Link to="/" className="text-slate-400 hover:text-white text-sm mb-6 inline-block">← Volver</Link>

      <h1 className="text-2xl font-black text-white mb-1">Arma tu Polla</h1>
      <p className="text-slate-400 text-sm mb-6">Crea una polla de marcador y compártela con tus amigos</p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Match selector */}
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Partido</label>
          <select
            value={partidoId}
            onChange={e => setPartidoId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
            required
          >
            {availableMatches.map(m => (
              <option key={m.id} value={m.id}>{formatMatchOption(m)}</option>
            ))}
          </select>
        </div>

        {/* Match preview */}
        {selectedMatch && (
          <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
            <div className="text-center">
              {homeTeam && (
                <img
                  src={`https://flagcdn.com/w40/${homeTeam.iso2?.toLowerCase()}.png`}
                  alt={homeTeam.name}
                  className="w-8 h-6 object-cover rounded mx-auto mb-1"
                  onError={e => e.target.style.display = 'none'}
                />
              )}
              <p className="text-xs text-white font-bold">{homeTeam?.name || selectedMatch.homeTeam}</p>
            </div>
            <div className="text-slate-500 font-black text-lg">vs</div>
            <div className="text-center">
              {awayTeam && (
                <img
                  src={`https://flagcdn.com/w40/${awayTeam.iso2?.toLowerCase()}.png`}
                  alt={awayTeam.name}
                  className="w-8 h-6 object-cover rounded mx-auto mb-1"
                  onError={e => e.target.style.display = 'none'}
                />
              )}
              <p className="text-xs text-white font-bold">{awayTeam?.name || selectedMatch.awayTeam}</p>
            </div>
          </div>
        )}

        {/* Creator name */}
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Tu nombre</label>
          <input
            type="text"
            value={creadorNombre}
            onChange={e => setCreadorNombre(e.target.value)}
            placeholder="¿Cómo te llamas?"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500"
            maxLength={50}
            required
          />
        </div>

        {/* Permite repetir toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700">
          <div>
            <p className="text-sm text-white font-medium">¿Se pueden repetir marcadores?</p>
            <p className="text-xs text-slate-500 mt-0.5">Varios participantes predicen el mismo resultado</p>
          </div>
          <button
            type="button"
            onClick={() => setPermiteRepetir(v => !v)}
            className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${permiteRepetir ? 'bg-sky-500' : 'bg-slate-700'}`}
            aria-label="Toggle permite repetir"
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${permiteRepetir ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Max repeticiones */}
        {permiteRepetir && (
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
              Máximo de repeticiones por marcador
              <span className="text-slate-600 normal-case ml-1">(opcional)</span>
            </label>
            <input
              type="number"
              value={maxRepeticiones}
              onChange={e => setMaxRepeticiones(e.target.value)}
              placeholder="Sin límite"
              min="1"
              max="100"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity disabled:opacity-50 cursor-pointer"
          style={{ background: '#F97316' }}
        >
          {loading ? 'Creando…' : 'Crear Polla'}
        </button>
      </form>
    </div>
  )
}
