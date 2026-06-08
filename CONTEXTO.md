# CONTEXTO.md — marcagol.live · Mundial 2026

Documento de estado completo para continuar el desarrollo en futuros chats.
Última actualización: **2026-06-07**

---

## Proyecto

**marcagol.live** — plataforma de seguimiento del Mundial 2026 (FIFA World Cup 2026).
- Repo: `C:\Users\USUARIO\marcagol`
- Deploy: **Vercel** (proyecto `marcagol2026`) — auto-deploy en push a `main`
- URL producción: https://marcagol.live
- Branch principal: `main`

---

## Stack

| Capa | Tecnología |
|------|-----------|
| UI | React 18 + React Router 6 |
| Estilos | Tailwind CSS 3 |
| Build | Vite 5 |
| Markdown | react-markdown 10 |
| Deploy | Vercel (SPA + Serverless Functions) |
| API externa datos | API-Football v3 (`v3.api-football.com`) |
| API IA | Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) |

**Dependencias clave en `package.json`:**
```
react, react-dom, react-router-dom, react-markdown
axios, clsx, date-fns
```

---

## Estructura de archivos

```
marcagol/
├── api/
│   └── analyze.js          # Serverless function proxy → Anthropic API
├── src/
│   ├── main.jsx            # Entry point, envuelve en AppProvider + BrowserRouter
│   ├── App.jsx             # Rutas con React.lazy + Suspense (todas las páginas)
│   ├── context/
│   │   ├── AppContext.jsx          # liveMatches, selectedCountry, hasLive
│   │   └── PredictionsContext.jsx  # Quiniela con localStorage
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx   # Nav desktop + hamburger móvil, sticky
│   │   │   └── Footer.jsx
│   │   └── ui/
│   │       ├── MatchAI.jsx       # Simulación Monte Carlo + análisis Claude (streaming)
│   │       ├── Flag.jsx          # Banderas via flagcdn.com
│   │       ├── Badge.jsx         # ConfederationBadge, StatusBadge
│   │       ├── LiveIndicator.jsx
│   │       ├── LiveScores.jsx
│   │       ├── LoadingSpinner.jsx
│   │       ├── TeamCrestImg.jsx
│   │       └── VenueCard.jsx
│   ├── data/
│   │   ├── groups.js       # 48 equipos en 12 grupos (A–L) con estadísticas
│   │   ├── matches.js      # 104 partidos con fechas, sedes, estados
│   │   ├── squads.js       # 1.248 jugadores oficiales FIFA (48×26) — chunk lazy
│   │   ├── history.js      # Historial mundialista de las 48 selecciones — chunk lazy
│   │   ├── broadcast.js    # Canales TV/streaming por país
│   │   ├── venues.js       # 16 estadios con capacidad y ciudad
│   │   ├── teamIds.js      # IDs de API-Football por código de equipo
│   │   └── liveData.js     # Funciones fetch a API-Football con cache TTL
│   ├── hooks/
│   │   ├── useLiveData.js  # useLiveMatches, useTodayMatches, useStandings,
│   │   │                   # useTopStats, useMatchDetail — polling automático
│   │   └── useAnalysis.js  # Streaming SSE + cache por matchId:question
│   ├── pages/
│   │   ├── Dashboard.jsx   # Countdown + próximos partidos + grupos resumidos
│   │   ├── Groups.jsx      # Tablas de 12 grupos
│   │   ├── GroupDetail.jsx # Tabla + calendario de un grupo
│   │   ├── Bracket.jsx     # Árbol de llaves R32→Final
│   │   ├── Teams.jsx       # Grid 48 equipos con filtro por confederación/búsqueda
│   │   ├── TeamDetail.jsx  # Perfil equipo: stats, convocatoria, historial
│   │   ├── Predictions.jsx # Quiniela con sistema de puntos
│   │   ├── Schedule.jsx    # Calendario completo con filtros
│   │   ├── MatchDetail.jsx # Tabs: eventos / stats / alineaciones / análisis IA
│   │   ├── Scorers.jsx     # Goleadores y asistidores
│   │   ├── History.jsx     # Historia de los mundiales
│   │   ├── News.jsx        # Noticias
│   │   └── Broadcast.jsx   # Dónde ver por país
│   └── utils/
│       └── helpers.js      # formatDate, sortTeams, getCountdown, flagUrl,
│                           # getConfederationColor, capitalizeFirst, etc.
├── vercel.json             # {} — configuración mínima (rutas SPA manejadas por Vite)
├── vite.config.js          # Plugin react, puerto 5173
├── tailwind.config.js
└── CONTEXTO.md             # Este archivo
```

---

## Rutas de la app

| Ruta | Página |
|------|--------|
| `/` | Dashboard |
| `/grupos` | Groups |
| `/grupos/:id` | GroupDetail |
| `/llaves` | Bracket |
| `/equipos` | Teams |
| `/equipos/:code` | TeamDetail |
| `/predicciones` | Predictions |
| `/calendario` | Schedule |
| `/noticias` | News |
| `/donde-ver` | Broadcast |
| `/historia` | History |
| `/goleadores` | Scorers |
| `/partido/:id` | MatchDetail |

Todas las páginas son **lazy** (`React.lazy` + `Suspense`) → el main bundle no incluye código de páginas.

---

## Variables de entorno

| Variable | Dónde | Uso |
|----------|-------|-----|
| `VITE_API_FOOTBALL_KEY` | `.env` | API-Football (también en Vercel dashboard) |
| `VITE_ANTHROPIC_KEY` o `ANTHROPIC_API_KEY` | Vercel dashboard (no en .env) | Clave Anthropic — solo se usa server-side en `api/analyze.js` |

> La clave de Anthropic **nunca** va al frontend. El frontend llama a `/api/analyze` (serverless).

---

## API de datos en vivo — `src/data/liveData.js`

- **API-Football v3** · League ID `1` · Season `2026`
- Clave hardcodeada en el archivo: `217e3ccfd4e714fba62caf18ed3ef01d`
- Cache en memoria con TTLs: live 30s, fixtures 5min, standings/scorers 10min
- **Los datos en vivo se activan el 11 de junio 2026** (inicio del torneo)
- Funciones: `getLiveMatches`, `getTodayMatches`, `getStandings`, `getTopScorers`, `getTopAssists`, `getMatchDetail`, `getEventIcon`

---

## Proxy IA — `api/analyze.js`

Serverless function de Vercel que hace de proxy hacia Anthropic para no exponer la clave en el frontend.

**Características:**
- Modelo: `claude-haiku-4-5-20251001`
- Retry exponencial en error 529 (overloaded): 1.5s → 3s → 6s (máx 3 intentos)
- Soporta **dos modos**:
  - `stream: true` → responde `text/event-stream` (SSE) — proxea el stream directamente
  - `stream: false` (default) → responde JSON `{ text, matchId }`
- Acepta `{ system, message, stream, matchId }` en el body

---

## Hook `useAnalysis` — `src/hooks/useAnalysis.js`

Hook React para consumir `/api/analyze` con streaming.

```js
const { text, streaming, loading, error, ask, reset } = useAnalysis()

ask({ system, message, matchId })
```

- **Cache en memoria** por sesión: clave `"${matchId}:${message}"` — no repite llamadas
- Parsea SSE línea a línea: extrae `content_block_delta.text_delta`
- `streaming` (bool) es distinto de `loading` para mostrar cursor mientras llega texto
- `reset()` cancela la petición en curso y limpia el estado

---

## Componente `MatchAI` — `src/components/ui/MatchAI.jsx`

Usado en `MatchDetail.jsx` (tab "Análisis IA"). Tiene dos secciones:

1. **Simulación Monte Carlo** — modelo Poisson con ranking FIFA + historial mundialista.
   Opciones: 1k / 5k / 10k / 50k iteraciones. Muestra probabilidades, marcadores más probables, porcentaje "ambos anotan", arcos en 0.

2. **Análisis Claude** — usa `useAnalysis`. La respuesta se renderiza con `react-markdown` + componentes Tailwind (`MD_COMPONENTS`): párrafos, negritas, listas, encabezados, código inline. Cursor parpadeante durante streaming.

---

## Bundle (estado post-optimización)

| Chunk | Tamaño (gzip) | Cuándo carga |
|-------|--------------|--------------|
| `index-*.js` (main) | 67.9 kB | Siempre |
| `TeamDetail-*.js` | 43.7 kB | Al visitar `/equipos/:code` |
| `MatchDetail-*.js` | 44.5 kB | Al visitar `/partido/:id` (incluye react-markdown) |
| `history-*.js` | 1.5 kB | Con TeamDetail y MatchDetail |
| `Dashboard-*.js` | 3.8 kB | Al visitar `/` |
| Resto de páginas | 1–3 kB c/u | Bajo demanda |

> Antes de la optimización el main bundle era 535 kB. Ahora es 226 kB (-58%).
> `squads.js` (1.248 jugadores) está en el chunk `TeamDetail`, no en el main bundle.

---

## Commits recientes

```
375f60f feat: renderizar análisis IA con react-markdown
3c3efc8 feat: lazy load páginas, hook useAnalysis con streaming y fixes móvil
6b1c2e0 fix: corregir nombre modelo Claude en proxy
eaf1819 fix: parseo respuesta IA en frontend
c07e766 fix: parseo body en funcion serverless
39b887f fix: limpiar vercel.json conflicto rutas SPA
```

---

## Estado de los datos estáticos

- **`groups.js`** — 12 grupos (A–L), 48 equipos con `code`, `name`, `iso2`, `confederation`, `fifaRanking`, `points`, `played`, `won`, `drawn`, `lost`, `gf`, `ga`, `gd`
- **`matches.js`** — 104 partidos: 72 fase de grupos + 32 eliminatorias. Campos: `id`, `date`, `time` (ET), `homeTeam`, `awayTeam`, `homeScore`, `awayScore`, `status`, `group`, `matchday`, `venue`, `city`, `country`
- **`squads.js`** — `SQUADS[code].{ coach, avgAge, players[] }`. Cada jugador: `number`, `position`, `name`, `shirtName`, `birth`, `age`, `club`, `height`
- **`history.js`** — `HISTORY[code].{ participations, matches, won, drawn, lost, gf, gc, titles, runnerUp, semis, quarters, best }`
- **`teamIds.js`** — `TEAM_IDS[code]` → ID numérico de API-Football (para logos)
- **`venues.js`** — `VENUES_BY_NAME[name].{ city, country, capacity, surface }`

---

## Pendientes / ideas para próximas sesiones

- [ ] Optimizar el bundle de `MatchDetail` (146 kB minificado) — react-markdown pesa bastante; evaluar alternativa más liviana
- [ ] Página de perfil de jugador individual desde la convocatoria
- [ ] Push notifications cuando empieza un partido (Web Push API)
- [ ] SEO: meta tags dinámicos por partido/equipo (`react-helmet` o Vite SSG)
- [ ] PWA: service worker para funcionar offline con datos estáticos
- [ ] Fase eliminatoria: actualizar `Bracket.jsx` con resultados reales después del 27 de junio
- [ ] Tests unitarios para `simulateMatch` y `useAnalysis`

---

## Cómo correr el proyecto

```bash
# Desarrollo
npm run dev          # http://localhost:5173

# Build de producción
npm run build        # genera dist/

# Preview del build
npm run preview
```

> El deploy a producción es automático: `git push origin main` → Vercel despliega.
