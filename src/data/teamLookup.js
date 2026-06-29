// Mapeo nombres en inglés (API-Football) → código 3 letras
// Usado en MatchDetail, Bracket, Dashboard, Schedule para resolver R32 teams
export const EN_NAME_TO_CODE = {
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
  'dr congo': 'COD', 'democratic republic of congo': 'COD',
  'congo dr': 'COD', 'dr. congo': 'COD',
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

// Convierte nombre inglés de API-Football o código 3 letras → código 3 letras.
// allTeamsMap: { [code]: team } — para detectar si el input ya es un código válido.
export function resolveTeamCode(nameOrCode, allTeamsMap) {
  if (!nameOrCode) return null
  if (allTeamsMap?.[nameOrCode]) return nameOrCode
  return EN_NAME_TO_CODE[nameOrCode.toLowerCase()] ?? null
}
