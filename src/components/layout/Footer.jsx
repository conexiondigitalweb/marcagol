import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/50 mt-16">
      <div className="container mx-auto px-4 max-w-7xl py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚽</span>
            <span className="font-bold text-white">marcagol</span>
            <span className="text-sky-400 font-bold">.live</span>
            <span className="text-slate-500 text-sm ml-1">— Mundial 2026</span>
          </div>

          <nav className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
            <Link to="/"             className="hover:text-slate-300 transition-colors">Inicio</Link>
            <Link to="/grupos"       className="hover:text-slate-300 transition-colors">Grupos</Link>
            <Link to="/llaves"       className="hover:text-slate-300 transition-colors">Llaves</Link>
            <Link to="/equipos"      className="hover:text-slate-300 transition-colors">Equipos</Link>
            <Link to="/predicciones" className="hover:text-slate-300 transition-colors">Predicciones</Link>
            <Link to="/donde-ver"    className="hover:text-slate-300 transition-colors">Dónde Ver</Link>
          </nav>

          <p className="text-xs text-slate-600 text-center">
            Datos vía{' '}
            <a href="https://api-football.com" target="_blank" rel="noreferrer" className="text-sky-600 hover:text-sky-400 transition-colors">
              api-football.com
            </a>
            {' '}· © 2026 marcagol.live
          </p>
        </div>
      </div>
    </footer>
  )
}
