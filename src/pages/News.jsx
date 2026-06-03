import { useState, useEffect, useCallback } from 'react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const PROXY = 'https://api.allorigins.win/get?url='

const FEEDS = [
  { id: 'fifa',  label: 'FIFA',  url: 'https://www.fifa.com/rss/news/all.xml' },
  { id: 'goal',  label: 'Goal',  url: 'https://www.goal.com/feeds/es/news' },
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
  const res = await fetch(proxied, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const { contents } = await res.json()
  const doc = new DOMParser().parseFromString(contents, 'text/xml')
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
      className="card group flex flex-col hover:border-emerald-500/40 transition-all"
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
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            {item.source}
          </span>
          {item.pubDate && (
            <span className="text-xs text-slate-600">{formatNewsDate(item.pubDate)}</span>
          )}
        </div>
        <p className="text-sm font-semibold text-white leading-snug group-hover:text-emerald-300 transition-colors line-clamp-3">
          {item.title}
        </p>
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

    all.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    setArticles(all)
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
                ? 'bg-emerald-500 text-white border-emerald-500'
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
      {errors.length > 0 && (
        <div className="card p-3 mb-4 border-amber-500/30 bg-amber-500/5 text-xs text-amber-400">
          No se pudo cargar: {errors.join(', ')}. Puede ser un problema de CORS temporal.
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
          <p className="text-sm text-slate-500 mb-4">
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
