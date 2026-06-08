# CONTEXTO.md — marcagol.live · Mundial 2026

Estado completo del proyecto para continuar en futuros chats sin perder contexto.
Última actualización: **2026-06-08** · Commit HEAD: `dd9a6f5`

---

## 1. Proyecto

**marcagol.live** — plataforma de seguimiento del Mundial FIFA 2026 (48 selecciones, 104 partidos).

| Campo | Valor |
|-------|-------|
| Repo local | `C:\Users\USUARIO\marcagol` |
| GitHub | `https://github.com/conexiondigitalweb/marcagol` |
| Deploy | Vercel, proyecto `marcagolds2026` |
| URL producción | **https://www.marcagol.live** |
| Auto-deploy | No — deploy manual con `npx vercel --prod` |
| Branch principal | `main` |
| Inicio del torneo | **11 de junio 2026** |

---

## 2. Stack

| Capa | Tecnología |
|------|-----------|
| UI | React 18 + React Router 6 |
| Estilos | Tailwind CSS 3 |
| Build | Vite 5 |
| Markdown | react-markdown 10 (en MatchAI, lazy) |
| Deploy | Vercel (SPA + Serverless Functions en `/api/`) |
| API datos en vivo | API-Football v3 (`v3.football.api-sports.io`) · Plan Pro · 7500 req/día |
| API IA | Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) vía proxy serverless |
| Banderas | flagcdn.com |
| Fotos jugadores | media.api-sports.io (solo vía proxy serverless `/api/player`) |

---

## 3. Estructura de archivos

```
marcagol/
├── api/
│   ├── analyze.js        # Proxy → Anthropic (streaming SSE + retry 529)
│   ├── player.js         # Proxy → API-Football /players (oculta API key)
│   └── _rateLimit.js     # Rate limiting in-memory por IP (compartido)
├── src/
│   ├── main.jsx
│   ├── App.jsx           # 14 rutas, todas lazy + Suspense
│   ├── context/
│   │   ├── AppContext.jsx         # liveMatches (estático), selectedCountry
│   │   └── PredictionsContext.jsx
│   ├── components/ui/
│   │   ├── MatchAI.jsx   # Monte Carlo + análisis Claude streaming
│   │   └── ...
│   ├── data/
│   │   ├── groups.js
│   │   ├── matches.js
│   │   ├── squads.js     # 1.248 jugadores oficiales FIFA (7-jun-2026)
│   │   ├── history.js
│   │   ├── teamIds.js    # Verificados 8-jun-2026 (ver §7)
│   │   ├── liveData.js   # getLiveMatches (WC only), getMatchDetail, getEventIcon...
│   │   ├── broadcast.js
│   │   └── venues.js
│   ├── hooks/
│   │   ├── useLiveData.js     # useMatchDetail, useLiveMatches, useStandings...
│   │   ├── useAnalysis.js     # Streaming SSE + cache por matchId:question
│   │   └── usePlayerData.js   # Datos jugador con cache 24h localStorage
│   ├── pages/
│   │   ├── Dashboard.jsx      # Live scores (polling con startLivePolling)
│   │   ├── MatchDetail.jsx    # Detalle partido WC + partido externo en vivo
│   │   ├── PlayerProfile.jsx  # Perfil jugador: squads.js + API foto/stats
│   │   └── ... (resto de páginas)
│   └── services/
│       ├── api.js        # Cliente API-Football directo (standings, goleadores)
│       └── liveData.js   # getLiveMatches con fallback live=all, startLivePolling
├── vercel.json           # Rewrites SPA + headers de seguridad
└── CONTEXTO.md
```

---

## 4. Rutas

| Ruta | Página | Notas |
|------|--------|-------|
| `/` | Dashboard | Live scores polling activo |
| `/grupos` | Groups | |
| `/grupos/:id` | GroupDetail | `:id` letra A–L |
| `/llaves` | Bracket | |
| `/equipos` | Teams | |
| `/equipos/:code` | TeamDetail | `:code` código FIFA (ARG, BRA…) |
| `/jugador/:team/:number` | PlayerProfile | `:number` = dorsal |
| `/predicciones` | Predictions | |
| `/calendario` | Schedule | |
| `/partido/:id` | MatchDetail | `:id` numérico de `matches.js` **o** fixture_id de API |
| `/noticias` | News | |
| `/donde-ver` | Broadcast | |
| `/historia` | History | |
| `/goleadores` | Scorers | |

Todas las páginas son **lazy** (`React.lazy` + `Suspense`).

---

## 5. Variables de entorno

| Variable | Entornos Vercel | Uso |
|----------|----------------|-----|
| `VITE_API_FOOTBALL_KEY` | Production, Preview | API-Football (player proxy + live data cliente) |
| `VITE_ANTHROPIC_KEY` | Production, Preview | Anthropic (analyze proxy) |
| `ANTHROPIC_API_KEY` | Production, Preview | Fallback Anthropic |

**`.env.local` (no commiteado):**
```
VITE_API_FOOTBALL_KEY=217e3ccfd4e714fba62caf18ed3ef01d
VITE_ANTHROPIC_KEY=...
ANTHROPIC_API_KEY=...
```

> **Exposición pendiente:** `VITE_API_FOOTBALL_KEY` está en el bundle del cliente vía `src/services/liveData.js` y `src/services/api.js`. También hardcodeada en `src/pages/MatchDetail.jsx` línea 17 y en `src/data/liveData.js` línea 5. Para eliminarla del bundle: proxear esas llamadas a serverless y renombrar a `API_FOOTBALL_KEY` (sin prefijo `VITE_`).

---

## 6. Serverless functions (`/api/`)

### `/api/analyze.js`
- **POST** `{ system, message, stream, matchId }`
- Proxy a Anthropic Claude Haiku 4.5. Streaming SSE. Retry exponencial en 529.
- Rate limit: **10 req/min por IP**
- Sanitización: message ≤ 500 chars, system ≤ 3000 chars

### `/api/player.js`
- **GET** `?name=&teamId=&season=`
- Proxy a `v3.football.api-sports.io/players`. Oculta API key del cliente.
- Rate limit: **20 req/min por IP**
- Cache CDN: `s-maxage=3600, stale-while-revalidate=21600`

### `/api/_rateLimit.js`
- Rate limiter in-memory por IP — un Map por instancia de función, cleanup cada 60s

---

## 7. `teamIds.js` — IDs de API-Football

Verificados el 8-jun-2026 contra `/teams?league=1&season=2026`.
35 de 48 estaban incorrectos; 4 duplicados críticos eliminados.

```js
ARG:26, BRA:6,   URU:7,    COL:8,    ECU:2382, PRY:2380,
FRA:2,  GER:25,  ENG:10,   ESP:9,    POR:27,   NED:1118,
BEL:1,  CRO:3,   SUI:15,   AUT:775,  SCO:1108, TUR:777,
CZE:770, NOR:1090, SWE:5,  BIH:1113,
USA:2384, MEX:16, CAN:5529, PAN:11,  HTI:2386, CUW:5530,
MAR:31, SEN:13,  ALG:1532, EGY:32,   GHA:1504, CIV:1501,
ZAF:1531, COD:1508,
JPN:12, KOR:17,  KSA:23,   IRN:22,   AUS:20,   QAT:1569,
JOR:1548, IRQ:1567, UZB:1568,
NZL:4673, CPV:1533, TUN:28
```

---

## 8. Live scores — flujo completo

### `src/services/liveData.js`
- URL: `v3.football.api-sports.io` — acceso directo desde cliente
- Liga: `league=1` (WC 2026), `season=2026`
- `getLiveMatches()`: busca partidos del WC en vivo; si no hay, fallback a `/fixtures?live=all` (⚠️ TEMPORAL pre-Mundial)
- `startLivePolling(onData)`: llama a `getLiveMatches()` y repite cada 60s si hay partidos, 5min si no

### `Dashboard.jsx`
- `useEffect` arranca `startLivePolling` **inmediatamente** (sin guardia de fecha)
- Muestra `ApiMatchCard` para partidos de la API, `MatchCard` para los estáticos
- Clic en `ApiMatchCard` navega a `/partido/{fixture_id}`

---

## 9. `MatchDetail.jsx` — dos modos

### Partido del Mundial (`:id` está en `matches.js`)
- Muestra `MatchHeader` con info completa (estadio, árbitro, canales TV)
- Datos en vivo: `useMatchDetail(id)` → `getMatchDetail` de `src/data/liveData.js`
  - ⚠️ `data/liveData.js` usa URL antigua `v3.api-football.com` (bug pre-existente)
  - Tabs: minuto a min · estadísticas · alineaciones · Análisis IA

### Partido externo (`:id` es fixture_id de API, NO está en `matches.js`)
- Hook `useExternalMatchData(fixtureId, enabled)` gestiona 4 polls independientes:

| Stream | Intervalo | Endpoint |
|--------|-----------|----------|
| Marcador/fixture | 30 s | `/fixtures?id={id}` |
| Eventos | 45 s | `/fixtures/events?fixture={id}` |
| Estadísticas | 60 s | `/fixtures/statistics?fixture={id}` |
| Alineaciones | 5 min | `/fixtures/lineups?fixture={id}` |

- **Stop automático** cuando `status` es `HT`, `FT`, `AET` o `PEN` — `statusRef` (ref mutable) evita closure stale
- Muestra `ExternalMatchHeader` con logos, marcador, minuto, estadio, árbitro
- Tabs: minuto a min · estadísticas · alineaciones (sin IA — no hay códigos FIFA)

---

## 10. `getEventIcon` — tabla completa de tipos

```
Goal + Normal Goal      → ⚽  Gol
Goal + Penalty          → ⚽  Gol de penal
Goal + Own Goal         → ⚽  Gol en contra
Goal + Missed Penalty   → ❌  Penal fallado
Card + Yellow           → 🟨  Tarjeta amarilla
Card + Yellow Red       → 🟥  Doble amarilla / Expulsión
Card + Red              → 🟥  Tarjeta roja
subst                   → 🔄  Sustitución
Var + disallowed        → ❌  Gol anulado por VAR
Var + confirmed         → ✅  Gol confirmado por VAR
Var + card              → 📺  Tarjeta revisada por VAR
Var + penalty           → 📺  Penalti revisado por VAR
Var (genérico)          → 📺  Revisión VAR
Corner                  → 🏁  Tiro de esquina
Shot on Goal            → 🎯  Tiro al arco
Penalty                 → 🥊  Penalti
```

`EventRow`: sustituciones muestran `↑ jugador entra` (verde) y `↓ jugador sale`. Minuto con tiempo extra (`45+2'`). Alineación izquierda/derecha según `homeId` del fixture.

---

## 11. Perfil de jugador

**Ruta:** `/jugador/:team/:number`

- Datos base: `SQUADS[team].players.find(p => p.number == number)`
- Hook `usePlayerData(name, teamId)`:
  - Llama a `/api/player` (proxy serverless)
  - Temporada: busca 2025 primero; si appearances ≤ 5, prueba 2026; usa la con más datos
  - Cache 24h localStorage: `marcagol_player_{teamId}_{apellido}`
- Foto circular + fallback: bandera del país (flagcdn.com)
- Stats: partidos, minutos, goles, asistencias, remates, regates, pases clave, tarjetas

---

## 12. Seguridad

### Headers HTTP (`vercel.json`)
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy:
  default-src 'self'; script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://flagcdn.com https://media.api-sports.io;
  connect-src 'self' https://v3.football.api-sports.io;
  frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

### Input del usuario (`MatchAI`)
- Límite 500 chars en UI y serverless; strip control chars; contador visible al >80%

---

## 13. Bundle (build de producción — 8-jun-2026)

| Chunk | gzip |
|-------|------|
| `index-*.js` (main) | 68 kB |
| `squads-*.js` | 40 kB |
| `MatchDetail-*.js` | 46 kB |
| `TeamDetail-*.js` | 4 kB |
| `Dashboard-*.js` | 4 kB |
| Resto de páginas | 1–4 kB |

---

## 14. Commits de esta sesión (8-jun-2026)

```
dd9a6f5  feat: mejorar eventos minuto a minuto en partido externo
88f8999  feat: polling diferenciado y tabs funcionales en partido externo
50f0342  feat: mostrar partidos en vivo externos (no-WC) en MatchDetail
cb48ca3  feat: fallback live=all en liveData para pruebas pre-Mundial
e260b0e  security: headers HTTP, rate limiting y sanitización de inputs
733cf15  fix: eliminar logo API-Football en detalle de equipo
cae80d5  fix: corregir 35/48 IDs API-Football (4 duplicados críticos)
ac0bab2  feat: proxy serverless /api/player para ocultar API key
2b1cbf3  fix: SPA rewrites vercel.json + fallback bandera en perfil jugador
69fc93d  feat: página de perfil de jugador con foto y stats
```

---

## 15. Pendientes / deuda técnica

1. **Eliminar fallback `live=all`** en `src/services/liveData.js` cuando empiece el Mundial (11-jun-2026)
2. **Proxear live data** a serverless — eliminar `VITE_API_FOOTBALL_KEY` del bundle cliente
3. **Corregir URL** en `src/data/liveData.js`: usa `v3.api-football.com` (antigua); debería ser `v3.football.api-sports.io`
4. **Conectar marcador en vivo** en `MatchDetail` para partidos del Mundial (actualmente `liveMatchData = null`)
5. **Mapeo `match.id` → fixture_id** de API-Football para los 104 partidos del WC
6. **Auto-deploy** desde GitHub (actualmente manual)
7. **Rate limiting distribuido** — el actual es in-memory por instancia

---

## 16. Comandos frecuentes

```bash
npm run dev              # Dev en http://localhost:5173
npm run build            # Build producción → dist/
npx vercel --prod        # Deploy a producción
npx vercel env ls        # Ver variables de entorno
git push origin main     # Push (deploy manual tras eso)
```
