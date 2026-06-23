import { rankThirdPlaceTeams } from './thirdPlaceRanking'
import { getBracketCombination } from '../data/bracketCombinations'

// Los 16 cruces del Round of 32 (estructura fija)
// Los que no involucran terceros son fijos
export const FIXED_MATCHES = [
  { id: 'M73', home: { source: 'runner_up', group: 'A' }, away: { source: 'runner_up', group: 'B' } },
  { id: 'M74', home: { source: 'winner', group: 'E' }, away: { source: 'third', groups: ['A','B','C','D','F'] } },
  { id: 'M75', home: { source: 'winner', group: 'F' }, away: { source: 'runner_up', group: 'C' } },
  { id: 'M76', home: { source: 'winner', group: 'C' }, away: { source: 'runner_up', group: 'F' } },
  { id: 'M77', home: { source: 'winner', group: 'I' }, away: { source: 'third', groups: ['C','D','F','G','H'] } },
  { id: 'M78', home: { source: 'runner_up', group: 'E' }, away: { source: 'runner_up', group: 'I' } },
  { id: 'M79', home: { source: 'winner', group: 'A' }, away: { source: 'third', groups: ['C','E','F','H','I'] } },
  { id: 'M80', home: { source: 'winner', group: 'L' }, away: { source: 'third', groups: ['E','H','I','J','K'] } },
  { id: 'M81', home: { source: 'winner', group: 'D' }, away: { source: 'third', groups: ['B','E','F','I','J'] } },
  { id: 'M82', home: { source: 'winner', group: 'G' }, away: { source: 'third', groups: ['A','E','H','I','J'] } },
  { id: 'M83', home: { source: 'runner_up', group: 'K' }, away: { source: 'runner_up', group: 'L' } },
  { id: 'M84', home: { source: 'winner', group: 'H' }, away: { source: 'runner_up', group: 'J' } },
  { id: 'M85', home: { source: 'winner', group: 'B' }, away: { source: 'third', groups: ['E','F','G','I','J'] } },
  { id: 'M86', home: { source: 'winner', group: 'J' }, away: { source: 'runner_up', group: 'H' } },
  { id: 'M87', home: { source: 'winner', group: 'K' }, away: { source: 'third', groups: ['D','E','I','J','L'] } },
  { id: 'M88', home: { source: 'runner_up', group: 'D' }, away: { source: 'runner_up', group: 'G' } },
]

export function projectBracket(standings) {
  if (!standings || standings.length === 0) return null

  // 1. Extraer 1º y 2º de cada grupo
  const groupPositions = {}
  for (const groupData of standings) {
    const letter = groupData.group.replace('Group ', '')
    const teams = groupData.standings[0]
    groupPositions[letter] = {
      winner:   teams[0],
      runnerUp: teams[1],
      third:    teams[2],
      fourth:   teams[3],
    }
  }

  // 2. Rankear terceros
  const { qualified, ranked } = rankThirdPlaceTeams(standings)
  const qualifiedGroups = qualified.map(t => t.group)

  // 3. Obtener combinación de bracket
  const combination = getBracketCombination(qualifiedGroups)

  // 4. Resolver cada cruce
  const resolvedMatches = FIXED_MATCHES.map(match => {
    const resolveTeam = (slot) => {
      if (slot.source === 'winner') {
        return {
          team:      groupPositions[slot.group]?.winner?.team,
          position:  '1º',
          group:     slot.group,
          confirmed: groupPositions[slot.group]?.winner?.all?.played === 3,
        }
      }
      if (slot.source === 'runner_up') {
        return {
          team:      groupPositions[slot.group]?.runnerUp?.team,
          position:  '2º',
          group:     slot.group,
          confirmed: groupPositions[slot.group]?.runnerUp?.all?.played === 3,
        }
      }
      if (slot.source === 'third') {
        // Usar combinación FIFA para saber qué tercero va aquí
        // El grupo del campeón que juega este partido determina qué tercero le asigna el reglamento
        const winnerGroup = match.home.group
        const assignedThirdGroup = combination?.[winnerGroup]
        const thirdTeam = ranked.find(t => t.group === assignedThirdGroup)
        return {
          team:             thirdTeam ? { id: thirdTeam.teamId, name: thirdTeam.teamName } : null,
          position:         '3º',
          group:            assignedThirdGroup || '?',
          confirmed:        false,
          isPossibleGroups: slot.groups,
        }
      }
    }

    return {
      ...match,
      home: resolveTeam(match.home),
      away: resolveTeam(match.away),
    }
  })

  return {
    matches:           resolvedMatches,
    thirdPlaceRanking: ranked,
    qualifiedThirds:   qualified,
    combination:       combination,
  }
}
