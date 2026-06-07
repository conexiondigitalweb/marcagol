import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/50 mt-16">
      <div className="container mx-auto px-4 max-w-7xl py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: '#F97316', fontSize: '18px' }}>●</span>
              <span className="font-extrabold text-white">marca</span>
              <span className="font-extrabold text-sky-400">gol</span>
              <span className="text-slate-500 text-xs">.live</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tu fuente de información del Mundial 2026. Resultados en vivo, grupos, estadísticas y más.
            </p>
          </div>

          {/* Nav principal */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Navegación</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { to: '/',             label: 'Inicio'       },
                { to: '/grupos',       label: 'Grupos'       },
                { to: '/equipos',      label: 'Equipos'      },
                { to: '/goleadores',   label: 'Goleadores'   },
                { to: '/predicciones', label: 'Predicciones' },
                { to: '/calendario',   label: 'Calendario'   },
                { to: '/noticias',     label: 'Noticias'     },
                { to: '/llaves',       label: 'Llaves'       },
              ].map(item => (
                <Link key={item.to} to={item.to} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Más */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Más</p>
            <div className="flex flex-col gap-1.5">
              {[
                { to: '/donde-ver', label: 'Dónde Ver el Mundial' },
                { to: '/historia',  label: 'Historia del Mundial' },
              ].map(item => (
                <Link key={item.to} to={item.to} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                  {item.label}
                </Link>
              ))}
              <a href="https://api-football.com" target="_blank" rel="noreferrer"
                className="text-sm text-slate-500 hover:text-sky-400 transition-colors mt-2">
                Datos · api-football.com
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4 text-center">
          <p className="text-xs text-slate-600">© 2026 marcagol.live · Hecho con ⚽ para los fanáticos del fútbol</p>
        </div>
      </div>
    </footer>
  )
}
