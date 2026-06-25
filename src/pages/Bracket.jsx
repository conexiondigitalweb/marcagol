import { useState, useMemo } from 'react'
import Flag from '../components/ui/Flag'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { GROUPS } from '../data/groups'
import { MATCHES } from '../data/matches'
import { useStandings, useLiveMatches } from '../hooks/useLiveData'
import { projectBracket } from '../utils/bracketProjector'
import { rankThirdPlaceTeams } from '../utils/thirdPlaceRanking'
import { esTeamName } from '../data/teamNames'

const MATCH_BY_ID = Object.fromEntries(MATCHES.map(m => [m.id, m]))

function fmtDate(iso) {
  if (!iso) return ''
  const p = iso.split('-')
  const m = ['','ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${parseInt(p[2])} ${m[parseInt(p[1])] ?? p[1]}`
}

// ─── Fases oficiales Mundial 2026 ─────────────────────────────────────────────
const PHASES = [
  { label: 'Dieciseisavos', date: '28 jun–3 jul',  color: 'text-cyan-400   border-cyan-500/30   bg-cyan-500/10'   },
  { label: 'Octavos',       date: '4–7 jul',        color: 'text-blue-400   border-blue-500/30   bg-blue-500/10'   },
  { label: 'Cuartos',       date: '9–11 jul',       color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  { label: 'Semifinales',   date: '14–15 jul',      color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  { label: '3° Lugar',      date: '18 jul',         color: 'text-slate-400  border-slate-500/30  bg-slate-500/10'  },
  { label: 'Final',         date: '19 jul',         color: 'text-amber-400  border-amber-500/30  bg-amber-500/10'  },
]

// ─── Dieciseisavos — sorteo oficial FIFA 5-dic-2025 ───────────────────────────
// Los "Mejor 3º" se asignan mediante tabla FIFA de 495 combinaciones al cierre
// de la fase de grupos — nunca intentar calcularlos en el cliente.
const R32_MATCHES = [
  { id: 'd32-1',  matchId: 73, home: '2º Grupo A',           away: '2º Grupo B'             },
  { id: 'd32-2',  matchId: 74, home: '1º Grupo E',           away: 'Mejor 3º (A/B/C/D/F)'  },
  { id: 'd32-3',  matchId: 75, home: '1º Grupo F',           away: '2º Grupo C'             },
  { id: 'd32-4',  matchId: 76, home: '1º Grupo C',           away: '2º Grupo F'             },
  { id: 'd32-5',  matchId: 77, home: '1º Grupo I',           away: 'Mejor 3º (C/D/F/G/H)'  },
  { id: 'd32-6',  matchId: 78, home: '2º Grupo E',           away: '2º Grupo I'             },
  { id: 'd32-7',  matchId: 79, home: '1º Grupo A',           away: 'Mejor 3º (C/E/F/H/I)'  },
  { id: 'd32-8',  matchId: 80, home: '1º Grupo L',           away: 'Mejor 3º (E/H/I/J/K)'  },
  { id: 'd32-9',  matchId: 81, home: '1º Grupo D',           away: 'Mejor 3º (B/E/F/I/J)'  },
  { id: 'd32-10', matchId: 82, home: '1º Grupo G',           away: 'Mejor 3º (A/E/H/I/J)'  },
  { id: 'd32-11', matchId: 83, home: '2º Grupo K',           away: '2º Grupo L'             },
  { id: 'd32-12', matchId: 84, home: '1º Grupo H',           away: '2º Grupo J'             },
  { id: 'd32-13', matchId: 85, home: '1º Grupo B',           away: 'Mejor 3º (E/F/G/I/J)'  },
  { id: 'd32-14', matchId: 86, home: '1º Grupo J',           away: '2º Grupo H'             },
  { id: 'd32-15', matchId: 87, home: '1º Grupo K',           away: 'Mejor 3º (D/E/I/J/L)'  },
  { id: 'd32-16', matchId: 88, home: '2º Grupo D',           away: '2º Grupo G'             },
]

// ─── Octavos — W = ganador del partido de dieciseisavos ───────────────────────
const R8_MATCHES = [
  { id: 'r8-1', matchId: 89, home: 'W74', away: 'W77' },
  { id: 'r8-2', matchId: 90, home: 'W73', away: 'W75' },
  { id: 'r8-3', matchId: 91, home: 'W76', away: 'W78' },
  { id: 'r8-4', matchId: 92, home: 'W79', away: 'W80' },
  { id: 'r8-5', matchId: 93, home: 'W83', away: 'W84' },
  { id: 'r8-6', matchId: 94, home: 'W81', away: 'W82' },
  { id: 'r8-7', matchId: 95, home: 'W86', away: 'W88' },
  { id: 'r8-8', matchId: 96, home: 'W85', away: 'W87' },
]

const QF_MATCHES = [
  { id: 'qf-1', matchId: 97,  home: 'W89', away: 'W90' },
  { id: 'qf-2', matchId: 98,  home: 'W91', away: 'W92' },
  { id: 'qf-3', matchId: 99,  home: 'W93', away: 'W94' },
  { id: 'qf-4', matchId: 100, home: 'W95', away: 'W96' },
]

const SF_MATCHES = [
  { id: 'sf-1', matchId: 101, home: 'W97',  away: 'W98'  },
  { id: 'sf-2', matchId: 102, home: 'W99',  away: 'W100' },
]

const FINAL = { id: 'final', matchId: 104, home: 'W101', away: 'W102' }
const THIRD = { id: 'third', matchId: 103, home: 'Per. SF-1', away: 'Per. SF-2' }

function MatchSlot({ match, highlight = false, resolvedMatch = null }) {
  const appMatch = match.matchId ? MATCH_BY_ID[match.matchId] : null
  const date  = appMatch ? fmtDate(appMatch.date) : (match.date ?? '')
  const venue = appMatch?.venue ?? ''
  const city  = appMatch?.city ?? ''

  const slots = [
    { static: match.home, resolved: resolvedMatch?.home },
    { static: match.away, resolved: resolvedMatch?.away },
  ]

  return (
    <div className={`w-52 rounded-lg overflow-hidden border transition-all ${
      highlight ? 'border-amber-400/60 bg-slate-800' : 'border-slate-700 bg-slate-800'
    }`}>
      <div className="bg-slate-700/40 px-2.5 py-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs text-slate-500 truncate font-medium">
            {match.matchId ? `#${match.matchId}` : match.id.toUpperCase()}
          </span>
          <span className="text-xs text-slate-600 flex-shrink-0">{date}</span>
        </div>
        {venue && (
          <div className="text-[10px] text-slate-600 truncate mt-0.5">{venue} · {city}</div>
        )}
      </div>

      {slots.map((slot, idx) => {
        if (!slot.resolved?.team) {
          return (
            <div key={idx} className="flex items-center gap-2 px-3 py-2 text-xs border-t border-slate-700/50 text-slate-400">
              <span className="w-2 h-2 rounded-sm bg-slate-600 flex-shrink-0" />
              <span className="truncate">{slot.static}</span>
            </div>
          )
        }
        const name  = esTeamName({ id: slot.resolved.team.id, name: slot.resolved.team.name })
        const badge = slot.resolved.confirmed ? '🟢' : '🟡'
        return (
          <div key={idx} className="flex items-center gap-2 px-3 py-2 text-xs border-t border-slate-700/50">
            <span className="flex-shrink-0 leading-none">{badge}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-slate-200 font-medium">{name}</div>
              <div className="text-[10px] text-slate-500">{slot.resolved.position} Gr.{slot.resolved.group}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const LIVE_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'])

export default function Bracket() {
  const [activePhase, setActivePhase] = useState('d32')
  const { matches: liveMatches } = useLiveMatches()
  const hasLive = liveMatches.some(m => LIVE_STATUSES.has(m.fixture?.status?.short))
  const { standings: rawStandings, loading } = useStandings(hasLive ? 60_000 : 600_000)

  // useStandings() devuelve [{ league: { standings: [[groupA],[groupB],...] } }]
  // Transformar al formato que esperan projectBracket y rankThirdPlaceTeams:
  // [{ group: 'Group A', standings: [[entry1,entry2,entry3,entry4]] }]
  const allGroups = useMemo(() => {
    if (!rawStandings?.length) return []
    return rawStandings[0]?.league?.standings ?? []
  }, [rawStandings])

  // Filtrar solo grupos reales (A-L), deduplicar por nombre de grupo.
  // La API puede devolver entradas fantasma como "Group Stage" o grupos repetidos.
  const formattedStandings = useMemo(() => {
    const unique = Array.from(
      new Map(
        allGroups
          .filter(g => g.length > 0 && g[0]?.group?.match(/^Group [A-L]$/))
          .map(g => [g[0].group, g])
      ).values()
    )
    return unique.map(g => ({ group: g[0].group, standings: [g] }))
  }, [allGroups])

  const bracketData = useMemo(() => {
    if (!formattedStandings.length) return null
    try { return projectBracket(formattedStandings) } catch { return null }
  }, [formattedStandings])

  const thirdPlaceData = useMemo(() => {
    if (!formattedStandings.length) return null
    try { return rankThirdPlaceTeams(formattedStandings) } catch { return null }
  }, [formattedStandings])

  // matchId (73-88) → objeto de cruce resuelto por bracketProjector
  const bracketByMatchId = useMemo(() => {
    if (!bracketData?.matches) return {}
    return Object.fromEntries(
      bracketData.matches.map(m => [parseInt(m.id.replace('M', '')), m])
    )
  }, [bracketData])

  const allGroupsComplete = formattedStandings.length === 12 &&
    formattedStandings.every(g => (g.standings[0][2]?.all?.played ?? 0) >= 3)

  const phases = [
    { id: 'd32',   label: 'Dieciseisavos', matches: R32_MATCHES,       cols: 2 },
    { id: 'r8',    label: 'Octavos',       matches: R8_MATCHES,        cols: 2 },
    { id: 'qf',    label: 'Cuartos',       matches: QF_MATCHES,        cols: 2 },
    { id: 'sf',    label: 'Semifinales',   matches: SF_MATCHES,        cols: 1 },
    { id: 'final', label: 'Final + 3°',    matches: [FINAL, THIRD],    cols: 1 },
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

        {loading && !thirdPlaceData ? (
          <LoadingSpinner text="Cargando clasificación..." />
        ) : thirdPlaceData ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-700">
                    <th className="text-left py-2 px-3">#</th>
                    <th className="text-left py-2">Selección</th>
                    <th className="text-center py-2">PJ</th>
                    <th className="text-center py-2">Pts</th>
                    <th className="text-center py-2">DG</th>
                    <th className="text-center py-2">GF</th>
                    <th className="text-center py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {thirdPlaceData.ranked.map((team, index) => {
                    const isQualified  = index < 8
                    const isBorderline = index === 7
                    return (
                      <tr
                        key={team.group}
                        className={
                          !isQualified ? 'border-b border-slate-700/30 opacity-40' :
                          isBorderline ? 'border-b border-yellow-500/30 bg-yellow-900/20' :
                          'border-b border-slate-700/30 hover:bg-slate-700/20'
                        }
                      >
                        <td className="py-2.5 px-3 font-bold text-sky-400">{index + 1}</td>
                        <td className="py-2.5">
                          <span className="mr-1">{isQualified ? '✅' : '❌'}</span>
                          <span className="text-slate-200">
                            {esTeamName({ id: team.teamId, name: team.teamName })}
                          </span>
                          <span className="text-slate-500 text-xs ml-1">({team.group})</span>
                        </td>
                        <td className="py-2.5 text-center text-slate-400">{team.played}</td>
                        <td className="py-2.5 text-center font-bold text-slate-200">{team.points}</td>
                        <td className="py-2.5 text-center text-slate-400">
                          {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                        </td>
                        <td className="py-2.5 text-center text-slate-400">{team.goalsFor}</td>
                        <td className="py-2.5 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isQualified
                              ? isBorderline
                                ? 'bg-yellow-800/40 text-yellow-400'
                                : 'bg-green-800/40 text-green-400'
                              : 'bg-slate-800 text-slate-600'
                          }`}>
                            {isQualified ? '✓ Clasifica' : 'Eliminado'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {!allGroupsComplete && (
              <p className="text-xs text-slate-500 mt-3">
                ⚠️ Proyección basada en resultados actuales. Se actualiza en tiempo real.
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-500 text-center py-6">
            Se actualizará automáticamente cuando inicien los partidos de grupos.
          </p>
        )}
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
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-bold text-white">{current.label}</h3>
          {activePhase === 'd32' && bracketData && (
            <span className="text-xs text-slate-500">
              {allGroupsComplete ? '🟢 Bracket confirmado' : '🟡 Proyectado (grupos en curso)'}
            </span>
          )}
        </div>
        {activePhase === 'd32' && (
          <div className="flex gap-4 mb-4 text-xs text-slate-400">
            <span>🟢 1º y 2º — Clasifican a Dieciseisavos</span>
            <span>🟡 Posible clasificación</span>
          </div>
        )}
        <div className={`grid gap-4 ${current.cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-sm'}`}>
          {current.matches.map(match => (
            <MatchSlot
              key={match.id}
              match={match}
              highlight={match.id === 'final'}
              resolvedMatch={activePhase === 'd32' ? (bracketByMatchId[match.matchId] ?? null) : null}
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
