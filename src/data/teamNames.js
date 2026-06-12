// teamNames.js — Traducción de nombres de equipos API-Football → español
// TEAM_ID_TO_ES se genera automáticamente desde TEAM_IDS + GROUPS.
// TEAM_NAME_TO_ES cubre variantes del nombre en inglés como fallback.

import { GROUPS } from './groups'
import { TEAM_IDS } from './teamIds'

// code → nombre en español (incluye alias)
const _CODE_ALIAS = { ZAF: 'RSA', HTI: 'HAI', PRY: 'PAR' }
const _codeToEs = Object.fromEntries(
  GROUPS.flatMap(g => g.teams.map(t => [t.code, t.name]))
)
function _es(code) {
  return _codeToEs[code] ?? _codeToEs[_CODE_ALIAS[code]] ?? null
}

// API team ID → nombre en español
export const TEAM_ID_TO_ES = Object.fromEntries(
  Object.entries(TEAM_IDS)
    .map(([code, id]) => [id, _es(code)])
    .filter(([, name]) => name != null)
)

// Nombre inglés de la API → nombre en español (fallback cuando solo hay string)
export const TEAM_NAME_TO_ES = {
  // Variantes que la API devuelve y difieren del español
  'South Africa':              'Sudáfrica',
  'South Korea':               'Corea del Sur',
  'Korea Republic':            'Corea del Sur',
  'Czech Republic':            'República Checa',
  'Czechia':                   'República Checa',
  'Bosnia and Herzegovina':    'Bosnia y Herzegovina',
  'Switzerland':               'Suiza',
  'Morocco':                   'Marruecos',
  'Haiti':                     'Haití',
  'Scotland':                  'Escocia',
  'United States':             'Estados Unidos',
  'Germany':                   'Alemania',
  'Curacao':                   'Curazao',
  'Ivory Coast':               'Costa de Marfil',
  "Côte d'Ivoire":             'Costa de Marfil',
  'Netherlands':               'Países Bajos',
  'Japan':                     'Japón',
  'Sweden':                    'Suecia',
  'Tunisia':                   'Túnez',
  'Belgium':                   'Bélgica',
  'Egypt':                     'Egipto',
  'Iran':                      'Irán',
  'Islamic Republic of Iran':  'Irán',
  'New Zealand':               'Nueva Zelanda',
  'Spain':                     'España',
  'Cape Verde':                'Cabo Verde',
  'Saudi Arabia':              'Arabia Saudí',
  'France':                    'Francia',
  'Iraq':                      'Irak',
  'Norway':                    'Noruega',
  'Algeria':                   'Argelia',
  'Jordan':                    'Jordania',
  'DR Congo':                  'RD Congo',
  'Congo DR':                  'RD Congo',
  'Uzbekistan':                'Uzbekistán',
  'England':                   'Inglaterra',
  'Croatia':                   'Croacia',
  'Panama':                    'Panamá',
  'Canada':                    'Canadá',
  'Turkey':                    'Turquía',
  'Brazil':                    'Brasil',
  'Mexico':                    'México',
  'Qatar':                     'Catar',
  'Paraguay':                  'Paraguay',
}

/**
 * Devuelve el nombre en español de un equipo.
 * Acepta:
 *   - objeto { id, name } (datos crudos de la API)
 *   - string (nombre en inglés)
 * Prioridad: ID > nombre en diccionario > nombre original
 */
export function esTeamName(team) {
  if (!team) return ''
  if (typeof team === 'object') {
    if (team.id != null) {
      const byId = TEAM_ID_TO_ES[team.id]
      if (byId) return byId
    }
    return TEAM_NAME_TO_ES[team.name] ?? team.name ?? ''
  }
  return TEAM_NAME_TO_ES[team] ?? team
}
