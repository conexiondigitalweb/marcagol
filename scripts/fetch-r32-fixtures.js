/**
 * fetch-r32-fixtures.js
 *
 * Consulta API-Football para obtener los fixtureId reales de los
 * 16 partidos de Dieciseisavos (Round of 32) del Mundial 2026.
 *
 * USO:
 *   node scripts/fetch-r32-fixtures.js
 *
 * REQUISITO: variable de entorno VITE_API_FOOTBALL_KEY
 *   Windows PowerShell:
 *     $env:VITE_API_FOOTBALL_KEY = "TU_KEY"; node scripts/fetch-r32-fixtures.js
 *   Bash:
 *     VITE_API_FOOTBALL_KEY=TU_KEY node scripts/fetch-r32-fixtures.js
 *
 * También funciona si tienes un archivo .env.local con la key
 * (requiere dotenv: npm install dotenv --save-dev)
 */

// Intenta cargar .env.local si existe
try {
  const { config } = await import('dotenv')
  config({ path: '.env.local' })
} catch {}

const API_KEY = process.env.VITE_API_FOOTBALL_KEY
if (!API_KEY) {
  console.error('❌  Falta VITE_API_FOOTBALL_KEY en las variables de entorno.')
  process.exit(1)
}

const url = 'https://v3.football.api-sports.io/fixtures?league=1&season=2026&round=Round%20of%2032'

console.log('Consultando API-Football — Round of 32, Mundial 2026...\n')

const res = await fetch(url, {
  headers: {
    'x-apisports-key': API_KEY,
  },
})

if (!res.ok) {
  console.error(`❌  Error HTTP ${res.status}`)
  process.exit(1)
}

const data = await res.json()
const fixtures = data.response ?? []

if (!fixtures.length) {
  console.log('⚠️  Sin resultados. Verifica que el torneo haya publicado los fixtures de R32.')
  process.exit(0)
}

console.log(`Encontrados ${fixtures.length} partidos:\n`)
console.log('─'.repeat(72))

// Mapeo de matchId en matches.js según el bracket oficial FIFA
// Orden: slot del bracket → matchId en matches.js
// Ajustar si el orden de la API difiere del sorteo oficial
const matchIdHint = {
  //  Grupo A vs Grupo B, etc. — completar manualmente comparando equipos
  //  'fixtureId': matchId_en_matches_js
}

fixtures.forEach(f => {
  const fid  = f.fixture.id
  const date = f.fixture.date ? new Date(f.fixture.date).toLocaleString('es-CO', { timeZone: 'America/Bogota', hour12: false }) : 'TBD'
  const home = f.teams.home.name
  const away = f.teams.away.name
  const venue = f.fixture.venue?.name ?? 'TBD'
  const status = f.fixture.status?.short ?? '?'

  console.log(`fixtureId: ${fid}  |  ${home} vs ${away}`)
  console.log(`  Fecha COL: ${date}  |  ${venue}  |  Status: ${status}`)
  console.log()
})

console.log('─'.repeat(72))
console.log('\n📋  PASOS SIGUIENTES:')
console.log('1. Identificar qué fixtureId corresponde a cada matchId (73-88) en src/data/matches.js')
console.log('   Guiarse por fecha, hora y equipos (cuando se definan los clasificados).')
console.log('2. Actualizar matches.js: fixtureId: <número> para cada partido R32.')
console.log('3. git add src/data/matches.js && git commit -m "fix: fixtureId reales R32"')
console.log('4. git push → deploy automático en Vercel.\n')
