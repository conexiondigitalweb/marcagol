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
    <div className="card overflow-hidden group hover:border-sky-500/30 transition-all">
      {/* Image with overlay */}
      <div className="relative overflow-hidden" style={{ height: '160px' }}>
        {!imgError ? (
          <img
            src={venue.image}
            alt={venue.name}
            className="w-full h-full group-hover:scale-105 transition-transform duration-500"
            style={{ objectFit: 'cover' }}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <img
            src="/images/stadium-generic.svg"
            alt={venue.name}
            className="w-full h-full"
            style={{ objectFit: 'cover' }}
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)' }} />
        {/* Name on overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
          <p className="font-bold text-sm leading-tight drop-shadow-lg" style={{ color: '#ffffff' }}>{venue.name}</p>
          <p className="text-xs mt-0.5 drop-shadow" style={{ color: '#CBD5E1' }}>
            {COUNTRY_FLAG[venue.country]} {venue.city}
          </p>
        </div>
      </div>

      {/* Capacity bar */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <span className="text-xs text-slate-500">Capacidad</span>
        <span className="text-sky-400 font-bold text-sm">
          {venue.capacity.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
