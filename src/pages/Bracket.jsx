import { useState, useMemo, Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Flag from '../components/ui/Flag'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { GROUPS } from '../data/groups'
import { MATCHES } from '../data/matches'
import { useStandings, useLiveMatches } from '../hooks/useLiveData'
import { projectBracket } from '../utils/bracketProjector'

// ─── Constantes de layout ────────────────────────────────────────────────────
const BRACKET_H = 1040   // 16 × 65 px — altura total del árbol
const COL_W     = 158    // ancho de cada columna de slots
const CONN_W    = 28     // ancho del conector entre columnas

// ─── Lookup de equipos (nombre → { code, iso2 }) ─────────────────────────────
const TEAM_INFO_MAP = {}
GROUPS.forEach(g => g.teams.forEach(t => {
  TEAM_INFO_MAP[t.name.toLowerCase()] = { code: t.code, iso2: t.iso2 }
}))

function getTeamInfo(team) {
  if (!team?.name) return { code: 'TBD', iso2: null }
  const found = TEAM_INFO_MAP[team.name.toLowerCase()]
  return {
    code: found?.code ?? team.name.slice(0, 3).toUpperCase(),
    iso2:  found?.iso2 ?? null,
  }
}

const MATCH_BY_ID = Object.fromEntries(MATCHES.map(m => [m.id, m]))

function fmtDate(iso) {
  if (!iso) return ''
  const p = iso.split('-')
  const mo = ['','ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${parseInt(p[2])} ${mo[parseInt(p[1])] ?? p[1]}`
}

// ─── Datos de fases ───────────────────────────────────────────────────────────
const R32_MATCHES = [
  { matchId: 73,  home: '2º Grupo A',          away: '2º Grupo B'            },
  { matchId: 74,  home: '1º Grupo E',          away: 'Mejor 3º A/B/C/D/F'   },
  { matchId: 75,  home: '1º Grupo F',          away: '2º Grupo C'            },
  { matchId: 76,  home: '1º Grupo C',          away: '2º Grupo F'            },
  { matchId: 77,  home: '1º Grupo I',          away: 'Mejor 3º C/D/F/G/H'   },
  { matchId: 78,  home: '2º Grupo E',          away: '2º Grupo I'            },
  { matchId: 79,  home: '1º Grupo A',          away: 'Mejor 3º C/E/F/H/I'   },
  { matchId: 80,  home: '1º Grupo L',          away: 'Mejor 3º E/H/I/J/K'   },
  { matchId: 81,  home: '1º Grupo D',          away: 'Mejor 3º B/E/F/I/J'   },
  { matchId: 82,  home: '1º Grupo G',          away: 'Mejor 3º A/E/H/I/J'   },
  { matchId: 83,  home: '2º Grupo K',          away: '2º Grupo L'            },
  { matchId: 84,  home: '1º Grupo H',          away: '2º Grupo J'            },
  { matchId: 85,  home: '1º Grupo B',          away: 'Mejor 3º E/F/G/I/J'   },
  { matchId: 86,  home: '1º Grupo J',          away: '2º Grupo H'            },
  { matchId: 87,  home: '1º Grupo K',          away: 'Mejor 3º D/E/I/J/L'   },
  { matchId: 88,  home: '2º Grupo D',          away: '2º Grupo G'            },
]

const R8_MATCHES = [
  { matchId: 89,  home: 'W74', away: 'W77' },
  { matchId: 90,  home: 'W73', away: 'W75' },
  { matchId: 91,  home: 'W76', away: 'W78' },
  { matchId: 92,  home: 'W79', away: 'W80' },
  { matchId: 93,  home: 'W83', away: 'W84' },
  { matchId: 94,  home: 'W81', away: 'W82' },
  { matchId: 95,  home: 'W86', away: 'W88' },
  { matchId: 96,  home: 'W85', away: 'W87' },
]

const QF_MATCHES = [
  { matchId: 97,  home: 'W89', away: 'W90' },
  { matchId: 98,  home: 'W91', away: 'W92' },
  { matchId: 99,  home: 'W93', away: 'W94' },
  { matchId: 100, home: 'W95', away: 'W96' },
]

const SF_MATCHES = [
  { matchId: 101, home: 'W97',  away: 'W98'  },
  { matchId: 102, home: 'W99',  away: 'W100' },
]

const FINAL = { matchId: 104, home: 'W101', away: 'W102' }
const THIRD = { matchId: 103, home: 'Per. SF-1', away: 'Per. SF-2' }

// Lookup por matchId
const R32_BY_ID = Object.fromEntries(R32_MATCHES.map(m => [m.matchId, m]))
const R8_BY_ID  = Object.fromEntries(R8_MATCHES.map(m => [m.matchId, m]))
const QF_BY_ID  = Object.fromEntries(QF_MATCHES.map(m => [m.matchId, m]))
const SF_BY_ID  = Object.fromEntries(SF_MATCHES.map(m => [m.matchId, m]))
const ALL_BY_ID = {
  ...R32_BY_ID, ...R8_BY_ID, ...QF_BY_ID, ...SF_BY_ID,
  [FINAL.matchId]: FINAL,
  [THIRD.matchId]: THIRD,
}

// Orden visual correcto del bracket R32 (pares alineados con R16)
// Pares: (74,77)→89, (73,75)→90, (76,78)→91, (79,80)→92
//        (83,84)→93, (81,82)→94, (86,88)→95, (85,87)→96
const R32_TREE_ORDER = [74, 77, 73, 75, 76, 78, 79, 80, 83, 84, 81, 82, 86, 88, 85, 87]

// ─── BracketSlot ─────────────────────────────────────────────────────────────
function BracketSlot({ matchId, home, away, resolvedHome, resolvedAway, isHighlight = false }) {
  const navigate   = useNavigate()
  const appMatch   = matchId ? MATCH_BY_ID[matchId] : null
  const isClickable = !!appMatch?.fixtureId

  function TeamRow({ staticLabel, resolved }) {
    if (resolved?.team) {
      const info = getTeamInfo(resolved.team)
      const dotCls = resolved.confirmed ? 'bg-green-500' : 'bg-yellow-400'
      return (
        <div className="flex items-center gap-1.5 px-2 py-[5px] border-t border-slate-700/40 min-w-0">
          {info.iso2
            ? <Flag iso2={info.iso2} size="xs" className="flex-shrink-0" />
            : <span className="w-5 h-3.5 bg-slate-600 rounded-sm flex-shrink-0" />}
          <span className="text-[11px] font-bold text-slate-100 flex-1 truncate">{info.code}</span>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} />
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 px-2 py-[5px] border-t border-slate-700/40 min-w-0">
        <span className="w-5 h-3.5 bg-slate-700/60 rounded-sm flex-shrink-0" />
        <span className="text-[10px] text-slate-500 flex-1 truncate">{staticLabel}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-700 flex-shrink-0" />
      </div>
    )
  }

  return (
    <div
      style={{ width: COL_W }}
      className={`rounded overflow-hidden border select-none transition-colors ${
        isHighlight
          ? 'border-amber-400/60 bg-amber-950/30'
          : 'border-slate-700 bg-slate-800'
      } ${isClickable ? 'cursor-pointer hover:border-sky-500/50' : ''}`}
      onClick={() => isClickable && navigate(`/partido/${appMatch.fixtureId}`)}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-1 px-2 pt-[3px] pb-[2px] bg-slate-700/30">
        <span className="text-[9px] font-mono text-slate-500 flex-shrink-0">#{matchId}</span>
        {appMatch && (
          <span className="text-[9px] text-slate-600 truncate">
            {fmtDate(appMatch.date)} · {appMatch.timeCol}
          </span>
        )}
      </div>
      {appMatch?.venue && (
        <div className="px-2 pb-[2px] text-[8px] text-slate-600/80 truncate leading-tight">
          {appMatch.venue}
        </div>
      )}
      <TeamRow staticLabel={home} resolved={resolvedHome} />
      <TeamRow staticLabel={away} resolved={resolvedAway} />
    </div>
  )
}

// ─── Conectores CSS entre columnas ───────────────────────────────────────────
// count = número de slots en la columna DERECHA (= pares de la columna izquierda)
function BracketConnectors({ count }) {
  const rowH = BRACKET_H / count
  return (
    <div className="flex-shrink-0 relative" style={{ width: CONN_W, height: BRACKET_H }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0"
          style={{ top: i * rowH, height: rowH }}
        >
          {/* mitad superior: borde inferior + borde derecho → forma ┐ */}
          <div
            className="absolute left-0 right-0 top-0"
            style={{
              height: '50%',
              borderBottom: '1px solid #334155',
              borderRight:  '1px solid #334155',
            }}
          />
          {/* mitad inferior: borde superior + borde derecho → forma ┘ */}
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{
              height: '50%',
              borderTop:   '1px solid #334155',
              borderRight: '1px solid #334155',
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Columna del árbol ────────────────────────────────────────────────────────
function BracketColumn({ ids, bracketByMatchId }) {
  return (
    <div
      className="flex-shrink-0 flex flex-col justify-around"
      style={{ height: BRACKET_H, width: COL_W }}
    >
      {ids.map(id => {
        const m        = ALL_BY_ID[id]
        const resolved = bracketByMatchId[id]
        if (!m) return null
        return (
          <BracketSlot
            key={id}
            matchId={id}
            home={m.home}
            away={m.away}
            resolvedHome={resolved?.home}
            resolvedAway={resolved?.away}
            isHighlight={id === 104}
          />
        )
      })}
    </div>
  )
}

// ─── Árbol desktop ───────────────────────────────────────────────────────────
function DesktopBracket({ bracketByMatchId, allGroupsComplete }) {
  return (
    <div className="overflow-x-auto pb-6">
      {/* Leyenda */}
      <div className="flex gap-4 mb-4 text-xs text-slate-500 items-center">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Confirmado (grupo cerrado)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
          Proyectado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-700 inline-block" />
          Por definir
        </span>
        <span className="ml-auto text-slate-600">
          {allGroupsComplete ? '🟢 Bracket confirmado' : '🟡 Proyectado desde standings actuales'}
        </span>
      </div>

      {/* Etiquetas de columnas */}
      <div className="flex items-end mb-2" style={{ gap: 0 }}>
        {[
          { label: 'Dieciseisavos', w: COL_W, sub: '28 jun – 3 jul' },
          { label: '',              w: CONN_W, sub: '' },
          { label: 'Octavos',       w: COL_W, sub: '4 – 7 jul' },
          { label: '',              w: CONN_W, sub: '' },
          { label: 'Cuartos',       w: COL_W, sub: '9 – 11 jul' },
          { label: '',              w: CONN_W, sub: '' },
          { label: 'Semifinales',   w: COL_W, sub: '14 – 15 jul' },
          { label: '',              w: CONN_W, sub: '' },
          { label: 'Final',         w: COL_W, sub: '19 jul' },
        ].map((col, i) => (
          <div key={i} className="flex-shrink-0 text-center" style={{ width: col.w }}>
            {col.label && (
              <>
                <div className="text-xs font-semibold text-slate-300">{col.label}</div>
                <div className="text-[10px] text-slate-600">{col.sub}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Árbol */}
      <div className="flex items-start" style={{ gap: 0 }}>
        {/* R32 */}
        <BracketColumn ids={R32_TREE_ORDER} bracketByMatchId={bracketByMatchId} />
        <BracketConnectors count={8} />

        {/* R16 */}
        <BracketColumn ids={[89, 90, 91, 92, 93, 94, 95, 96]} bracketByMatchId={bracketByMatchId} />
        <BracketConnectors count={4} />

        {/* QF */}
        <BracketColumn ids={[97, 98, 99, 100]} bracketByMatchId={bracketByMatchId} />
        <BracketConnectors count={2} />

        {/* SF */}
        <BracketColumn ids={[101, 102]} bracketByMatchId={bracketByMatchId} />
        <BracketConnectors count={1} />

        {/* Final */}
        <BracketColumn ids={[104]} bracketByMatchId={bracketByMatchId} />
      </div>

      {/* 3er Puesto — debajo del árbol */}
      <div className="mt-6 flex items-center gap-3">
        <span className="text-xs text-slate-500 font-semibold">3er Puesto · 18 jul</span>
        <BracketSlot
          matchId={103}
          home={THIRD.home}
          away={THIRD.away}
        />
      </div>
    </div>
  )
}

// ─── Vista móvil (tabs + tarjetas de enfrentamiento) ─────────────────────────
const MOBILE_PHASES = [
  { id: 'd32', label: 'Dieciseisavos', ids: [73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88] },
  { id: 'r8',  label: 'Octavos',       ids: [89,90,91,92,93,94,95,96] },
  { id: 'qf',  label: 'Cuartos',       ids: [97,98,99,100] },
  { id: 'sf',  label: 'Semis',         ids: [101,102] },
  { id: 'fin', label: 'Final',         ids: [104, 103] },
]

function MatchCard({ matchId, home, away, resolvedHome, resolvedAway, isHighlight = false }) {
  const navigate    = useNavigate()
  const appMatch    = matchId ? MATCH_BY_ID[matchId] : null
  const isClickable = !!appMatch?.fixtureId

  function TeamSide({ staticLabel, resolved }) {
    const info = resolved?.team ? getTeamInfo(resolved.team) : null
    const dotCls = !info
      ? 'bg-slate-700'
      : resolved.confirmed
        ? 'bg-green-500'
        : 'bg-yellow-400'
    const dotLabel = !info ? 'Por definir' : resolved.confirmed ? 'Confirmado' : 'Proyectado'

    return (
      <div className="flex flex-col items-center gap-1 flex-1 min-w-0 px-2">
        {/* Bandera */}
        <div className="w-9 h-6 rounded overflow-hidden flex items-center justify-center bg-slate-700/60">
          {info?.iso2
            ? <Flag iso2={info.iso2} size="sm" className="w-full h-full object-cover" />
            : <span className="text-slate-600 text-xs">?</span>}
        </div>
        {/* Código */}
        <span className={`text-sm font-black tracking-wide ${info ? 'text-slate-100' : 'text-slate-600'}`}>
          {info ? info.code : 'TBD'}
        </span>
        {/* Estado */}
        <span className="flex items-center gap-1 text-[9px] text-slate-500">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} />
          {dotLabel}
        </span>
        {/* Descripción estática (si no hay equipo resuelto) */}
        {!info && staticLabel && (
          <span className="text-[9px] text-slate-600 text-center leading-tight line-clamp-2 max-w-[80px]">
            {staticLabel}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl border transition-colors overflow-hidden ${
        isHighlight
          ? 'border-amber-400/50 bg-amber-950/30'
          : 'border-slate-700 bg-slate-800/80'
      } ${isClickable ? 'cursor-pointer active:scale-[0.98]' : ''}`}
      onClick={() => isClickable && navigate(`/partido/${appMatch.fixtureId}`)}
    >
      {/* Cabecera: fecha + estadio */}
      <div className="px-4 pt-3 pb-1 text-center border-b border-slate-700/40">
        {appMatch ? (
          <>
            <div className="text-xs font-semibold text-slate-300">
              {fmtDate(appMatch.date)}
              <span className="text-slate-500 font-normal"> · {appMatch.timeCol}</span>
            </div>
            {appMatch.venue && (
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{appMatch.venue}</div>
            )}
          </>
        ) : (
          <div className="text-xs text-slate-500">#{matchId}</div>
        )}
      </div>

      {/* Equipos */}
      <div className="flex items-center py-4 px-2">
        <TeamSide staticLabel={home} resolved={resolvedHome} />
        <div className="flex-shrink-0 px-1">
          <span className="text-lg font-black text-slate-600">vs</span>
        </div>
        <TeamSide staticLabel={away} resolved={resolvedAway} />
      </div>
    </div>
  )
}

function MobileBracket({ bracketByMatchId }) {
  const [activePhase, setActivePhase] = useState('d32')
  const phase = MOBILE_PHASES.find(p => p.id === activePhase)

  return (
    <div>
      {/* Tabs scrolleables */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {MOBILE_PHASES.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePhase(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all border ${
              activePhase === p.id
                ? 'bg-sky-500 text-white border-sky-500'
                : 'border-slate-700 text-slate-400 bg-slate-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Tarjetas de enfrentamiento */}
      <div className="flex flex-col gap-3">
        {phase?.ids.map(id => {
          const m        = ALL_BY_ID[id]
          const resolved = bracketByMatchId[id]
          if (!m) return null
          return (
            <MatchCard
              key={id}
              matchId={id}
              home={m.home}
              away={m.away}
              resolvedHome={resolved?.home}
              resolvedAway={resolved?.away}
              isHighlight={id === 104}
            />
          )
        })}
      </div>

      {/* Leyenda al pie */}
      <div className="flex gap-4 mt-5 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Confirmado</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />Proyectado</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-700" />Por definir</span>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
const _LIVE_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'PEN', 'LIVE'])

export default function Bracket() {
  const { matches: liveMatches } = useLiveMatches()

  const standingsInterval = useMemo(() => {
    const hasLive = liveMatches?.some(m => _LIVE_STATUSES.has(m.fixture?.status?.short))
    return hasLive ? 60_000 : 600_000
  }, [liveMatches])

  const { standings: rawStandings, loading } = useStandings(standingsInterval)

  const allGroups = useMemo(() => {
    if (!rawStandings?.length) return []
    return rawStandings[0]?.league?.standings ?? []
  }, [rawStandings])

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

  // matchId (73-88) → resolved bracket entry
  const bracketByMatchId = useMemo(() => {
    if (!bracketData?.matches) return {}
    return Object.fromEntries(
      bracketData.matches.map(m => [parseInt(m.id.replace('M', '')), m])
    )
  }, [bracketData])

  const allGroupsComplete = formattedStandings.length === 12 &&
    formattedStandings.every(g => (g.standings[0][2]?.all?.played ?? 0) >= 3)

  const showThirdsLink = !allGroupsComplete

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-3xl font-black text-white">Árbol de Llaves · Mundial 2026</h1>
        <p className="text-slate-400 mt-1 text-sm">
          48 equipos · 6 fases · 28 jun – 19 jul · MetLife Stadium, Nueva York
        </p>
      </div>

      {/* Info formato */}
      <div className="card p-4 mb-5">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
          <span>📌 <strong className="text-white">32 clasificados:</strong> 1° y 2° de cada grupo + 8 mejores terceros</span>
          <span>📌 <strong className="text-white">Dieciseisavos:</strong> Primera fase eliminatoria, nueva en 2026</span>
          <span>📌 <strong className="text-white">Final:</strong> 19 de julio, MetLife Stadium</span>
        </div>
      </div>

      {/* Link a terceros */}
      <div className="mb-6">
        <Link
          to="/terceros"
          className="text-sm text-sky-400 hover:text-sky-300 underline underline-offset-2"
        >
          {showThirdsLink
            ? 'Ver proyección de mejores terceros →'
            : 'Ver clasificación final de mejores terceros →'}
        </Link>
      </div>

      {loading && !bracketData ? (
        <LoadingSpinner text="Cargando standings..." />
      ) : (
        <>
          {/* Desktop: árbol horizontal */}
          <div className="hidden md:block">
            <DesktopBracket
              bracketByMatchId={bracketByMatchId}
              allGroupsComplete={allGroupsComplete}
            />
          </div>

          {/* Móvil: tabs */}
          <div className="md:hidden">
            <MobileBracket bracketByMatchId={bracketByMatchId} />
          </div>
        </>
      )}
    </div>
  )
}
