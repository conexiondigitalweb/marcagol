# CONTEXTO.md — marcagol.live · Mundial 2026

Estado completo del proyecto para continuar en futuros chats sin perder contexto.
Última actualización: **2026-06-07** · Commit HEAD: `701565c`

---

## 1. Proyecto

**marcagol.live** — plataforma de seguimiento del Mundial 2026 (FIFA World Cup 2026).

| Campo | Valor |
|-------|-------|
| Repo local | `C:\Users\USUARIO\marcagol` |
| GitHub | `https://github.com/conexiondigitalweb/marcagol` |
| Deploy | Vercel, proyecto `marcagol2026` |
| Auto-deploy | Sí — cada push a `main` |
| Branch principal | `main` |
| Inicio del torneo | **11 de junio 2026** (datos en vivo se activan ese día) |

---

## 2. Stack

| Capa | Tecnología |
|------|-----------|
| UI | React 18 + React Router 6 |
| Estilos | Tailwind CSS 3 (sin plugins extra) |
| Build | Vite 5 |
| Markdown | react-markdown 10 (en MatchAI, lazy) |
| Deploy | Vercel (SPA + Serverless Functions en `/api/`) |
| API datos en vivo | API-Football v3 (`v3.api-football.com`) · Plan Starter |
| API IA | Anthropic Claude (`claude-haiku-4-5-20251001`) vía proxy serverless |

**`package.json` (dependencias de producción):**
```json
"react", "react-dom", "react-router-dom", "react-markdown",
"axios", "clsx", "date-fns"
```

---

## 3. Estructura de archivos

```
marcagol/
├── api/
│   └── analyze.js            # Serverless proxy → Anthropic (streaming SSE + retry)
├── src/
│   ├── main.jsx              # Entry: AppProvider + BrowserRouter
│   ├── App.jsx               # 13 rutas, todas con React.lazy + Suspense
│   ├── context/
│   │   ├── AppContext.jsx         # liveMatches, hasLive, selectedCountry
│   │   └── PredictionsContext.jsx # Quiniela con localStorage
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx    # Nav desktop + hamburger móvil, sticky
│   │   │   └── Footer.jsx
│   │   └── ui/
│   │       ├── MatchAI.jsx       # Simulación Monte Carlo + análisis Claude streaming
│   │       ├── Flag.jsx          # flagcdn.com
│   │       ├── Badge.jsx         # ConfederationBadge, StatusBadge
│   │       ├── LiveIndicator.jsx
│   │       ├── LiveScores.jsx
│   │       ├── LoadingSpinner.jsx # prop fullPage
│   │       ├── TeamCrestImg.jsx
│   │       └── VenueCard.jsx
│   ├── data/
│   │   ├── groups.js         # 48 equipos · 12 grupos (A–L)
│   │   ├── matches.js        # 104 partidos (72 grupos + 32 eliminatoria)
│   │   ├── squads.js         # 1.248 jugadores oficiales FIFA — chunk lazy
│   │   ├── history.js        # Historial mundialista 48 selecciones — chunk lazy
│   │   ├── liveData.js       # Funciones fetch API-Football con cache TTL
│   │   ├── broadcast.js      # Canales TV/streaming por país
│   │   ├── venues.js         # 16 estadios (nombre, ciudad, capacidad, imagen)
│   │   └── teamIds.js        # Código equipo → ID API-Football (para logos)
│   ├── hooks/
│   │   ├── useLiveData.js    # useLiveMatches, useTodayMatches, useStandings,
│   │   │                     # useTopStats, useMatchDetail — polling automático
│   │   └── useAnalysis.js    # Streaming SSE + cache en memoria por matchId:question
│   ├── pages/
│   │   ├── Dashboard.jsx     # Countdown + partidos del día + grupos resumidos
│   │   ├── Groups.jsx        # Tablas 12 grupos
│   │   ├── GroupDetail.jsx   # Tabla + calendario de un grupo
│   │   ├── Bracket.jsx       # Árbol de llaves R32 → Final
│   │   ├── Teams.jsx         # Grid 48 equipos, filtro confederación/búsqueda
│   │   ├── TeamDetail.jsx    # Perfil equipo: stats, convocatoria, historial
│   │   ├── Predictions.jsx   # Quiniela con sistema de puntos
│   │   ├── Schedule.jsx      # Calendario completo con filtros y foto estadio
│   │   ├── MatchDetail.jsx   # Tabs: minuto a min / stats / alineaciones / IA
│   │   ├── Scorers.jsx       # Goleadores y asistidores (API-Football)
│   │   ├── History.jsx       # Historia de los mundiales
│   │   ├── News.jsx          # Noticias
│   │   └── Broadcast.jsx     # Dónde ver por país/región
│   └── utils/
│       └── helpers.js        # formatDate, sortTeams, getCountdown, flagUrl,
│                             # getConfederationColor, groupMatchesByDate, etc.
├── vercel.json               # {} — vacío, Vercel detecta todo automáticamente
├── vite.config.js            # plugin react, puerto 5173
├── tailwind.config.js
└── CONTEXTO.md               # Este archivo
```

---

## 4. Rutas

| Ruta | Página | Notas |
|------|--------|-------|
| `/` | Dashboard | Countdown hasta inicio del torneo |
| `/grupos` | Groups | |
| `/grupos/:id` | GroupDetail | `:id` es letra del grupo (A–L) |
| `/llaves` | Bracket | |
| `/equipos` | Teams | |
| `/equipos/:code` | TeamDetail | `:code` es código FIFA (ARG, BRA…) |
| `/predicciones` | Predictions | |
| `/calendario` | Schedule | |
| `/noticias` | News | |
| `/donde-ver` | Broadcast | |
| `/historia` | History | |
| `/goleadores` | Scorers | |
| `/partido/:id` | MatchDetail | `:id` es `match.id` numérico de `matches.js` |

Todas las páginas son **lazy** (`React.lazy` + `Suspense` con `<LoadingSpinner fullPage />`).

---

## 5. Variables de entorno

| Variable | Archivo | Uso |
|----------|---------|-----|
| `VITE_API_FOOTBALL_KEY` | `.env` + Vercel dashboard | API-Football |
| `VITE_ANTHROPIC_KEY` o `ANTHROPIC_API_KEY` | **Solo Vercel dashboard** | Anthropic — nunca en `.env` local |

> La clave de Anthropic **solo existe server-side** en `api/analyze.js`.
> `VITE_API_FOOTBALL_KEY` también está hardcodeada en `src/data/liveData.js` (línea 5) como fallback.

---

## 6. Bundle (post-optimización)

| Chunk | Minificado | gzip | Cuándo carga |
|-------|-----------|------|--------------|
| `index-*.js` (main) | 226 kB | 67.9 kB | Siempre (React, Router, Header, Footer, contextos) |
| `TeamDetail-*.js` | 188 kB | 43.7 kB | Al visitar `/equipos/:code` — **contiene squads.js** |
| `MatchDetail-*.js` | 146 kB | 44.5 kB | Al visitar `/partido/:id` — contiene react-markdown |
| `history-*.js` | 7.4 kB | 1.5 kB | Con TeamDetail y MatchDetail |
| `Dashboard-*.js` | 12.4 kB | 3.8 kB | Al visitar `/` |
| Resto de páginas | 3–9 kB | 1–3 kB | Bajo demanda |

El main bundle bajó de **535 kB → 226 kB (-58%)** al pasar todas las páginas a lazy.

---

## 7. Datos estáticos

### `groups.js`
Objeto `GROUPS` (array). Cada grupo tiene `{ id, name, teams[] }`.
Cada equipo: `{ code, name, iso2, confederation, fifaRanking, points, played, won, drawn, lost, gf, ga, gd }`.
Funciones exportadas: `getTeamByCode(code)`, `getGroupById(id)`.

### `matches.js`
Array `MATCHES`. Cada partido: `{ id, date, time (ET), homeTeam, awayTeam, homeScore, awayScore, status, group, matchday, venue, city, country }`.
`status` puede ser: `'upcoming'`, `'live'`, `'finished'`.
Funciones: `getUpcomingMatches()`, `getLiveMatches()`, `getMatchesByGroup(group)`.

### `squads.js`
Objeto `SQUADS[code]` → `{ coach, avgAge, players[] }`.
Cada jugador: `{ number, position, name, shirtName, birth, age, club, height }`.
`position` es uno de: `"Portero"`, `"Defensor"`, `"Mediocampista"`, `"Delantero"`.
Funciones exportadas: `getSquad(code)`, `getCoach(code)`.

### `history.js`
Objeto `HISTORY[code]` → `{ participations, edition2026, matches, won, drawn, lost, gf, gc, titles, runnerUp, semis, quarters, best }`.
Función exportada: `getHistory(code)`.

### `teamIds.js`
`TEAM_IDS[code]` → número ID en API-Football.
Usado para logos: `https://media.api-sports.io/football/teams/{id}.png`.

### `venues.js`
`VENUES_BY_NAME[name]` → `{ name, city, country, capacity, surface, image }`.

---

## 8. API de datos en vivo — `src/data/liveData.js`

- **API-Football v3** · League ID `1` · Season `2026`
- Cache en memoria con TTLs:

| Endpoint | TTL |
|----------|-----|
| Partidos en vivo | 30 s |
| Partidos del día / fixture | 5 min |
| Tablas / goleadores | 10 min |
| Eventos del partido | 30 s |
| Estadísticas del partido | 1 min |
| Alineaciones / squad | 5 min |

**Funciones disponibles:**

```js
getLiveMatches()                    // partidos en vivo ahora
getTodayMatches()                   // partidos del día
getAllFixtures()                    // fixture completo del torneo
getMatchDetail(fixtureId)           // { events, stats, lineups }
getStandings()                      // tablas de posiciones
getTopScorers()                     // goleadores del torneo
getTopAssists()                     // asistidores del torneo
getTeamStats(teamId)                // estadísticas de equipo en el torneo
getSquad(teamId)                    // convocatoria desde la API (≠ squads.js)
getPlayerStats(playerId)            // estadísticas de un jugador en el torneo
toLocalTime(utcDate)               // helper: UTC → hora local del usuario
toLocalDate(utcDate)               // helper: UTC → fecha local
getMatchStatus(fixture)            // estado en español
getEventIcon(type, detail)         // { icon, label } para eventos del partido
clearCache()                       // limpiar cache manualmente
```

### Hooks de datos en vivo — `src/hooks/useLiveData.js`

```js
useLiveMatches()       // polling 30s → { matches, loading, error, refetch }
useTodayMatches()      // polling 5min → { matches, loading, error, refetch }
useStandings()         // polling 10min → { standings, loading, error, refetch }
useTopStats()          // polling 10min → { scorers, assists, loading, error, refetch }
useMatchDetail(id)     // polling 30s → { events, stats, lineups, loading, error, refetch }
```

---

## 9. Proxy IA — `api/analyze.js`

Serverless function de Vercel. El frontend **nunca** llama a Anthropic directamente.

- **Modelo:** `claude-haiku-4-5-20251001`
- **Retry:** exponencial en 529 (overloaded) — 1.5s → 3s → 6s (máx 3 intentos)
- **Dos modos de respuesta:**
  - `stream: true` → `Content-Type: text/event-stream` — proxea el SSE de Anthropic directamente
  - `stream: false` → JSON `{ text, matchId }`
- **Body que acepta:** `{ system, message, stream, matchId }`

---

## 10. Hook `useAnalysis` — `src/hooks/useAnalysis.js`

```js
const { text, streaming, loading, error, ask, reset } = useAnalysis()

ask({ system, message, matchId })  // dispara la llamada
reset()                            // cancela y limpia
```

- **Cache en memoria por sesión** — clave `"${matchId}:${message}"`, no repite peticiones
- Parsea SSE línea a línea: busca `content_block_delta` → `text_delta`
- `streaming` es distinto de `loading`: `loading=true` mientras espera la primera respuesta, `streaming=true` mientras llegan tokens
- `reset()` llama a `AbortController.abort()` y limpia estado

---

## 11. Componente `MatchAI` — `src/components/ui/MatchAI.jsx`

Usado en `MatchDetail.jsx` tab "Análisis IA". Dos secciones independientes:

**Sección 1 — Simulación Monte Carlo:**
- Modelo Poisson con ranking FIFA + historial mundialista de `history.js`
- `poissonRandom(lambda)` — método de Knuth, máximo 8 goles
- Opciones: 1k / 5k / 10k / 50k iteraciones
- Salida: probabilidades (local/empate/visitante), top 5 marcadores, % ambos anotan, % arco en 0

**Sección 2 — Análisis Claude:**
- Usa `useAnalysis()` hook
- Construye un `context` con datos del partido + resultado de la simulación si existe
- Respuesta renderizada con `<ReactMarkdown components={MD_COMPONENTS}>` — sin `@tailwindcss/typography`
- `MD_COMPONENTS` define estilos Tailwind para: `p`, `strong`, `em`, `h1/h2/h3`, `ul/ol/li`, `hr`, `code`
- Cursor parpadeante `animate-pulse` mientras `streaming === true`
- Preguntas sugeridas hardcodeadas (4 botones)

---

## 12. TAREA PENDIENTE A: Datos en vivo

### Problema actual

Los datos en vivo **no se están integrando correctamente** en la UI. Los hooks existen y funcionan, pero hay desconexión entre lo que devuelve la API y lo que muestran los componentes.

**Situación específica en `MatchDetail.jsx`:**
- El hook `useMatchDetail(id)` llama a `getMatchDetail(fixtureId)` pasando el `:id` de la URL
- **Problema:** el `:id` de la URL es el `match.id` de `matches.js` (número propio, ej. `1`, `2`, `3`…), pero `getMatchDetail` necesita el **fixture ID de API-Football** (número distinto, de 6 cifras)
- `liveMatchData` en `MatchDetail.jsx` está hardcodeado con `null` (líneas 289–295) — el marcador en vivo nunca se muestra

**Situación en `Dashboard.jsx`:**
- `startLivePolling` se importa de `'../services/liveData'` pero ese archivo no existe — hay un import roto
- La sección de partidos en vivo API (`ApiMatchCard`) existe pero puede no recibir datos reales

### Qué falta implementar

1. **Mapeo `match.id` → fixture ID de API-Football**
   - Opción A: añadir campo `fixtureId` a cada partido en `matches.js` (lo más simple)
   - Opción B: cargar todos los fixtures de la API al inicio y cruzar por fecha+equipos
   - Opción A es preferible: editar `matches.js` agregando `fixtureId: <número>` en los partidos que ya tienen fecha confirmada

2. **Conectar el marcador en vivo en `MatchHeader`**
   - `liveMatchData` en `MatchDetail.jsx` debe venir del hook `useMatchDetail` que ya retorna `stats`
   - El marcador se puede extraer de `stats[0]` y `stats[1]` de la respuesta de API-Football
   - El status (1H, HT, 2H, FT…) viene del fixture general, no del detalle

3. **Arreglar el import roto en `Dashboard.jsx`**
   - `import { startLivePolling } from '../services/liveData'` — el archivo `src/services/liveData.js` no existe
   - Eliminar ese import y usar directamente `useLiveMatches()` del hook

4. **Tablas de posiciones en tiempo real**
   - `useStandings()` ya existe pero los datos de `groups.js` son estáticos
   - Cuando lleguen datos de la API, mezclar: API manda a `{standings}`, hay que mapear a la estructura de `groups.js`

5. **`Scorers.jsx`** — ya está listo: usa `useTopStats()` con estado de carga/error/vacío correcto. Solo falta que la API tenga datos (desde el 11-jun).

### Archivos a tocar

```
src/data/matches.js          → agregar fixtureId por partido
src/pages/MatchDetail.jsx    → conectar liveMatchData con useMatchDetail
src/pages/Dashboard.jsx      → eliminar import roto, arreglar polling de live
src/pages/Groups.jsx         → opcional: mezclar standings de API con datos estáticos
```

---

## 13. TAREA PENDIENTE B: Perfil de jugador

### Qué existe hoy

- `squads.js` tiene 1.248 jugadores con: `number, position, name, shirtName, birth, age, club, height`
- `TeamDetail.jsx` muestra la convocatoria agrupada por posición en tarjetas simples (nombre + club + edad)
- `liveData.js` ya tiene `getPlayerStats(playerId)` que llama a `/players?id=&league=1&season=2026`
- `Scorers.jsx` muestra la foto del jugador desde `player.photo` (URL de API-Football)
- **No existe ninguna ruta `/jugadores/:id` ni página `PlayerDetail.jsx`**

### Qué hay que construir

**Ruta nueva:** `/jugadores/:name` o `/jugadores/:teamCode/:number`

La clave del jugador puede ser `teamCode-number` (ej. `ARG-10`) porque `squads.js` no tiene IDs de API-Football.

**Datos disponibles sin API (de `squads.js`):**
- Nombre completo, nombre en camiseta, número, posición, fecha de nacimiento, edad, club, altura

**Datos disponibles con API (de `getPlayerStats`):**
- Fotos del jugador, goles, asistencias, minutos jugados, tarjetas, partidos

**Problema de lookup:** `squads.js` no tiene el ID numérico de API-Football para cada jugador. Opciones:
- Opción A: `getSquad(teamId)` de la API retorna jugadores con `{ player: { id, name, photo } }` — se puede cruzar por nombre o número de camiseta
- Opción B: enriquecer `squads.js` con un campo `apiId` por jugador (costoso pero definitivo)

### Plan de implementación sugerido

1. **Crear `src/pages/PlayerDetail.jsx`**
   - Recibe `teamCode` y `number` de los params
   - Lee datos base de `SQUADS[teamCode].players.find(p => p.number === number)`
   - Llama a `getSquad(TEAM_IDS[teamCode])` de la API para obtener el `player.id` y la foto
   - Con ese `player.id`, llama a `getPlayerStats(playerId)` para las estadísticas del torneo
   - Muestra: foto, bandera del equipo, nombre, posición, club, stats del torneo

2. **Actualizar `TeamDetail.jsx`** — cada tarjeta de jugador con `<Link to={...}>`

3. **Añadir ruta en `App.jsx`:**
   ```jsx
   const PlayerDetail = lazy(() => import('./pages/PlayerDetail'))
   <Route path="/jugadores/:teamCode/:number" element={<PlayerDetail />} />
   ```

4. **Actualizar `Scorers.jsx`** — nombre del jugador con link a su perfil (requiere cruzar con `squads.js` por nombre)

### Estructura sugerida de `PlayerDetail.jsx`

```
┌─────────────────────────────────┐
│  ← Volver a [Equipo]            │
│  [Foto]  [Bandera] Nombre       │
│          Posición · #Número     │
│          Club actual · Edad     │
├─────────────────────────────────┤
│  Estadísticas en el torneo      │
│  ⚽ Goles  🎯 Asistencias       │
│  ⏱ Minutos  🟨 Tarjetas        │
├─────────────────────────────────┤
│  Datos personales               │
│  Fecha nacimiento · Altura      │
│  Confederación · Grupo          │
└─────────────────────────────────┘
```

---

## 14. Commits recientes

```
701565c docs: agregar CONTEXTO.md con estado completo del proyecto
375f60f feat: renderizar análisis IA con react-markdown
3c3efc8 feat: lazy load páginas, hook useAnalysis con streaming y fixes móvil
6b1c2e0 fix: corregir nombre modelo Claude en proxy
eaf1819 fix: parseo respuesta IA en frontend
c07e766 fix: parseo body en funcion serverless
39b887f fix: limpiar vercel.json conflicto rutas SPA
fcb8285 feat: proxy serverless para análisis IA
28eabad feat: información detallada partidos
```

---

## 15. Comandos frecuentes

```bash
npm run dev        # Desarrollo en http://localhost:5173
npm run build      # Build de producción → dist/
npm run preview    # Preview del build local

git push origin main   # Deploy automático a Vercel
```
