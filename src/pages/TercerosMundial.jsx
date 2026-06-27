import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStandings, useLiveMatches } from '../hooks/useLiveData'
import { rankThirdPlaceTeams } from '../utils/thirdPlaceRanking'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { esTeamName } from '../data/teamNames'

const _LIVE = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'PEN', 'LIVE'])

export default function TercerosMundial() {
  const { matches: liveMatches } = useLiveMatches()

  const interval = useMemo(() => {
    return liveMatches?.some(m => _LIVE.has(m.fixture?.status?.short)) ? 60_000 : 600_000
  }, [liveMatches])

  const { standings: rawStandings, loading } = useStandings(interval)

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

  const thirdPlaceData = useMemo(() => {
    if (!formattedStandings.length) return null
    try { return rankThirdPlaceTeams(formattedStandings) } catch { return null }
  }, [formattedStandings])

  const allGroupsComplete = formattedStandings.length === 12 &&
    formattedStandings.every(g => (g.standings[0][2]?.all?.played ?? 0) >= 3)

  return (
    <div className="animate-slide-up max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/llaves" className="text-slate-400 hover:text-white text-sm">← Bracket</Link>
        <span className="text-slate-600">·</span>
        <h1 className="text-2xl font-black text-white">Mejores Terceros — Mundial 2026</h1>
      </div>

      <div className="card p-5">
        <p className="text-xs text-slate-500 mb-5">
          Los 8 mejores terceros de los 12 grupos avanzan a Dieciseisavos. Se ordenan por puntos,
          diferencia de goles y goles a favor según criterios FIFA.
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
                          !isQualified
                            ? 'border-b border-slate-700/30 opacity-40'
                            : isBorderline
                              ? 'border-b border-yellow-500/30 bg-yellow-900/20'
                              : 'border-b border-slate-700/30 hover:bg-slate-700/20'
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
            <p className="text-xs text-slate-600 mt-4">
              {allGroupsComplete
                ? '✅ Clasificación final de la fase de grupos.'
                : '⚠️ Proyección en tiempo real — se actualiza conforme avanzan los grupos.'}
            </p>
          </>
        ) : (
          <p className="text-xs text-slate-500 text-center py-8">
            Se actualizará automáticamente cuando inicien los partidos de grupos.
          </p>
        )}
      </div>
    </div>
  )
}
