import { useState } from 'react'

const COUNTRY_FLAG = { USA: '🇺🇸', México: '🇲🇽', Canadá: '🇨🇦' }

export default function VenueCard({ venue, compact = false }) {
  const [imgError, setImgError] = useState(false)

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>🏟️</span>
        <span className="truncate">{venue.name}</span>
        <span className="text-slate-600 flex-shrink-0">
          {venue.capacity.toLocaleString()} cap.
        </span>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden group hover:border-emerald-500/30 transition-all">
      {/* Image */}
      <div className="relative h-40 bg-slate-800 overflow-hidden">
        {!imgError ? (
          <img
            src={venue.image}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-slate-700">
            🏟️
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3">
          <p className="text-white font-bold text-sm truncate">{venue.name}</p>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">
            {COUNTRY_FLAG[venue.country]} {venue.city}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-emerald-400 font-semibold">
            {venue.capacity.toLocaleString()}
          </p>
          <p className="text-xs text-slate-600">capacidad</p>
        </div>
      </div>
    </div>
  )
}
