// broadcasts.js — Transmisiones por partido para Colombia (Copa Mundial 2026)
// Fuente: anuncios oficiales DSports/DirecTV, Caracol TV, RCN, Win Sports, Disney+
// Actualizar cuando cada canal confirme parrilla de eliminatorias.

export const CHANNELS = {
  dsports: {
    name: 'DSports',
    url: 'https://www.dgo.com',
    color: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
  },
  caracol: {
    name: 'Caracol',
    url: 'https://play.caracoltv.com',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
  rcn: {
    name: 'RCN',
    url: 'https://www.deportesrcn.com/envivo',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  win: {
    name: 'Win Sports',
    url: 'https://www.winsportsonline.com',
    color: 'bg-red-500/20 text-red-400 border-red-500/40',
  },
  disney: {
    name: 'Disney+',
    url: 'https://www.disneyplus.com',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  },
}

// matchId (de matches.js) → claves de CHANNELS
// DSports tiene los 104 partidos; solo se registran aquí los que van además por
// Caracol+RCN o Win Sports. Los no listados son exclusivos de DSports.
const COLOMBIA_BROADCASTS = {
  // ── Caracol + RCN (fase de grupos, 17 partidos) ─────────────────────────
  1:  ['dsports', 'caracol', 'rcn', 'disney'],  // MEX vs RSA   11 jun 14:00
  4:  ['dsports', 'caracol', 'rcn', 'disney'],  // USA vs PAR   12 jun 20:00
  7:  ['dsports', 'caracol', 'rcn', 'disney'],  // BRA vs MAR   13 jun 17:00
  11: ['dsports', 'caracol', 'rcn', 'disney'],  // NED vs JPN   14 jun 15:00
  14: ['dsports', 'caracol', 'rcn', 'disney'],  // ESP vs CPV   15 jun 11:00
  19: ['dsports', 'caracol', 'rcn', 'disney'],  // ARG vs ALG   16 jun 20:00
  24: ['dsports', 'caracol', 'rcn', 'disney'],  // COL vs UZB   17 jun 21:00
  26: ['dsports', 'caracol', 'rcn', 'disney'],  // SUI vs BIH   18 jun 14:00
  30: ['dsports', 'caracol', 'rcn'],            // SCO vs MAR   19 jun 17:00 (sin Disney+)
  33: ['dsports', 'caracol', 'rcn', 'disney'],  // GER vs CIV   20 jun 15:00
  39: ['dsports', 'caracol', 'rcn', 'disney'],  // BEL vs IRN   21 jun 14:00
  43: ['dsports', 'caracol', 'rcn', 'disney'],  // ARG vs AUT   22 jun 12:00
  48: ['dsports', 'caracol', 'rcn', 'disney'],  // COL vs COD   23 jun 21:00
  49: ['dsports', 'caracol', 'rcn', 'disney'],  // SCO vs BRA   24 jun 17:00
  56: ['dsports', 'caracol', 'rcn', 'disney'],  // ECU vs GER   25 jun 15:00
  66: ['dsports', 'caracol', 'rcn', 'disney'],  // URU vs ESP   26 jun 19:00
  71: ['dsports', 'caracol', 'rcn', 'disney'],  // COL vs POR   27 jun 18:30

  // ── Win Sports (fase de grupos, 18 partidos) ─────────────────────────────
  2:  ['dsports', 'win'],                       // KOR vs CZE   11 jun 21:00
  3:  ['dsports', 'win', 'disney'],             // CAN vs BIH   12 jun 14:00
  8:  ['dsports', 'win'],                       // QAT vs SUI   13 jun 14:00
  9:  ['dsports', 'win', 'disney'],             // CIV vs ECU   14 jun 18:00
  13: ['dsports', 'win', 'disney'],             // KSA vs URU   15 jun 17:00
  18: ['dsports', 'win'],                       // IRQ vs NOR   16 jun 17:00
  22: ['dsports', 'win'],                       // ENG vs CRO   17 jun 15:00
  28: ['dsports', 'win'],                       // MEX vs KOR   18 jun 20:00
  31: ['dsports', 'win'],                       // TUR vs PAR   19 jun 23:00
  34: ['dsports', 'win', 'disney'],             // ECU vs CUW   20 jun 19:00
  35: ['dsports', 'win'],                       // NED vs SWE   20 jun 12:00
  38: ['dsports', 'win', 'disney'],             // ESP vs KSA   21 jun 11:00
  41: ['dsports', 'win'],                       // NOR vs SEN   22 jun 19:00
  47: ['dsports', 'win'],                       // POR vs UZB   23 jun 12:00
  53: ['dsports', 'win'],                       // CZE vs MEX   24 jun 20:00
  58: ['dsports', 'win'],                       // TUN vs NED   25 jun 18:00
  61: ['dsports', 'win'],                       // NOR vs FRA   26 jun 14:00
  70: ['dsports', 'win', 'disney'],             // JOR vs ARG   27 jun 21:00
}

/**
 * Devuelve los canales para Colombia y si hay señales abierta por confirmar.
 * - Grupos (ids 1-72): DSports siempre; + Caracol/RCN/Win/Disney+ según tabla.
 * - Eliminatorias (ids 73-104): DSports confirmado; señales abiertas por anunciar.
 * - No encontrado: solo DSports (nunca inventar canales).
 */
export function getBroadcasts(matchId) {
  if (matchId >= 73) {
    return { channels: [CHANNELS.dsports], abiertosPorConfirmar: true }
  }
  const keys = COLOMBIA_BROADCASTS[matchId]
  if (!keys) {
    return { channels: [CHANNELS.dsports], abiertosPorConfirmar: false }
  }
  return { channels: keys.map(k => CHANNELS[k]), abiertosPorConfirmar: false }
}
