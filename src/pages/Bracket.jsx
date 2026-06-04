import { useState } from 'react'
import Flag from '../components/ui/Flag'
import { GROUPS } from '../data/groups'

// Bracket slot descriptions for 2026 format
const BRACKET_DATA = {
  r32: [
    { id:'r32-1',  label:'R32-1',  home:'1° Grupo A', away:'2° Grupo B', date:'5 jul' },
    { id:'r32-2',  label:'R32-2',  home:'1° Grupo C', away:'2° Grupo D', date:'5 jul' },
    { id:'r32-3',  label:'R32-3',  home:'1° Grupo E', away:'2° Grupo F', date:'6 jul' },
    { id:'r32-4',  label:'R32-4',  home:'1° Grupo G', away:'2° Grupo H', date:'6 jul' },
    { id:'r32-5',  label:'R32-5',  home:'1° Grupo I', away:'2° Grupo J', date:'7 jul' },
    { id:'r32-6',  label:'R32-6',  home:'1° Grupo K', away:'2° Grupo L', date:'7 jul' },
    { id:'r32-7',  label:'R32-7',  home:'Mejor 3° (1)', away:'1° Grupo B', date:'8 jul' },
    { id:'r32-8',  label:'R32-8',  home:'Mejor 3° (2)', away:'1° Grupo D', date:'8 jul' },
    { id:'r32-9',  label:'R32-9',  home:'1° Grupo F', away:'2° Grupo E', date:'9 jul' },
    { id:'r32-10', label:'R32-10', home:'1° Grupo H', away:'2° Grupo G', date:'9 jul' },
    { id:'r32-11', label:'R32-11', home:'1° Grupo J', away:'2° Grupo I', date:'10 jul' },
    { id:'r32-12', label:'R32-12', home:'1° Grupo L', away:'2° Grupo K', date:'10 jul' },
    { id:'r32-13', label:'R32-13', home:'Mejor 3° (3)', away:'1° Grupo A', date:'11 jul' },
    { id:'r32-14', label:'R32-14', home:'Mejor 3° (4)', away:'1° Grupo C', date:'11 jul' },
    { id:'r32-15', label:'R32-15', home:'Mejor 3° (5)', away:'1° Grupo E', date:'12 jul' },
    { id:'r32-16', label:'R32-16', home:'Mejor 3° (6)', away:'1° Grupo G', date:'12 jul' },
  ],
  r16: Array.from({ length: 8 }, (_, i) => ({
    id: `r16-${i+1}`, label: `R16-${i+1}`,
    home: `Gan. R32-${2*i+1}`, away: `Gan. R32-${2*i+2}`,
    date: ['13 jul','13 jul','14 jul','14 jul','15 jul','15 jul','16 jul','16 jul'][i],
  })),
  qf: Array.from({ length: 4 }, (_, i) => ({
    id: `qf-${i+1}`, label: `QF-${i+1}`,
    home: `Gan. R16-${2*i+1}`, away: `Gan. R16-${2*i+2}`,
    date: ['19 jul','19 jul','20 jul','20 jul'][i],
  })),
  sf: Array.from({ length: 2 }, (_, i) => ({
    id: `sf-${i+1}`, label: `SF-${i+1}`,
    home: `Gan. QF-${2*i+1}`, away: `Gan. QF-${2*i+2}`,
    date: ['23 jul','24 jul'][i],
  })),
  final: [{ id:'final', label:'Final', home:'Gan. SF-1', away:'Gan. SF-2', date:'27 jul' }],
  third: [{ id:'third', label:'3° Lugar', home:'Per. SF-1', away:'Per. SF-2', date:'26 jul' }],
}

function BracketMatch({ match, highlight = false }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-52 flex-shrink-0 rounded-lg overflow-hidden border transition-all duration-200 ${
        highlight
          ? 'border-amber-400/60 shadow-lg shadow-amber-500/10'
          : hovered
          ? 'border-sky-500/40 shadow-md shadow-sky-500/10'
          : 'border-slate-700'
      } bg-slate-800`}
    >
      <div className="bg-slate-700/40 px-2.5 py-1 flex items-center justify-between">
        <span className="text-xs text-slate-500">{match.label}</span>
        <span className="text-xs text-slate-600">{match.date}</span>
      </div>
      {[match.home, match.away].map((team, idx) => (
        <div
          key={idx}
          className={`flex items-center gap-2 px-3 py-2.5 text-sm border-t border-slate-700/50
            ${match.winner === team ? 'bg-sky-500/10 text-sky-300 font-semibold' : 'text-slate-300'}`}
        >
          <span className="w-3 h-3 rounded-sm bg-slate-600 flex-shrink-0" />
          <span className="truncate">{team}</span>
          {match.homeScore !== undefined && (
            <span className="ml-auto font-bold text-white">
              {idx === 0 ? match.homeScore : match.awayScore}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function RoundColumn({ title, matches, itemHeight, highlight = false }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full border ${
        highlight
          ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
          : 'text-sky-400 border-sky-500/20 bg-sky-500/10'
      }`}>
        {title}
      </div>
      <div className="flex flex-col gap-0">
        {matches.map((match, i) => (
          <div
            key={match.id}
            className="flex items-center"
            style={{ height: `${itemHeight}px` }}
          >
            <div className="relative">
              <BracketMatch match={match} highlight={highlight} />
              {/* Right connector line (horizontal) */}
              <div className="absolute right-0 top-1/2 w-6 border-t border-slate-700 translate-x-full -translate-y-px" />
            </div>
            {/* Vertical bracket arm */}
            {matches.length > 1 && i % 2 === 0 && i + 1 < matches.length && (
              <div
                className="absolute translate-x-[244px] border-r border-t border-b border-slate-700"
                style={{
                  height: `${itemHeight}px`,
                  top: `${i * itemHeight + itemHeight / 2}px`,
                  width: '24px',
                  position: 'absolute',
                  borderRadius: '0 4px 4px 0',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Bracket() {
  const ITEM_H = 110

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Árbol de Llaves · Mundial 2026</h1>
        <p className="text-slate-400 mt-1">
          Fase eliminatoria a partir del 5 de julio. 32 equipos compiten desde Octavos de Final.
        </p>
      </div>

      {/* Format info */}
      <div className="card p-4 mb-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
          <span className="text-slate-400">48 equipos → Fase de Grupos (12 grupos × 6 partidos)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span className="text-slate-400">32 clasificados → Fase Eliminatoria (Octavos → Final)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span className="text-slate-400">8 mejores 3eros también clasifican</span>
        </div>
      </div>

      {/* Phase Timeline */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { label: 'Octavos',     date: '5-12 jul', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
          { label: 'Cuartos',     date: '19-20 jul', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
          { label: 'Semifinales', date: '23-24 jul', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
          { label: '3° Lugar',    date: '26 jul',   color: 'text-slate-400 border-slate-500/30 bg-slate-500/10' },
          { label: 'Final',       date: '27 jul',   color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
        ].map(phase => (
          <div key={phase.label} className={`border rounded-lg px-4 py-2 text-center ${phase.color}`}>
            <div className="font-bold text-sm">{phase.label}</div>
            <div className="text-xs opacity-70">{phase.date}</div>
          </div>
        ))}
      </div>

      {/* Bracket – scrollable horizontally */}
      <div className="card p-6 overflow-x-auto">
        <div className="flex gap-6 min-w-max">

          {/* Octavos R32 top half */}
          <div className="flex flex-col" style={{ gap: 0 }}>
            <div className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-4 text-center">
              Octavos de Final
            </div>
            {BRACKET_DATA.r32.slice(0, 8).map((match, i) => (
              <div key={match.id} className="flex items-center" style={{ height: `${ITEM_H}px` }}>
                <BracketMatch match={match} />
                <div className="w-6 border-t border-slate-700" />
              </div>
            ))}
          </div>

          {/* R16 top half (Cuartos) */}
          <div className="flex flex-col">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4 text-center">
              Cuartos de Final
            </div>
            {BRACKET_DATA.r16.slice(0, 4).map((match, i) => (
              <div key={match.id} className="flex items-center" style={{ height: `${ITEM_H * 2}px` }}>
                <BracketMatch match={match} />
                <div className="w-6 border-t border-slate-700" />
              </div>
            ))}
          </div>

          {/* SF top */}
          <div className="flex flex-col">
            <div className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4 text-center">
              Semifinales
            </div>
            {BRACKET_DATA.sf.slice(0, 1).map(match => (
              <div key={match.id} className="flex items-center" style={{ height: `${ITEM_H * 4}px` }}>
                <BracketMatch match={match} />
                <div className="w-6 border-t border-slate-700" />
              </div>
            ))}
          </div>

          {/* FINAL */}
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-4 text-center">
              🏆 Final
            </div>
            <div className="flex items-center" style={{ height: `${ITEM_H * 4}px` }}>
              <BracketMatch match={BRACKET_DATA.final[0]} highlight />
            </div>
          </div>

          {/* SF bottom */}
          <div className="flex flex-col">
            <div className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4 text-center">
              Semifinales
            </div>
            <div className="flex items-center" style={{ height: `${ITEM_H * 4}px` }}>
              <div className="w-6 border-t border-slate-700" />
              <BracketMatch match={BRACKET_DATA.sf[1]} />
            </div>
          </div>

          {/* Cuartos bottom */}
          <div className="flex flex-col">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4 text-center">
              Cuartos de Final
            </div>
            {BRACKET_DATA.r16.slice(4).map(match => (
              <div key={match.id} className="flex items-center" style={{ height: `${ITEM_H * 2}px` }}>
                <div className="w-6 border-t border-slate-700" />
                <BracketMatch match={match} />
              </div>
            ))}
          </div>

          {/* Octavos bottom */}
          <div className="flex flex-col">
            <div className="text-xs font-bold uppercase tracking-widest text-sky-400 mb-4 text-center">
              Octavos de Final
            </div>
            {BRACKET_DATA.r32.slice(8).map(match => (
              <div key={match.id} className="flex items-center" style={{ height: `${ITEM_H}px` }}>
                <div className="w-6 border-t border-slate-700" />
                <BracketMatch match={match} />
              </div>
            ))}
          </div>
        </div>

        {/* 3rd place */}
        <div className="mt-10 pt-6 border-t border-slate-700/50 flex justify-center">
          <div className="text-center">
            <p className="text-xs text-slate-600 uppercase tracking-wider mb-3">Tercer Lugar · 26 de julio</p>
            <BracketMatch match={BRACKET_DATA.third[0]} />
          </div>
        </div>
      </div>

      {/* Groups reference */}
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
