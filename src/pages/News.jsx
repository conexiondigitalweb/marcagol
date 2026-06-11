import { useState, useEffect, useCallback } from 'react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const NEWS_URL = '/api/news?endpoint=/search&q=Mundial+2026+FIFA&lang=es&max=20'

const STATIC_ARTICLES = [
  {
    id: 'static-0',
    source: 'FIFA',
    title: 'Colombia en el Mundial 2026: convocatoria y grupos',
    link: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026',
    pubDate: '2026-03-31',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80',
    description: 'La Tricolor enfrentará a Portugal, Uzbekistán y RD Congo en el Grupo K.',
  },
  {
    id: 'static-1',
    source: 'FIFA',
    title: 'El sorteo del Mundial 2026: así quedaron los 12 grupos',
    link: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026',
    pubDate: '2026-04-27',
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&q=80',
    description: 'El sorteo realizado en Miami definió los 12 grupos de 4 equipos para la fase inicial del torneo.',
  },
  {
    id: 'static-2',
    source: 'FIFA',
    title: 'Los 16 estadios del Mundial 2026',
    link: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026',
    pubDate: '2026-01-31',
    image: 'https://images.unsplash.com/photo-1540747913346-19378e0ea56c?w=400&q=80',
    description: '16 estadios en tres países albergarán los 104 partidos del torneo más grande de la historia.',
  },
  {
    id: 'static-3',
    source: 'FIFA',
    title: 'Equipos favoritos para ganar el Mundial 2026',
    link: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026',
    pubDate: '2026-04-30',
    image: 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=400&q=80',
    description: 'Francia, Brasil y Argentina encabezan las apuestas para llevarse el trofeo en julio de 2026.',
  },
  {
    id: 'static-4',
    source: 'FIFA',
    title: 'FIFA anuncia el calendario completo del Mundial 2026',
    link: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026',
    pubDate: '2026-01-14',
    image: 'https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=400&q=80',
    description: 'La FIFA confirmó los 104 partidos del torneo en 16 estadios de Estados Unidos, México y Canadá.',
  },
  {
    id: 'static-5',
    source: 'FIFA',
    title: 'Todo sobre el Mundial 2026: grupos, fechas y sedes',
    link: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026',
    pubDate: '2026-02-28',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&q=80',
    description: 'Guía completa del Mundial 2026 con los 48 equipos clasificados y el formato del torneo.',
  },
]

function formatNewsDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('es', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateStr))
  } catch { return dateStr }
}

function NewsCard({ item }) {
  const [imgErr, setImgErr] = useState(false)

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="card group flex flex-col hover:border-sky-500/40 transition-all"
    >
      {/* Image */}
      {item.image && !imgErr ? (
        <div
          className="overflow-hidden bg-slate-800 flex-shrink-0"
          style={{ height: '180px', borderRadius: '10px 10px 0 0' }}
        >
          <img
            src={item.image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        </div>
      ) : (
        <div
          className="bg-slate-800 flex items-center justify-center text-3xl text-slate-600 flex-shrink-0"
          style={{ height: '120px', borderRadius: '10px 10px 0 0' }}
        >
          ⚽
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
            {item.source}
          </span>
          {item.pubDate && (
            <span className="text-xs text-slate-600">{formatNewsDate(item.pubDate)}</span>
          )}
        </div>
        <p className="text-sm font-semibold text-white leading-snug group-hover:text-sky-300 transition-colors line-clamp-3">
          {item.title}
        </p>
        {item.description && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}
        <p className="text-xs text-slate-500 mt-auto pt-1">Leer nota →</p>
      </div>
    </a>
  )
}

export default function News() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [usingLive, setUsingLive] = useState(false)
  const [filter, setFilter]     = useState('Todos')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(NEWS_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      if (data.articles && data.articles.length > 0) {
        const mapped = data.articles.map((a, i) => ({
          id:          `gnews-${i}`,
          source:      a.source?.name || 'Noticias',
          title:       a.title,
          link:        a.url,
          pubDate:     a.publishedAt,
          image:       a.image,
          description: a.description,
        }))
        setArticles(mapped)
        setUsingLive(true)
      } else {
        setArticles(STATIC_ARTICLES)
        setUsingLive(false)
      }
    } catch {
      setArticles(STATIC_ARTICLES)
      setUsingLive(false)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const sources = [...new Set(articles.map(a => a.source))]
  const filtered = filter === 'Todos' ? articles : articles.filter(a => a.source === filter)

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Noticias · Mundial 2026</h1>
        <p className="text-slate-400 mt-1">
          {usingLive ? 'Últimas noticias en tiempo real' : 'Artículos destacados del Mundial 2026'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {['Todos', ...sources.slice(0, 5)].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filter === f
                ? 'bg-sky-500 text-white border-sky-500'
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {f}
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto btn-secondary text-xs"
          disabled={loading}
        >
          {loading ? '⟳ Cargando…' : '↺ Actualizar'}
        </button>
      </div>

      {/* Status */}
      {!usingLive && !loading && (
        <div className="card p-3 mb-4 border-sky-500/30 bg-sky-500/5 text-xs text-sky-400">
          📰 Mostrando artículos curados. Actualizando con las últimas noticias del Mundial.
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Cargando noticias…" />
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">📰</p>
          <p className="text-slate-400">No hay noticias disponibles</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">
            <span className="text-white font-semibold">{filtered.length}</span> artículos
            {usingLive && <span className="ml-2 text-green-400">● En vivo</span>}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(item => <NewsCard key={item.id} item={item} />)}
          </div>
        </>
      )}
    </div>
  )
}
