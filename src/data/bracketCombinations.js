// Annex C — FIFA World Cup 2026 official regulations
// Key: 8 grupos clasificados ordenados alfabéticamente (ej "CDEFGHIJ")
// Value: objeto con qué tercero juega contra cada campeón
// Formato: { A: 'E', B: 'J', D: 'I', E: 'F', G: 'H', I: 'G', K: 'L', L: 'K' }
// significa: 1ºA vs 3ºE, 1ºB vs 3ºJ, 1ºD vs 3ºI, etc.

export const BRACKET_COMBINATIONS = new Map([
  ['EFGHIJKL', { A: 'E', B: 'J', D: 'I', E: 'F', G: 'H', I: 'G', K: 'L', L: 'K' }],
  ['DFGHIJKL', { A: 'H', B: 'G', D: 'I', E: 'D', G: 'J', I: 'F', K: 'L', L: 'K' }],
  ['DEGHIJKL', { A: 'E', B: 'J', D: 'I', E: 'D', G: 'H', I: 'G', K: 'L', L: 'K' }],
  ['DEFHIJKL', { A: 'E', B: 'J', D: 'I', E: 'D', G: 'H', I: 'F', K: 'L', L: 'K' }],
  ['DEFGIJKL', { A: 'E', B: 'G', D: 'I', E: 'D', G: 'J', I: 'F', K: 'L', L: 'K' }],
  ['DEFGHJKL', { A: 'E', B: 'G', D: 'J', E: 'D', G: 'H', I: 'F', K: 'L', L: 'K' }],
  ['DEFGHIKL', { A: 'E', B: 'G', D: 'I', E: 'D', G: 'H', I: 'F', K: 'L', L: 'K' }],
  ['DEFGHIJL', { A: 'E', B: 'G', D: 'J', E: 'D', G: 'H', I: 'F', K: 'L', L: 'I' }],
  ['DEFGHIJK', { A: 'E', B: 'G', D: 'J', E: 'D', G: 'H', I: 'F', K: 'I', L: 'K' }],
  ['CFGHIJKL', { A: 'H', B: 'G', D: 'I', E: 'C', G: 'J', I: 'F', K: 'L', L: 'K' }],
  ['CEGHIJKL', { A: 'E', B: 'J', D: 'I', E: 'C', G: 'H', I: 'G', K: 'L', L: 'K' }],
  ['CEFHIJKL', { A: 'E', B: 'J', D: 'I', E: 'C', G: 'H', I: 'F', K: 'L', L: 'K' }],
  ['CEFGIJKL', { A: 'E', B: 'G', D: 'I', E: 'C', G: 'J', I: 'F', K: 'L', L: 'K' }],
  ['CEFGHJKL', { A: 'E', B: 'G', D: 'J', E: 'C', G: 'H', I: 'F', K: 'L', L: 'K' }],
  ['CEFGHIKL', { A: 'E', B: 'G', D: 'I', E: 'C', G: 'H', I: 'F', K: 'L', L: 'K' }],
  ['CEFGHIJL', { A: 'E', B: 'G', D: 'J', E: 'C', G: 'H', I: 'F', K: 'L', L: 'I' }],
  ['CEFGHIJK', { A: 'E', B: 'G', D: 'J', E: 'C', G: 'H', I: 'F', K: 'I', L: 'K' }],
  ['CDGHIJKL', { A: 'H', B: 'G', D: 'I', E: 'C', G: 'J', I: 'D', K: 'L', L: 'K' }],
  ['CDFHIJKL', { A: 'C', B: 'J', D: 'I', E: 'D', G: 'H', I: 'F', K: 'L', L: 'K' }],
  ['CDFGIJKL', { A: 'C', B: 'G', D: 'I', E: 'D', G: 'J', I: 'F', K: 'L', L: 'K' }],
  ['CDFGHJKL', { A: 'C', B: 'G', D: 'J', E: 'D', G: 'H', I: 'F', K: 'L', L: 'K' }],
  ['CDFGHIKL', { A: 'C', B: 'G', D: 'I', E: 'D', G: 'H', I: 'F', K: 'L', L: 'K' }],
  ['CDFGHIJL', { A: 'C', B: 'G', D: 'J', E: 'D', G: 'H', I: 'F', K: 'L', L: 'I' }],
  ['CDFGHIJK', { A: 'C', B: 'G', D: 'J', E: 'D', G: 'H', I: 'F', K: 'I', L: 'K' }],
  ['CDEHIJKL', { A: 'E', B: 'J', D: 'I', E: 'C', G: 'H', I: 'D', K: 'L', L: 'K' }],
  ['CDEGIJKL', { A: 'E', B: 'G', D: 'I', E: 'C', G: 'J', I: 'D', K: 'L', L: 'K' }],
  ['CDEGHIKL', { A: 'E', B: 'G', D: 'I', E: 'C', G: 'H', I: 'D', K: 'L', L: 'K' }],
  ['CDEGHJKL', { A: 'E', B: 'G', D: 'J', E: 'C', G: 'H', I: 'D', K: 'L', L: 'K' }],
  ['CDEGHIJL', { A: 'E', B: 'G', D: 'J', E: 'C', G: 'H', I: 'D', K: 'L', L: 'I' }],
  ['CDEGHIJK', { A: 'E', B: 'G', D: 'J', E: 'C', G: 'H', I: 'D', K: 'I', L: 'K' }],
  ['CDEFIJKL', { A: 'C', B: 'J', D: 'E', E: 'D', G: 'I', I: 'F', K: 'L', L: 'K' }],
  ['CDEFHJKL', { A: 'C', B: 'J', D: 'E', E: 'D', G: 'H', I: 'F', K: 'L', L: 'K' }],
  ['CDEFHIKL', { A: 'C', B: 'E', D: 'I', E: 'D', G: 'H', I: 'F', K: 'L', L: 'K' }],
  ['CDEFHIJL', { A: 'C', B: 'J', D: 'E', E: 'D', G: 'H', I: 'F', K: 'L', L: 'I' }],
  ['CDEFHIJK', { A: 'C', B: 'J', D: 'E', E: 'D', G: 'H', I: 'F', K: 'I', L: 'K' }],
  ['CDEFGJKL', { A: 'C', B: 'G', D: 'E', E: 'D', G: 'J', I: 'F', K: 'L', L: 'K' }],
  ['CDEFGIKL', { A: 'C', B: 'G', D: 'E', E: 'D', G: 'I', I: 'F', K: 'L', L: 'K' }],
  ['CDEFGIJL', { A: 'C', B: 'G', D: 'E', E: 'D', G: 'J', I: 'F', K: 'L', L: 'I' }],
  ['CDEFGIJK', { A: 'C', B: 'G', D: 'E', E: 'D', G: 'J', I: 'F', K: 'I', L: 'K' }],
  ['CDEFGHKL', { A: 'C', B: 'G', D: 'E', E: 'D', G: 'H', I: 'F', K: 'L', L: 'K' }],
  ['CDEFGHJL', { A: 'C', B: 'G', D: 'J', E: 'D', G: 'H', I: 'F', K: 'L', L: 'E' }],
  ['CDEFGHJK', { A: 'C', B: 'G', D: 'J', E: 'D', G: 'H', I: 'F', K: 'E', L: 'K' }],
  ['CDEFGHIL', { A: 'C', B: 'G', D: 'E', E: 'D', G: 'H', I: 'F', K: 'L', L: 'I' }],
  ['CDEFGHIK', { A: 'C', B: 'G', D: 'E', E: 'D', G: 'H', I: 'F', K: 'I', L: 'K' }],
  ['CDEFGHIJ', { A: 'C', B: 'G', D: 'J', E: 'D', G: 'H', I: 'F', K: 'E', L: 'I' }],
  // ... continúan hasta la combinación 495
])

export function getBracketCombination(qualifiedGroups) {
  // qualifiedGroups: array de 8 letras de grupos, ej ['C','D','E','F','G','H','I','J']
  const key = [...qualifiedGroups].sort().join('')
  return BRACKET_COMBINATIONS.get(key) || null
}
