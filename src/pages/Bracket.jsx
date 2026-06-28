import { useState, useMemo, Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Flag from '../components/ui/Flag'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { GROUPS } from '../data/groups'
import { MATCHES } from '../data/matches'
import { useStandings, useLiveMatches } from '../hooks/useLiveData'
import { projectBracket } from '../utils/bracketProjector'

// ─── Constantes de layout desktop ────────────────────────────────────────────
// Árbol con posicionamiento absoluto: cada slot se posiciona en su centro exacto.
// SLOT_H es la altura del card. TREE_H = 8 × SLOT_H (total de los 8 slots de Octavos).
const SLOT_H  = 96    // altura de cada slot card (header+2 rows+padding = ~91px)
const TREE_H  = SLOT_H * 8  // = 768px — contenedor de cada columna del árbol
const COL_W   = 160   // ancho slot árbol desktop
const CONN_W  = 32    // ancho conector desktop

// ─── Constantes árbol móvil ───────────────────────────────────────────────────
const MOB_SLOT_W  = 76
const MOB_CONN_W  = 14
const MOB_TREE_H  = 512  // 8 slots × 64px

// ─── Lookup de equipos ────────────────────────────────────────────────────────
const CODE_TO_ISO2 = {}
GROUPS.forEach(g => g.teams.forEach(t => { CODE_TO_ISO2[t.code] = t.iso2 }))

const TEAM_INFO_MAP = {}
GROUPS.forEach(g => g.teams.forEach(t => {
  TEAM_INFO_MAP[t.name.toLowerCase()] = { code: t.code, iso2: t.iso2 }
}))

const EN_NAME_TO_CODE = {
  'korea republic': 'KOR', 'south korea': 'KOR',
  'saudi arabia': 'KSA',
  'ivory coast': 'CIV', "côte d'ivoire": 'CIV', "cote d'ivoire": 'CIV',
  'netherlands': 'NED', 'holland': 'NED',
  'united states': 'USA', 'usa': 'USA',
  'england': 'ENG',
  'bosnia': 'BIH', 'bosnia and herzegovina': 'BIH', 'bosnia & herzegovina': 'BIH',
  'new zealand': 'NZL',
  'cape verde': 'CPV', 'cape verde islands': 'CPV', 'cabo verde': 'CPV',
  'morocco': 'MAR', 'senegal': 'SEN', 'iraq': 'IRQ', 'norway': 'NOR',
  'algeria': 'ALG', 'austria': 'AUT', 'jordan': 'JOR',
  'dr congo': 'COD', 'democratic republic of congo': 'COD', 'congo dr': 'COD', 'dr. congo': 'COD',
  'uzbekistan': 'UZB', 'croatia': 'CRO', 'ghana': 'GHA',
  'panama': 'PAN', 'panamá': 'PAN',
  'mexico': 'MEX', 'méxico': 'MEX',
  'south africa': 'RSA', 'czech republic': 'CZE', 'czechia': 'CZE',
  'canada': 'CAN', 'qatar': 'QAT', 'switzerland': 'SUI', 'brazil': 'BRA',
  'haiti': 'HAI', 'scotland': 'SCO', 'germany': 'GER',
  'curacao': 'CUW', 'curaçao': 'CUW',
  'ecuador': 'ECU', 'japan': 'JPN', 'sweden': 'SWE', 'tunisia': 'TUN',
  'belgium': 'BEL', 'egypt': 'EGY', 'iran': 'IRN', 'spain': 'ESP',
  'uruguay': 'URU', 'france': 'FRA', 'paraguay': 'PAR', 'australia': 'AUS',
  'turkey': 'TUR', 'türkiye': 'TUR', 'argentina': 'ARG',
  'colombia': 'COL', 'portugal': 'POR',
}

function getTeamInfo(team) {
  if (!team?.name) return { code: 'TBD', iso2: null }
  const key = team.name.toLowerCase()
  const byEs = TEAM_INFO_MAP[key]
  if (byEs) return byEs
  const code = EN_NAME_TO_CODE[key]
  if (code) return { code, iso2: CODE_TO_ISO2[code] ?? null }
  const fallback = team.name.slice(0, 3).toUpperCase()
  return { code: fallback, iso2: CODE_TO_ISO2[fallback] ?? null }
}

// ─── Helper fecha ──────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return ''
  const p = iso.split('-')
  const mo = ['','ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${parseInt(p[2])} ${mo[parseInt(p[1])] ?? p[1]}`
}

// ─── Datos de fases ───────────────────────────────────────────────────────────
// R32_MATCHES lee de matches.js para mostrar equipos reales como fallback
const R32_MATCHES = MATCHES
  .filter(m => m.group === 'R32')
  .map(m => ({ matchId: m.id, home: m.homeTeam, away: m.awayTeam }))
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

const R32_BY_ID = Object.fromEntries(R32_MATCHES.map(m => [m.matchId, m]))
const R8_BY_ID  = Object.fromEntries(R8_MATCHES.map(m => [m.matchId, m]))
const QF_BY_ID  = Object.fromEntries(QF_MATCHES.map(m => [m.matchId, m]))
const SF_BY_ID  = Object.fromEntries(SF_MATCHES.map(m => [m.matchId, m]))
const ALL_BY_ID = {
  ...R32_BY_ID, ...R8_BY_ID, ...QF_BY_ID, ...SF_BY_ID,
  [FINAL.matchId]: FINAL,
  [THIRD.matchId]: THIRD,
}

const MATCH_BY_ID = Object.fromEntries(MATCHES.map(m => [m.id, m]))

const D32_IDS = [73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88]

// ─── MatchCard — tarjeta cara a cara (lista de R32) ─────────────────────────
function MatchCard({ matchId, home, away, resolvedHome, resolvedAway }) {
  const navigate    = useNavigate()
  const appMatch    = matchId ? MATCH_BY_ID[matchId] : null
  const isClickable = !!appMatch?.fixtureId

  function TeamSide({ staticLabel, resolved }) {
    const info = resolved?.team ? getTeamInfo(resolved.team) : null
    const dotCls = !info ? 'bg-slate-700' : 'bg-green-500'
    const dotLabel = !info ? 'Por definir' : 'Confirmado'
    return (
      <div className="flex flex-col items-center gap-1 flex-1 min-w-0 px-2">
        <div className="w-9 h-6 rounded overflow-hidden flex items-center justify-center bg-slate-700/60">
          {info?.iso2
            ? <Flag iso2={info.iso2} size="sm" className="w-full h-full object-cover" />
            : <span className="text-slate-600 text-xs">?</span>}
        </div>
        <span className={`text-sm font-black tracking-wide ${info ? 'text-slate-100' : 'text-slate-600'}`}>
          {info ? info.code : 'TBD'}
        </span>
        <span className="flex items-center gap-1 text-[9px] text-slate-500">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} />
          {dotLabel}
        </span>
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
        isClickable ? 'border-slate-600 bg-slate-800/80 cursor-pointer hover:border-sky-500/60 active:scale-[0.98]' : 'border-slate-700 bg-slate-800/80'
      }`}
      onClick={() => isClickable && navigate(`/partido/${appMatch.fixtureId}`)}
    >
      <div className="px-4 pt-3 pb-2 border-b border-slate-700/40 flex items-start gap-2">
        <span className="text-[10px] font-mono text-slate-500 flex-shrink-0 mt-0.5">#{matchId}</span>
        <div className="flex-1 text-center min-w-0">
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
          ) : null}
        </div>
      </div>
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

// ─── BracketSlot — slot compacto para el árbol desktop ───────────────────────
function BracketSlot({ matchId, home, away, resolvedHome, resolvedAway, isHighlight = false }) {
  const navigate    = useNavigate()
  const appMatch    = matchId ? MATCH_BY_ID[matchId] : null
  const isClickable = !!appMatch?.fixtureId

  function TeamRow({ staticLabel, resolved }) {
    if (resolved?.team) {
      const info   = getTeamInfo(resolved.team)
      const dotCls = 'bg-green-500'
      return (
        <div className="flex items-center gap-1.5 px-2 py-2 border-t border-slate-700 min-w-0">
          {info.iso2
            ? <Flag iso2={info.iso2} size="xs" className="flex-shrink-0" />
            : <span className="w-5 h-3.5 bg-slate-600 rounded-sm flex-shrink-0" />}
          <span className="text-[11px] font-bold text-slate-100 flex-1 truncate">{info.code}</span>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} />
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 px-2 py-2 border-t border-slate-700 min-w-0">
        <span className="w-5 h-3.5 bg-slate-700/60 rounded-sm flex-shrink-0" />
        <span className="text-[10px] text-slate-500 flex-1 truncate">{staticLabel}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-700 flex-shrink-0" />
      </div>
    )
  }

  return (
    <div
      style={{ width: COL_W }}
      className={`rounded-lg overflow-hidden border select-none transition-colors ${
        isHighlight ? 'border-amber-400/60 bg-amber-950/30' : 'border-slate-700 bg-slate-800'
      } ${isClickable ? 'cursor-pointer hover:border-sky-500/50' : ''}`}
      onClick={() => isClickable && navigate(`/partido/${appMatch.fixtureId}`)}
    >
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

// ─── Árbol desktop Fase Final — posicionamiento absoluto ─────────────────────
//
// Cada slot se posiciona calculando su centro exacto:
//   Oct slot i  → center = i × SLOT_H + SLOT_H/2
//   QF  slot j  → center = avg(oct[2j].center, oct[2j+1].center)
//   SF  slot k  → center = avg(qf[2k].center,  qf[2k+1].center)
//   Final       → center = avg(sf[0].center,    sf[1].center)
//
// Conectores: 4 líneas absolutas por par (arm arriba, arm abajo, vertical, output).
function DesktopFinalTree({ bracketByMatchId }) {
  const half = SLOT_H / 2

  // Posiciones absolutas de cada slot (top = center - half)
  const oct = [89,90,91,92,93,94,95,96].map((id, i) => ({
    id, center: i * SLOT_H + half,
  }))
  const qf = [97,98,99,100].map((id, j) => {
    const c = (oct[2*j].center + oct[2*j+1].center) / 2
    return { id, center: c }
  })
  const sf = [101,102].map((id, k) => {
    const c = (qf[2*k].center + qf[2*k+1].center) / 2
    return { id, center: c }
  })
  const finalC = (sf[0].center + sf[1].center) / 2

  // Pares de conectores: { topY, botY, midY }
  const connOctQF = qf.map((q, j) => ({ topY: oct[2*j].center, botY: oct[2*j+1].center, midY: q.center }))
  const connQFSF  = sf.map((s, k)  => ({ topY: qf[2*k].center,  botY: qf[2*k+1].center,  midY: s.center }))
  const connSFFin = { topY: sf[0].center, botY: sf[1].center, midY: finalC }

  // Renderiza una columna con posicionamiento absoluto
  function Col({ slots }) {
    return (
      <div className="flex-shrink-0 relative" style={{ width: COL_W, height: TREE_H }}>
        {slots.map(({ id, center }) => {
          const m = ALL_BY_ID[id], resolved = bracketByMatchId[id]
          if (!m) return null
          return (
            <div key={id} className="absolute" style={{ top: center - half, left: 0, right: 0 }}>
              <BracketSlot matchId={id} home={m.home} away={m.away}
                resolvedHome={resolved?.home} resolvedAway={resolved?.away}
                isHighlight={id === 104}
              />
            </div>
          )
        })}
      </div>
    )
  }

  // Renderiza un grupo de conectores (arm top, arm bot, vertical, output)
  const MID_X = CONN_W / 2
  function Conn({ pairs }) {
    return (
      <div className="flex-shrink-0 relative" style={{ width: CONN_W, height: TREE_H }}>
        {pairs.map(({ topY, botY, midY }, i) => (
          <Fragment key={i}>
            {/* arm desde slot superior */}
            <div className="absolute bg-slate-600" style={{ left: 0,     top: topY,  width: MID_X, height: 1 }} />
            {/* arm desde slot inferior */}
            <div className="absolute bg-slate-600" style={{ left: 0,     top: botY,  width: MID_X, height: 1 }} />
            {/* vertical entre los dos arms */}
            <div className="absolute bg-slate-600" style={{ left: MID_X, top: topY,  width: 1,     height: botY - topY + 1 }} />
            {/* output horizontal hacia columna derecha */}
            <div className="absolute bg-slate-600" style={{ left: MID_X, top: midY,  width: MID_X, height: 1 }} />
          </Fragment>
        ))}
      </div>
    )
  }

  const LABELS = [
    { label: 'Octavos',     sub: '4 – 7 jul'   },
    { label: 'Cuartos',     sub: '9 – 11 jul'  },
    { label: 'Semifinales', sub: '14 – 15 jul' },
    { label: 'Final',       sub: '19 jul'       },
  ]

  return (
    <div className="overflow-x-auto pb-4">
      {/* Cabeceras */}
      <div className="flex mb-2" style={{ gap: 0 }}>
        {LABELS.map((l, i) => (
          <Fragment key={i}>
            <div className="flex-shrink-0 text-center" style={{ width: COL_W }}>
              <div className="text-xs font-semibold text-slate-300">{l.label}</div>
              <div className="text-[10px] text-slate-600">{l.sub}</div>
            </div>
            {i < LABELS.length - 1 && <div style={{ width: CONN_W }} />}
          </Fragment>
        ))}
      </div>

      {/* Árbol */}
      <div className="flex items-start" style={{ gap: 0 }}>
        <Col slots={oct} />
        <Conn pairs={connOctQF} />
        <Col slots={qf} />
        <Conn pairs={connQFSF} />
        <Col slots={sf} />
        <Conn pairs={[connSFFin]} />
        {/* Final: 1 slot centrado en TREE_H */}
        <div className="flex-shrink-0 relative" style={{ width: COL_W, height: TREE_H }}>
          <div className="absolute" style={{ top: finalC - half, left: 0, right: 0 }}>
            <BracketSlot matchId={104} home={FINAL.home} away={FINAL.away}
              resolvedHome={bracketByMatchId[104]?.home} resolvedAway={bracketByMatchId[104]?.away}
              isHighlight
            />
          </div>
        </div>
      </div>

      {/* 3er Puesto */}
      <div className="mt-6 flex items-center gap-3">
        <span className="text-xs text-slate-500 font-semibold">3er Puesto · 18 jul</span>
        <BracketSlot matchId={103} home={THIRD.home} away={THIRD.away}
          resolvedHome={bracketByMatchId[103]?.home} resolvedAway={bracketByMatchId[103]?.away}
        />
      </div>
    </div>
  )
}

// ─── TreeSlot — slot compacto árbol móvil ────────────────────────────────────
function TreeSlot({ matchId, home, away, resolvedHome, resolvedAway, isHighlight = false }) {
  const navigate    = useNavigate()
  const appMatch    = matchId ? MATCH_BY_ID[matchId] : null
  const isClickable = !!appMatch?.fixtureId

  function TRow({ resolved }) {
    const info   = resolved?.team ? getTeamInfo(resolved.team) : null
    const dotCls = !info ? 'bg-slate-700' : resolved.confirmed ? 'bg-green-500' : 'bg-yellow-400'
    return (
      <div className="flex items-center gap-0.5 px-1 py-[3px] border-t border-slate-700/40">
        {info?.iso2
          ? <Flag iso2={info.iso2} size="xs" className="flex-shrink-0 !w-4 !h-2.5" />
          : <span className="w-4 h-2.5 bg-slate-700/60 rounded-sm flex-shrink-0" />}
        <span className={`text-[9px] font-bold flex-1 truncate leading-none ${info ? 'text-slate-100' : 'text-slate-600'}`}>
          {info ? info.code : 'TBD'}
        </span>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} />
      </div>
    )
  }

  return (
    <div
      style={{ width: MOB_SLOT_W }}
      className={`rounded overflow-hidden border select-none ${
        isHighlight ? 'border-amber-400/50 bg-amber-950/30' : 'border-slate-700 bg-slate-800'
      } ${isClickable ? 'cursor-pointer' : ''}`}
      onClick={() => isClickable && navigate(`/partido/${appMatch.fixtureId}`)}
    >
      <div className="text-[8px] text-slate-500 text-center px-1 py-[2px] bg-slate-700/30 truncate leading-tight">
        {appMatch ? fmtDate(appMatch.date) : `#${matchId}`}
      </div>
      <TRow resolved={resolvedHome} />
      <TRow resolved={resolvedAway} />
    </div>
  )
}

// ─── Conectores árbol móvil ───────────────────────────────────────────────────
function MobTreeConnectors({ count }) {
  const rowH = MOB_TREE_H / count
  return (
    <div className="flex-shrink-0 relative" style={{ width: MOB_CONN_W, height: MOB_TREE_H }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="absolute left-0 right-0" style={{ top: i * rowH, height: rowH }}>
          <div className="absolute left-0 right-0 top-0" style={{ height: '50%', borderBottom: '1px solid #334155', borderRight: '1px solid #334155' }} />
          <div className="absolute left-0 right-0 bottom-0" style={{ height: '50%', borderTop: '1px solid #334155', borderRight: '1px solid #334155' }} />
        </div>
      ))}
    </div>
  )
}

// ─── Árbol móvil Fase Final (horizontal-scroll) ───────────────────────────────
function MobileFinalTree({ bracketByMatchId }) {
  const COLS = [
    { label: 'Octavos', sub: '4–7 jul',   ids: [89,90,91,92,93,94,95,96], connCount: 4 },
    { label: 'Cuartos', sub: '9–11 jul',  ids: [97,98,99,100],            connCount: 2 },
    { label: 'Semis',   sub: '14–15 jul', ids: [101,102],                 connCount: 1 },
    { label: 'Final',   sub: '19 jul',    ids: [104],                     connCount: null },
  ]

  return (
    <div className="overflow-x-auto">
      {/* Cabeceras */}
      <div className="flex mb-2" style={{ gap: 0 }}>
        {COLS.map((col, i) => (
          <Fragment key={i}>
            <div className="flex-shrink-0 text-center" style={{ width: MOB_SLOT_W }}>
              <div className="text-[10px] font-semibold text-slate-300">{col.label}</div>
              <div className="text-[8px] text-slate-600">{col.sub}</div>
            </div>
            {col.connCount && <div style={{ width: MOB_CONN_W }} />}
          </Fragment>
        ))}
      </div>

      {/* Árbol */}
      <div className="flex" style={{ height: MOB_TREE_H }}>
        {COLS.map((col, i) => (
          <Fragment key={i}>
            <div className="flex-shrink-0 flex flex-col justify-around" style={{ width: MOB_SLOT_W, height: MOB_TREE_H }}>
              {col.ids.map(id => {
                const m = ALL_BY_ID[id], resolved = bracketByMatchId[id]
                if (!m) return null
                return (
                  <TreeSlot key={id} matchId={id} home={m.home} away={m.away}
                    resolvedHome={resolved?.home} resolvedAway={resolved?.away}
                    isHighlight={id === 104}
                  />
                )
              })}
            </div>
            {col.connCount && <MobTreeConnectors count={col.connCount} />}
          </Fragment>
        ))}
      </div>

      {/* 3er puesto */}
      <div className="flex items-center gap-2 mt-4">
        <span className="text-[10px] text-slate-500 font-semibold flex-shrink-0">3er lugar · 18 jul</span>
        <TreeSlot matchId={103} home={THIRD.home} away={THIRD.away}
          resolvedHome={bracketByMatchId[103]?.home} resolvedAway={bracketByMatchId[103]?.away}
        />
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
const _LIVE_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'PEN', 'LIVE'])

export default function Bracket() {
  const [tab, setTab] = useState('d32')
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

  const bracketByMatchId = useMemo(() => {
    if (!bracketData?.matches) return {}
    return Object.fromEntries(
      bracketData.matches.map(m => [parseInt(m.id.replace('M', '')), m])
    )
  }, [bracketData])

  const allGroupsComplete = formattedStandings.length === 12 &&
    formattedStandings.every(g => (g.standings[0][2]?.all?.played ?? 0) >= 3)

  const TABS = [
    { id: 'd32',   label: 'Dieciseisavos' },
    { id: 'final', label: 'Fase Final'    },
  ]

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

      {/* Link a mejores terceros */}
      <div className="mb-5">
        <Link to="/terceros" className="text-sm text-sky-400 hover:text-sky-300 underline underline-offset-2">
          {allGroupsComplete
            ? 'Ver clasificación final de mejores terceros →'
            : 'Ver proyección de mejores terceros →'}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
              tab === t.id
                ? 'bg-sky-500 text-white border-sky-500'
                : 'border-slate-700 text-slate-400 bg-slate-800 hover:border-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
        {tab === 'd32' && (
          <span className="ml-auto self-center text-xs text-slate-600">
            {allGroupsComplete ? '🟢 Bracket confirmado' : '🟡 Proyectado'}
          </span>
        )}
      </div>

      {loading && !bracketData ? (
        <LoadingSpinner text="Cargando standings..." />
      ) : (
        <>
          {/* TAB 1 — Dieciseisavos: lista 2 columnas desktop / 1 móvil */}
          {tab === 'd32' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {D32_IDS.map(id => {
                  const m = ALL_BY_ID[id]
                  if (!m) return null
                  const appMatch = MATCH_BY_ID[id]
                  const isConfirmed = appMatch?.homeTeam && appMatch.homeTeam !== 'TBD'
                                   && appMatch?.awayTeam && appMatch.awayTeam !== 'TBD'
                  const resolved = isConfirmed
                    ? {
                        home: { team: { name: appMatch.homeTeam }, confirmed: true, position: '' },
                        away: { team: { name: appMatch.awayTeam }, confirmed: true, position: '' }
                      }
                    : bracketByMatchId[id]
                  return (
                    <MatchCard key={id} matchId={id} home={m.home} away={m.away}
                      resolvedHome={resolved?.home} resolvedAway={resolved?.away}
                    />
                  )
                })}
              </div>
              <div className="flex gap-5 mt-5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />Confirmado</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" />Proyectado</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-700" />Por definir</span>
              </div>
            </div>
          )}

          {/* TAB 2 — Fase Final: árbol */}
          {tab === 'final' && (
            <>
              {/* Desktop: árbol horizontal con alturas fijas */}
              <div className="hidden md:block">
                <DesktopFinalTree bracketByMatchId={bracketByMatchId} />
              </div>
              {/* Móvil: árbol horizontal compacto con scroll */}
              <div className="md:hidden">
                <MobileFinalTree bracketByMatchId={bracketByMatchId} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
