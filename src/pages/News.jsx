import { useState, useEffect, useCallback } from 'react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const PROXY = 'https://corsproxy.io/?'

const FEEDS = [
  { id: 'fifa', label: 'FIFA', url: 'https://www.fifa.com/rss/news/all.xml' },
  { id: 'goal', label: 'Goal', url: 'https://www.goal.com/feeds/es/news' },
]

const STATIC_ARTICLES = [
  {
    id: 'st-1',
    source: 'FIFA',
    title: 'FIFA anuncia el calendario completo del Mundial 2026',
    link: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026',
    pubDate: '2026-01-15T00:00:00Z',
    image: null,
    description: 'La FIFA confirmó los 104 partidos del torneo en 16 estadios de Estados Unidos, México y Canadá.',
  },
  {
    id: 'st-2',
    source: 'Goal',
    title: 'Todo sobre el Mundial 2026: grupos, fechas y sedes',
    link: 'https://www.goal.com/es',
    pubDate: '2026-03-01T00:00:00Z',
    image: null,
    description: 'Guía completa del Mundial 2026 con los 48 equipos clasificados y el formato del torneo.',
  },
  {
    id: 'st-3',
    source: 'FIFA',
    title: 'Colombia en el Mundial 2026: convocatoria y grupos',
    link: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles',
    pubDate: '2026-04-01T00:00:00Z',
    image: null,
    description: 'La Tricolor enfrentará a Portugal, Uzbekistán y RD Congo en el Grupo K.',
  },
  {
    id: 'st-4',
    source: 'FIFA',
    title: 'Los estadios del Mundial 2026',
    link: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/destination',
    pubDate: '2026-02-01T00:00:00Z',
    image: null,
    description: '16 estadios en tres países albergarán los 104 partidos del torneo más grande de la historia.',
  },
  {
    id: 'st-5',
    source: 'Goal',
    title: 'Equipos favoritos para ganar el Mundial 2026',
    link: 'https://www.goal.com/es/mundial-2026',
    pubDate: '2026-05-01T00:00:00Z',
    image: null,
    description: 'Francia, Brasil y Argentina encabezan las apuestas para llevarse el trofeo en julio de 2026.',
  },
]

function extractImage(item) {
  const enclosure = item.querySelector('enclosure[type^="image"]')
  if (enclosure) return enclosure.getAttribute('url')

  const mediaNS = ['media\\:thumbnail', 'media\\:content', 'thumbnail', 'content']
  for (const sel of mediaNS) {
    try {
      const el = item.querySelector(sel)
      if (el) return el.getAttribute('url') || el.getAttribute('src') || null
    } catch {}
  }

  const desc = item.querySelector('description')?.textContent || ''
  const match = desc.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match?.[1] || null
}

async function fetchFeed({ id, label, url }) {
  const proxied = `${PROXY}${encodeURIComponent(url)}`
  const res = await fetch(proxied, { signal: AbortSignal.timeout(12000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  const doc = new DOMParser().parseFromString(text, 'text/xml')
  if (doc.querySelector('parsererror')) throw new Error('XML parse error')

  return Array.from(doc.querySelectorAll('item')).map((item, i) => ({
    id:      `${id}-${i}`,
    source:  label,
    title:   item.querySelector('title')?.textContent?.trim() || '(sin título)',
    link:    item.querySelector('link')?.textContent?.trim() ||
             item.querySelector('link')?.getAttribute('href') || '#',
    pubDate: item.querySelector('pubDate')?.textContent?.trim() || '',
    image:   extractImage(item),
  }))
}

function formatNewsDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      .format(new Date(dateStr))
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
        <div className="h-44 overflow-hidden rounded-t-xl bg-slate-800 flex-shrink-0">
          <img
            src={item.image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={() => setImgErr(true)}
          />
        </div>
      ) : (
        <div className="h-20 rounded-t-xl bg-slate-800 flex items-center justify-center text-3xl text-slate-700 flex-shrink-0">
          📰
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
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{item.description}</p>
        )}
        <p className="text-xs text-slate-500 mt-auto pt-1">Leer nota →</p>
      </div>
    </a>
  )
}

export default function News() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [errors, setErrors]     = useState([])
  const [filter, setFilter]     = useState('Todos')

  const load = useCallback(async () => {
    setLoading(true)
    setErrors([])
    const results = await Promise.allSettled(FEEDS.map(fetchFeed))

    const all = []
    const errs = []
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') all.push(...r.value)
      else errs.push(FEEDS[i].label)
    })

    const final = all.length > 0 ? all : STATIC_ARTICLES
    final.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    setArticles(final)
    setErrors(errs)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = filter === 'Todos' ? articles : articles.filter(a => a.source === filter)

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Noticias · Mundial 2026</h1>
        <p className="text-slate-400 mt-1">Últimas noticias de FIFA y Goal en español</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {['Todos', ...FEEDS.map(f => f.label)].map(f => (
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

      {/* Error notices */}
      {errors.length > 0 && errors.length < FEEDS.length && (
        <div className="card p-3 mb-4 border-amber-500/30 bg-amber-500/5 text-xs text-amber-400">
          No se pudo cargar: {errors.join(', ')}. Mostrando artículos disponibles.
        </div>
      )}
      {errors.length === FEEDS.length && (
        <div className="card p-3 mb-4 border-sky-500/30 bg-sky-500/5 text-xs text-sky-400">
          📰 Mostrando artículos curados sobre el Mundial 2026. Los feeds en vivo están temporalmente no disponibles.
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Cargando noticias…" />
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">📰</p>
          <p className="text-slate-400">No hay noticias disponibles en este momento</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">
            <span className="text-white font-semibold">{filtered.length}</span> artículos
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(item => <NewsCard key={item.id} item={item} />)}
          </div>
        </>
      )}
    </div>
  )
}
