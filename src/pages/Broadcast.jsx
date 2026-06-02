import { useState } from 'react'
import { BROADCAST_BY_COUNTRY, CHANNEL_TYPE_COLOR } from '../data/broadcast'
import Flag from '../components/ui/Flag'

function CountryCard({ item }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <Flag iso2={item.iso2} size="sm" />
        <h3 className="font-bold text-white">{item.country}</h3>
      </div>
      <div className="space-y-2">
        {item.channels.map((ch, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-200 font-medium">{ch.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${CHANNEL_TYPE_COLOR[ch.type] || 'bg-slate-600 text-slate-300'}`}>
              {ch.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Broadcast() {
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('Todos')

  const regions = ['Todos', ...BROADCAST_BY_COUNTRY.map(r => r.region)]

  const filtered = BROADCAST_BY_COUNTRY
    .filter(r => region === 'Todos' || r.region === region)
    .map(r => ({
      ...r,
      countries: r.countries.filter(c =>
        c.country.toLowerCase().includes(search.toLowerCase()) ||
        c.channels.some(ch => ch.name.toLowerCase().includes(search.toLowerCase()))
      ),
    }))
    .filter(r => r.countries.length > 0)

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">¿Dónde Ver el Mundial?</h1>
        <p className="text-slate-400 mt-1">Canales de TV y plataformas de streaming por país</p>
      </div>

      {/* Quick guide */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-white mb-3">Guía rápida de tipos de señal</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(CHANNEL_TYPE_COLOR).slice(0, 4).map(([type, color]) => (
            <div key={type} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${color}`}>
              <span className="w-2 h-2 rounded-full bg-current"></span>
              {type}
            </div>
          ))}
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            type="text"
            placeholder="Buscar país o canal..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {regions.map(r => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                region === r
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">📺</p>
          <p className="text-slate-400">No se encontraron resultados para "{search}"</p>
          <button onClick={() => setSearch('')} className="btn-secondary mt-4">Limpiar búsqueda</button>
        </div>
      ) : (
        <div className="space-y-8">
          {filtered.map(regionData => (
            <section key={regionData.region}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-white">{regionData.region}</h2>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                  {regionData.countries.length} países
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {regionData.countries.map(item => (
                  <CountryCard key={item.country} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Note */}
      <div className="mt-10 card p-5 border-amber-500/20 bg-amber-500/5">
        <p className="text-amber-400 text-sm">
          <strong>⚠️ Nota:</strong> Los derechos de transmisión pueden variar por partido o ronda.
          Consulta los sitios oficiales de cada canal para confirmar horarios y disponibilidad.
          La información puede cambiar acercándose al Mundial.
        </p>
      </div>
    </div>
  )
}
