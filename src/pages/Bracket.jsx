import { useState } from 'react'
import Flag from '../components/ui/Flag'
import { GROUPS } from '../data/groups'

// ─── Fases oficiales Mundial 2026 ─────────────────────────────────────────────
// Dieciseisavos: 28 jun – 3 jul (32 equipos → 16)
// Octavos:        4 jul – 7 jul (16 → 8)
// Cuartos:        9 jul – 11 jul (8 → 4)
// Semifinales:   14 jul – 15 jul (4 → 2)
// 3er Lugar:     18 jul
// Final:         19 jul

const PHASES = [
  { label: 'Dieciseisavos', date: '28 jun–3 jul',  color: 'text-cyan-400   border-cyan-500/30   bg-cyan-500/10'   },
  { label: 'Octavos',       date: '4–7 jul',        color: 'text-blue-400   border-blue-500/30   bg-blue-500/10'   },
  { label: 'Cuartos',       date: '9–11 jul',       color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  { label: 'Semifinales',   date: '14–15 jul',      color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  { label: '3° Lugar',      date: '18 jul',         color: 'text-slate-400  border-slate-500/30  bg-slate-500/10'  },
  { label: 'Final',         date: '19 jul',         color: 'text-amber-400  border-amber-500/30  bg-amber-500/10'  },
]

// Dieciseisavos: 16 partidos
// Los 24 primeros/segundos (2 por grupo × 12 grupos) + 8 mejores terceros
const R16_MATCHES = [
  { id:'d16-1',  home:'1° Grupo A', away:'2° Grupo B',      date:'28 jun' },
  { id:'d16-2',  home:'1° Grupo C', away:'2° Grupo D',      date:'28 jun' },
  { id:'d16-3',  home:'1° Grupo E', away:'2° Grupo F',      date:'29 jun' },
  { id:'d16-4',  home:'1° Grupo G', away:'2° Grupo H',      date:'29 jun' },
  { id:'d16-5',  home:'1° Grupo I', away:'2° Grupo J',      date:'30 jun' },
  { id:'d16-6',  home:'1° Grupo K', away:'2° Grupo L',      date:'30 jun' },
  { id:'d16-7',  home:'1° Grupo B', away:'Mejor 3° (1)',    date:'1 jul'  },
  { id:'d16-8',  home:'1° Grupo D', away:'Mejor 3° (2)',    date:'1 jul'  },
  { id:'d16-9',  home:'2° Grupo E', away:'1° Grupo F',      date:'2 jul'  },
  { id:'d16-10', home:'2° Grupo G', away:'1° Grupo H',      date:'2 jul'  },
  { id:'d16-11', home:'2° Grupo I', away:'1° Grupo J',      date:'3 jul'  },
  { id:'d16-12', home:'2° Grupo K', away:'1° Grupo L',      date:'3 jul'  },
  { id:'d16-13', home:'1° Grupo A', away:'Mejor 3° (3)',    date:'3 jul'  },
  { id:'d16-14', home:'1° Grupo C', away:'Mejor 3° (4)',    date:'3 jul'  },
  { id:'d16-15', home:'Mejor 3° (5)', away:'1° Grupo E',   date:'3 jul'  },
  { id:'d16-16', home:'Mejor 3° (6)', away:'1° Grupo G',   date:'3 jul'  },
]

const R8_MATCHES = Array.from({ length: 8 }, (_, i) => ({
  id: `r8-${i+1}`,
  home: `Gan. D16-${2*i+1}`,
  away: `Gan. D16-${2*i+2}`,
  date: ['4 jul','4 jul','5 jul','5 jul','6 jul','6 jul','7 jul','7 jul'][i],
}))

const QF_MATCHES = Array.from({ length: 4 }, (_, i) => ({
  id: `qf-${i+1}`,
  home: `Gan. R8-${2*i+1}`,
  away: `Gan. R8-${2*i+2}`,
  date: ['9 jul','9 jul','10 jul','11 jul'][i],
}))

const SF_MATCHES = [
  { id:'sf-1', home:'Gan. QF-1', away:'Gan. QF-2', date:'14 jul' },
  { id:'sf-2', home:'Gan. QF-3', away:'Gan. QF-4', date:'15 jul' },
]

const FINAL = { id:'final', home:'Gan. SF-1', away:'Gan. SF-2', date:'19 jul' }
const THIRD = { id:'third', home:'Per. SF-1', away:'Per. SF-2', date:'18 jul' }

function MatchSlot({ match, highlight = false }) {
  return (
    <div className={`w-48 rounded-lg overflow-hidden border transition-all ${
      highlight ? 'border-amber-400/60 bg-slate-800' : 'border-slate-700 bg-slate-800'
    }`}>
      <div className="bg-slate-700/40 px-2.5 py-1 flex items-center justify-between">
        <span className="text-xs text-slate-500 truncate">{match.id.toUpperCase()}</span>
        <span className="text-xs text-slate-600 flex-shrink-0 ml-1">{match.date}</span>
      </div>
      {[match.home, match.away].map((team, idx) => (
        <div key={idx} className="flex items-center gap-2 px-3 py-2 text-xs border-t border-slate-700/50 text-slate-400">
          <span className="w-2 h-2 rounded-sm bg-slate-600 flex-shrink-0" />
          <span className="truncate">{team}</span>
        </div>
      ))}
    </div>
  )
}

export default function Bracket() {
  const [activePhase, setActivePhase] = useState('d16')

  const phases = [
    { id:'d16', label:'Dieciseisavos', matches: R16_MATCHES, cols: 2 },
    { id:'r8',  label:'Octavos',       matches: R8_MATCHES,  cols: 2 },
    { id:'qf',  label:'Cuartos',       matches: QF_MATCHES,  cols: 2 },
    { id:'sf',  label:'Semifinales',   matches: SF_MATCHES,  cols: 1 },
    { id:'final', label:'Final + 3°',  matches: [FINAL, THIRD], cols: 1 },
  ]

  const current = phases.find(p => p.id === activePhase)

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Árbol de Llaves · Mundial 2026</h1>
        <p className="text-slate-400 mt-1">
          48 equipos · 6 fases · Del 28 de junio al 19 de julio
        </p>
      </div>

      {/* Timeline de fases */}
      <div className="flex flex-wrap gap-2 mb-8">
        {PHASES.map(phase => (
          <div key={phase.label} className={`border rounded-lg px-4 py-2 text-center ${phase.color}`}>
            <div className="font-bold text-sm">{phase.label}</div>
            <div className="text-xs opacity-70">{phase.date}</div>
          </div>
        ))}
      </div>

      {/* Info formato */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
          <span>📌 <strong className="text-white">32 clasificados:</strong> 1° y 2° de cada grupo (24) + 8 mejores terceros</span>
          <span>📌 <strong className="text-white">Dieciseisavos:</strong> Primera fase eliminatoria — nueva en 2026</span>
          <span>📌 <strong className="text-white">Final:</strong> MetLife Stadium, Nueva York — 19 de julio</span>
        </div>
      </div>

      {/* Tabla de mejores terceros */}
      <div className="card p-5 mb-8">
        <h3 className="font-bold text-white mb-4">🏅 Clasificación de Mejores Terceros</h3>
        <p className="text-xs text-slate-500 mb-4">
          Los 8 mejores terceros de los 12 grupos avanzan a Dieciseisavos. Se ordenan por puntos, diferencia de goles y goles a favor.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-700">
                <th className="text-left py-2 px-3">#</th>
                <th className="text-left py-2">Selección</th>
                <th className="text-center py-2">Grupo</th>
                <th className="text-center py-2">PJ</th>
                <th className="text-center py-2">G</th>
                <th className="text-center py-2">E</th>
                <th className="text-center py-2">P</th>
                <th className="text-center py-2">DG</th>
                <th className="text-center py-2">Pts</th>
                <th className="text-center py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }, (_, i) => (
                <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                  <td className="py-2.5 px-3 font-bold text-sky-400">{i + 1}</td>
                  <td className="py-2.5 text-slate-400 italic">Por definir</td>
                  <td className="py-2.5 text-center text-slate-500">—</td>
                  <td className="py-2.5 text-center text-slate-500">0</td>
                  <td className="py-2.5 text-center text-slate-500">0</td>
                  <td className="py-2.5 text-center text-slate-500">0</td>
                  <td className="py-2.5 text-center text-slate-500">0</td>
                  <td className="py-2.5 text-center text-slate-500">0</td>
                  <td className="py-2.5 text-center text-slate-500">0</td>
                  <td className="py-2.5 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                      {i < 8 ? '✓ Clasifica' : 'Eliminado'}
                    </span>
                  </td>
                </tr>
              ))}
              {Array.from({ length: 4 }, (_, i) => (
                <tr key={`out-${i}`} className="border-b border-slate-700/30 opacity-40">
                  <td className="py-2.5 px-3 text-slate-600">{i + 9}</td>
                  <td className="py-2.5 text-slate-600 italic">Por definir</td>
                  <td className="py-2.5 text-center text-slate-600">—</td>
                  <td className="py-2.5 text-center text-slate-600">0</td>
                  <td className="py-2.5 text-center text-slate-600">0</td>
                  <td className="py-2.5 text-center text-slate-600">0</td>
                  <td className="py-2.5 text-center text-slate-600">0</td>
                  <td className="py-2.5 text-center text-slate-600">0</td>
                  <td className="py-2.5 text-center text-slate-600">0</td>
                  <td className="py-2.5 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-600">
                      Eliminado
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-600 mt-3">* Se actualizará automáticamente cuando inicien los partidos el 11 de junio.</p>
      </div>

      {/* Selector de fase */}
      <div className="flex flex-wrap gap-2 mb-6">
        {phases.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePhase(p.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              activePhase === p.id
                ? 'bg-sky-500 text-white border-sky-500'
                : 'border-slate-700 text-slate-400 hover:text-white bg-slate-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Partidos de la fase seleccionada */}
      <div className="card p-5 overflow-x-auto">
        <h3 className="font-bold text-white mb-4">{current.label}</h3>
        <div className={`grid gap-4 ${current.cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-sm'}`}>
          {current.matches.map(match => (
            <MatchSlot
              key={match.id}
              match={match}
              highlight={match.id === 'final'}
            />
          ))}
        </div>
      </div>

      {/* Referencia de grupos */}
      <div className="mt-8 card p-6">
        <h3 className="font-bold text-white mb-4">Referencia de Grupos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {GROUPS.map(group => (
            <div key={group.id} className="text-center">
              <div className="badge-group mx-auto mb-2">{group.id}</div>
              {group.teams.map(t => (
                <div key={t.code} className="flex items-center gap-1.5 justify-center py-0.5">
                  <Flag iso2={t.iso2} size="xs" />
                  <span className="text-xs text-slate-400 truncate">{t.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
