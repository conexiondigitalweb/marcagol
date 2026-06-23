import { GROUPS } from '../data/groups'
import { TEAM_IDS } from '../data/teamIds'

const _CODE_ALIAS = { RSA: 'ZAF', HAI: 'HTI', PAR: 'PRY' }
const FIFA_RANKING_BY_TEAM_ID = new Map(
  GROUPS.flatMap(g => g.teams).flatMap(t => {
    const apiId = TEAM_IDS[_CODE_ALIAS[t.code] ?? t.code]
    return apiId !== undefined ? [[apiId, t.fifaRanking]] : []
  })
)

export function rankThirdPlaceTeams(standings) {
  // standings: array de objetos de la API-Football standings
  // Extraer el 3er clasificado de cada grupo
  // standings tiene forma: [{ group: 'Group A', standings: [[1º],[2º],[3º],[4º]] }]

  const thirds = []

  for (const groupData of standings) {
    const groupLetter = groupData.group.replace('Group ', '')
    const teamsInGroup = groupData.standings[0]
    const thirdTeam = teamsInGroup.find(t => t.rank === 3)
      ?? [...teamsInGroup].sort((a, b) => a.rank - b.rank)[2]
    if (!thirdTeam) continue

    thirds.push({
      group: groupLetter,
      teamId: thirdTeam.team.id,
      teamName: thirdTeam.team.name,
      played: thirdTeam.all.played,
      points: thirdTeam.points,
      goalDiff: thirdTeam.goalsDiff,
      goalsFor: thirdTeam.all.goals.for,
      // fairPlay no viene de API-Football — lo dejamos en 0 por ahora
      fairPlay: 0,
      fifaRanking: FIFA_RANKING_BY_TEAM_ID.get(thirdTeam.team.id) ?? 999,
    })
  }

  // Ordenar por los 5 criterios FIFA para terceros
  thirds.sort((a, b) => {
    // 1. Puntos
    if (b.points !== a.points) return b.points - a.points
    // 2. Diferencia de gol
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
    // 3. Goles anotados
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    // 4. Fair play (menor tarjetas = mejor — aquí 0 para todos por ahora)
    if (b.fairPlay !== a.fairPlay) return a.fairPlay - b.fairPlay
    // 5. Ranking FIFA (menor número = mejor posición)
    return a.fifaRanking - b.fifaRanking
  })

  return {
    ranked: thirds,              // todos los 12 ordenados
    qualified: thirds.slice(0, 8),   // los 8 que clasifican
    eliminated: thirds.slice(8),     // los 4 eliminados
  }
}
