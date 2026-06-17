import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { GROUPS } from '../data/groups'
import { sortTeams, getConfederationColor } from '../utils/helpers'
import Flag from '../components/ui/Flag'
import { MATCHES, getMatchesByGroup } from '../data/matches'
import { getResult, saveResult } from '../data/matchResults'
import { getFixtureMap } from '../data/fixtureMap'
import { useLiveScoresMap } from '../hooks/useLiveData'

function computeGroupStandings(teams, matches, liveScoresMap = {}) {
  const stats = {}
  teams.forEach(t => {
    stats[t.code] = { ...t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, isLive: false }
  })
  for (const m of matches) {
    const finished = getResult(m.id)
    const live     = liveScoresMap[m.id]
    const score    = finished ?? live
    if (!score) continue
    const h = stats[m.homeTeam]
    const a = stats[m.awayTeam]
    if (!h || !a) continue
    h.played++; a.played++
    h.gf += score.homeScore; h.ga += score.awayScore
    a.gf += score.awayScore; a.ga += score.homeScore
    h.gd = h.gf - h.ga; a.gd = a.gf - a.ga
    if (score.homeScore > score.awayScore)        { h.won++;   h.points += 3; a.lost++ }
    else if (score.homeScore === score.awayScore) { h.drawn++; h.points++;    a.drawn++; a.points++ }
    else                                          { h.lost++;  a.won++;       a.points += 3 }
    if (live && !finished) { h.isLive = true; a.isLive = true }
  }
  return teams.map(t => stats[t.code])
}

function GroupTable({ group, liveScoresMap }) {
  const groupMatches = getMatchesByGroup(group.id)
  const sorted = sortTeams(computeGroupStandings(group.teams, groupMatches, liveScoresMap))
  const hasLive = groupMatches.some(m => liveScoresMap[m.id])

  return (
    <Link to={`/grupos/${group.id}`} className="card-hover block">
      {/* Group header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50"
        style={{ backgroundColor: '#162032' }}>
        <span className="badge-group">{group.id}</span>
        <h3 className="font-bold text-white">Grupo {group.id}</h3>
        {hasLive && (
          <span className="flex items-center gap-1 ml-auto text-xs font-bold text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            EN VIVO
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 uppercase tracking-wider text-[10px]"
              style={{ backgroundColor: '#162032' }}>
              <th className="text-left px-4 py-2 font-semibold w-6">#</th>
              <th className="text-left px-4 py-2 font-semibold">Selección</th>
              <th className="py-2 font-semibold text-center">PJ</th>
              <th className="py-2 font-semibold text-center">G</th>
              <th className="py-2 font-semibold text-center">E</th>
              <th className="py-2 font-semibold text-center">P</th>
              <th className="py-2 font-semibold text-center">DG</th>
              <th className="py-2 pr-4 font-semibold text-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, idx) => {
              const qualified = idx < 2
              const borderColor =
                idx === 0 ? 'border-l-sky-400' :
                idx === 1 ? 'border-l-sky-600' :
                idx === 2 ? 'border-l-amber-400 opacity-60' :
                'border-l-transparent opacity-50'
              const rowBg = idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-800/20'

              return (
                <tr key={team.code}
                  className={`border-l-2 ${borderColor} ${rowBg} hover:bg-slate-700/30 transition-colors`}>
                  <td className="pl-3 pr-2 py-2.5 font-bold text-sky-400">{idx + 1}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Flag iso2={team.iso2} size="xs" />
                      <span className={`font-medium truncate max-w-[100px] ${qualified ? 'text-white' : 'text-slate-400'}`}>
                        {team.name}
                      </span>
                      {team.isLive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 text-center text-slate-400">{team.played}</td>
                  <td className="py-2.5 text-center text-slate-400">{team.won}</td>
                  <td className="py-2.5 text-center text-slate-400">{team.drawn}</td>
                  <td className="py-2.5 text-center text-slate-400">{team.lost}</td>
                  <td className="py-2.5 text-center text-slate-400">
                    {team.gd > 0 ? `+${team.gd}` : team.gd}
                  </td>
                  <td className="py-2.5 pr-4 text-center font-black text-sky-400">{team.points}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 flex items-center gap-4 border-t border-slate-700/30">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
          <span className="text-xs text-slate-500">Clasifican</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span className="text-xs text-slate-500">Posible 3°</span>
        </div>
      </div>
    </Link>
  )
}

export default function Groups() {
  const liveScoresMap = useLiveScoresMap(MATCHES)
  const [refreshKey, setRefreshKey] = useState(0)

  // Polling 60s: detectar partidos FT del día y guardar resultado en localStorage
  useEffect(() => {
    const FT_SET = new Set(['FT', 'AET', 'PEN'])
    async function fetchPartidos() {
      try {
        const hoyCol = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
        const res = await fetch(`/api/football?endpoint=/fixtures&date=${hoyCol}&league=1&season=2026`)
        if (!res.ok) return
        const json = await res.json()
        const fMap = await getFixtureMap()
        const inv = {}
        for (const [a, b] of Object.entries(fMap)) inv[b] = Number(a)
        let changed = false
        for (const f of json.response || []) {
          if (FT_SET.has(f.fixture?.status?.short)) {
            const appId = inv[f.fixture.id]
            if (appId && !getResult(appId)) {
              saveResult(appId, f.goals?.home ?? 0, f.goals?.away ?? 0)
              changed = true
            }
          }
        }
        if (changed) setRefreshKey(k => k + 1)
      } catch {}
    }
    fetchPartidos()
    const id = setInterval(fetchPartidos, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="animate-slide-up">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Grupos · Mundial 2026</h1>
        <p className="text-slate-400 mt-1">
          48 selecciones en 12 grupos. Los 2 primeros de cada grupo clasifican a octavos.
          Los 8 mejores terceros también avanzan.
        </p>
      </div>

      {/* Groups grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {GROUPS.map(group => (
          <GroupTable key={group.id} group={group} liveScoresMap={liveScoresMap} />
        ))}
      </div>

      {/* Confederation legend */}
      <div className="mt-8 card p-5">
        <h3 className="font-semibold text-white mb-4">Confederaciones</h3>
        <div className="flex flex-wrap gap-3">
          {['UEFA','CONMEBOL','CONCACAF','CAF','AFC','OFC'].map(conf => {
            const count = GROUPS.flatMap(g => g.teams).filter(t => t.confederation === conf).length
            return (
              <div key={conf} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${getConfederationColor(conf)}`}>
                <span>{conf}</span>
                <span className="opacity-60">({count})</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
