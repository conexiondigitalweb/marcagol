import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import LiveIndicator from '../ui/LiveIndicator'

const NAV_ITEMS = [
  { to: '/',            label: 'Inicio',       icon: '🏠' },
  { to: '/grupos',      label: 'Grupos',       icon: '📊' },
  { to: '/llaves',      label: 'Llaves',       icon: '🔗' },
  { to: '/equipos',     label: 'Equipos',      icon: '👕' },
  { to: '/predicciones',label: 'Predicciones', icon: '🎯' },
  { to: '/calendario',  label: 'Calendario',   icon: '📅' },
  { to: '/noticias',    label: 'Noticias',     icon: '📰' },
  { to: '/donde-ver',   label: 'Dónde Ver',    icon: '📺' },
  { to: '/historia',    label: 'Historia',     icon: '🏆' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { hasLive, liveMatches } = useApp()

  return (
    <header className="sticky top-0 z-50 backdrop-blur border-b border-slate-800" style={{ backgroundColor: 'rgba(11,17,32,0.97)' }}>
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0" onClick={() => setMenuOpen(false)}>
            {/* Punto naranja */}
            <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
            <div className="leading-tight">
              <span className="font-extrabold text-white text-lg tracking-tight">marca</span>
              <span className="font-extrabold text-sky-400 text-lg tracking-tight">gol</span>
              <span className="text-slate-500 text-xs">.live</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
              >
                <span className="text-sm">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {hasLive && (
              <Link to="/" className="hidden sm:flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 rounded-full px-3 py-1">
                <LiveIndicator />
                <span className="text-sky-400 text-xs font-semibold">{liveMatches.length}</span>
              </Link>
            )}

            {/* Mundial badge */}
            <div className="hidden md:flex items-center gap-1.5 bg-orange-500 rounded-full px-3 py-1">
              <span className="text-xs text-white font-bold">Mundial 2026</span>
              <span className="text-xs">🏆</span>
            </div>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="lg:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Menú"
            >
              <span className={`block w-5 h-0.5 bg-slate-400 transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-slate-400 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-slate-400 transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <nav className="lg:hidden border-t border-slate-800 py-3 grid grid-cols-2 gap-1 animate-fade-in">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => isActive ? 'nav-link-active justify-start' : 'nav-link justify-start'}
                onClick={() => setMenuOpen(false)}
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
