# CONTEXTO.md — marcagol.live · Mundial 2026

Estado completo del proyecto para continuar en futuros chats sin perder contexto.
Última actualización: **2026-06-08** · Commit HEAD: `cb48ca3`

---

## 1. Proyecto

**marcagol.live** — plataforma de seguimiento del Mundial FIFA 2026 (48 selecciones, 104 partidos).

| Campo | Valor |
|-------|-------|
| Repo local | `C:\Users\USUARIO\marcagol` |
| GitHub | `https://github.com/conexiondigitalweb/marcagol` |
| Deploy | Vercel, proyecto `marcagol2026` |
| Auto-deploy | **No** — cada deploy es manual con `npx vercel --prod` |
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
| Fotos jugadores | media.api-sports.io (solo via proxy serverless) |

---

## 3. Estructura de archivos

```
marcagol/
├── api/
│   ├── analyze.js            # Proxy → Anthropic (streaming SSE + retry 529)
│   ├── player.js             # Proxy → API-Football /players (oculta API key)
│   └── _rateLimit.js         # Utilidad rate limiting in-memory por IP
├── src/
│   ├── main.jsx
│   ├── App.jsx               # 14 rutas, todas lazy + Suspense
│   ├── context/
│   │   ├── AppContext.jsx
│   │   └── PredictionsContext.jsx
│   ├── components/ui/
│   │   ├── MatchAI.jsx       # Monte Carlo + análisis Claude streaming
│   │   └── ...
│   ├── data/
│   │   ├── groups.js
│   │   ├── matches.js
│   │   ├── squads.js         # 1.248 jugadores oficiales FIFA (7-jun-2026)
│   │   ├── history.js
│   │   ├── teamIds.js        # Verificados el 8-jun-2026 (ver §7)
│   │   ├── broadcast.js
│   │   └── venues.js
│   ├── hooks/
│   │   ├── useLiveData.js
│   │   ├── useAnalysis.js
│   │   └── usePlayerData.js  # Datos de jugador con cache 24h localStorage
│   ├── pages/
│   │   ├── PlayerProfile.jsx # Perfil jugador: squads.js + API-Football foto/stats
│   │   └── ... (resto de páginas)
│   └── services/
│       ├── api.js            # Cliente API-Football directo (live scores, standings)
│       └── liveData.js       # Polling partidos en vivo
├── vercel.json               # Rewrites SPA + headers seguridad
└── CONTEXTO.md
```

---

## 4. Rutas

| Ruta | Página | Notas |
|------|--------|-------|
| `/` | Dashboard | Countdown + live scores |
| `/grupos` | Groups | |
| `/grupos/:id` | GroupDetail | `:id` letra A–L |
| `/llaves` | Bracket | |
| `/equipos` | Teams | |
| `/equipos/:code` | TeamDetail | `:code` código FIFA (ARG, BRA…) |
| `/jugador/:team/:number` | PlayerProfile | `:number` = dorsal (URL-safe) |
| `/predicciones` | Predictions | |
| `/calendario` | Schedule | |
| `/partido/:id` | MatchDetail | `:id` numérico de `matches.js` |
| `/noticias` | News | |
| `/donde-ver` | Broadcast | |
| `/historia` | History | |
| `/goleadores` | Scorers | |

Todas las páginas son **lazy** (`React.lazy` + `Suspense`).

---

## 5. Variables de entorno

| Variable | Entornos Vercel | Uso |
|----------|----------------|-----|
| `VITE_API_FOOTBALL_KEY` | Production, Preview | API-Football (player proxy server-side + live data cliente) |
| `VITE_ANTHROPIC_KEY` | Production, Preview | Anthropic (analyze proxy) |
| `ANTHROPIC_API_KEY` | Production, Preview | Fallback Anthropic |

**En `.env.local` (no commiteado):**
```
VITE_API_FOOTBALL_KEY=217e3ccfd4e714fba62caf18ed3ef01d
VITE_ANTHROPIC_KEY=...
ANTHROPIC_API_KEY=...
```

> **Exposición pendiente:** `VITE_API_FOOTBALL_KEY` aparece en el bundle del cliente vía `src/services/liveData.js` y `src/services/api.js` (partidos en vivo, standings, goleadores). Para eliminarla del bundle: proxear esas llamadas a serverless y renombrar la variable a `API_FOOTBALL_KEY` (sin prefijo `VITE_`).

---

## 6. Serverless functions (`/api/`)

### `/api/analyze.js`
- **POST** `{ system, message, stream, matchId }`
- Proxy a Anthropic Claude Haiku 4.5
- Rate limit: **10 req/min por IP**
- Sanitización: message ≤ 500 chars, system ≤ 3000 chars, strip control chars `\x00-\x08\x0B\x0C\x0E-\x1F\x7F`
- Soporta streaming SSE (`stream: true`)
- Retry exponencial en error 529: 1.5s → 3s → 6s (máx 3 intentos)

### `/api/player.js`
- **GET** `?name=&teamId=&season=`
- Proxy a `v3.football.api-sports.io/players`
- Rate limit: **20 req/min por IP**
- Validación: `teamId` numérico, `season` 4 dígitos
- Cache CDN: `s-maxage=3600, stale-while-revalidate=21600`
- Retorna `data.response ?? []`

### `/api/_rateLimit.js`
- Rate limiter in-memory por IP (Map con cleanup automático cada 60 s)
- **No distribuido** — suficiente para protección básica (una Map por instancia de función)

---

## 7. `teamIds.js` — IDs de API-Football

Todos los IDs fueron verificados el 8-jun-2026 contra `/teams?league=1&season=2026`.  
**35 de 48 estaban incorrectos en la versión anterior**, incluyendo 4 duplicados críticos:

| Problema anterior | Corrección |
|---|---|
| USA = FRA = 2 | FRA: 2, USA: 2384 |
| ARG = AUS = 26 | ARG: 26, AUS: 20 |
| PRY = POR = 27 | POR: 27, PRY: 2380 |
| BRA = UZB = 6 | BRA: 6, UZB: 1568 |

IDs correctos actuales:
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

## 8. Perfil de jugador — flujo completo

**Ruta:** `/jugador/:team/:number` (`:number` = dorsal, URL-safe)

**`src/pages/PlayerProfile.jsx`:**
- Busca en `SQUADS[team].players` por `p.number == number`
- Muestra: nombre, dorsal, posición (badge con color), edad, altura, nacimiento, club
- Llama a `usePlayerData(player.name, TEAM_IDS[code])`
- Photo circular con borde color-posición; fallback: bandera del país (flagcdn.com)
- Stats: partidos, minutos, goles, asistencias, remates, regates, pases clave, tarjetas

**`src/hooks/usePlayerData.js`:**
- Llama a `/api/player` (proxy serverless, no a api-sports.io directamente)
- Cache 24 h en localStorage: clave `marcagol_player_{teamId}_{apellido_lowercase}`
- Lógica de temporada:
  1. Busca `season=2025`; si appearances > 5 → usa esos datos
  2. Si no, busca `season=2026`; usa la temporada con más appearances
- Retorna `{ photo, stats, season, loading, notFound }`

**`src/pages/TeamDetail.jsx`:**
- Cada tarjeta de jugador es `<Link to="/jugador/{code}/{number}">` con hover
- Se eliminó el logo/escudo de API-Football (dejando solo la bandera de flagcdn.com)

---

## 9. Datos en vivo (`src/services/liveData.js`)

- **API:** `v3.football.api-sports.io` — acceso directo desde cliente (key en bundle VITE_)
- **Liga:** `league=1` (FIFA World Cup 2026), `season=2026`
- **Polling:** 60 s si hay partidos en vivo; 5 min si no hay
- **⚠️ Fallback TEMPORAL:** si no hay partidos del Mundial en vivo, busca `/fixtures?live=all` sin filtro de liga. Para pruebas pre-torneo con amistosos. **Eliminar cuando empiece el Mundial (11-jun-2026).**
- Francia vs Irlanda del Norte (fixture `1542183`) verificado como partido de prueba live el 8-jun-2026

---

## 10. Seguridad

### Headers HTTP (vercel.json)
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy:
  default-src 'self'
  script-src 'self' 'unsafe-inline'
  style-src 'self' 'unsafe-inline'
  img-src 'self' data: https://flagcdn.com https://media.api-sports.io
  connect-src 'self' https://v3.football.api-sports.io
  frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

### `vercel.json` (estructura completa)
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [{ "source": "/(.*)", "headers": [ ... ] }]
}
```
Los rewrites son necesarios para que `/jugador/COL/5` no dé 404 al recargar.

### Input del usuario (MatchAI)
- Límite 500 chars en UI y en serverless
- Strip control chars en frontend antes de enviar
- Contador visible al >80% del límite

---

## 11. Proxy IA — `api/analyze.js`

- **Modelo:** `claude-haiku-4-5-20251001`
- **Rate limit:** 10 req/min por IP
- **Sanitización:** strip `[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]`, message ≤ 500, system ≤ 3000
- **Streaming SSE:** proxea el stream de Anthropic directamente al cliente
- **Retry:** exponencial en 529: 1.5s → 3s → 6s (máx 3 intentos)

---

## 12. Hook `useAnalysis` — `src/hooks/useAnalysis.js`

```js
const { text, streaming, loading, error, ask, reset } = useAnalysis()
ask({ system, message, matchId })
reset()
```
- Cache en memoria por `"${matchId}:${message}"` — no repite llamadas iguales
- `streaming` = llegando tokens; `loading` = esperando primera respuesta
- `AbortController` para cancelar

---

## 13. Componente `MatchAI` — `src/components/ui/MatchAI.jsx`

**Sección 1 — Simulación Monte Carlo:**
- Modelo Poisson con ranking FIFA + historial de `history.js`
- `poissonRandom(lambda)` — método Knuth, máx 8 goles
- Opciones: 1k / 5k / 10k / 50k simulaciones
- Output: % local/empate/visita, top 5 marcadores, % ambos anotan, % arco en 0

**Sección 2 — Análisis Claude:**
- Usa `useAnalysis()` con contexto del partido + resultado Monte Carlo
- Renderizado con `<ReactMarkdown>` y `MD_COMPONENTS` Tailwind
- Cursor parpadeante `animate-pulse` durante streaming
- 4 preguntas sugeridas como botones

---

## 14. Bundle

| Chunk | Minificado | gzip | Cuándo carga |
|-------|-----------|------|--------------|
| `index-*.js` (main) | ~226 kB | ~68 kB | Siempre |
| `TeamDetail-*.js` | ~188 kB | ~44 kB | Al visitar `/equipos/:code` — incluye squads.js |
| `PlayerProfile-*.js` | pequeño | pequeño | Al visitar `/jugador/:team/:number` |
| `MatchDetail-*.js` | ~146 kB | ~45 kB | Al visitar `/partido/:id` — incluye react-markdown |
| Resto de páginas | 3–12 kB | 1–4 kB | Bajo demanda |

---

## 15. Comandos frecuentes

```bash
npm run dev                  # Dev en http://localhost:5173
npm run build                # Build producción → dist/
npx vercel --prod            # Deploy a producción
npx vercel env ls            # Ver variables de entorno configuradas
git push origin main         # Push (deploy manual tras push)
```

---

## 16. Pendientes / deuda técnica

1. **Eliminar fallback `live=all`** en `liveData.js` cuando empiece el Mundial (11-jun-2026)
2. **Proxear live data** a serverless para eliminar `VITE_API_FOOTBALL_KEY` del bundle cliente (renombrar a `API_FOOTBALL_KEY`)
3. **Auto-deploy** desde GitHub (actualmente deploy manual)
4. **Rate limiting distribuido** — el actual es in-memory por instancia de función
5. **Fotos de jugadores poco conocidos** — búsqueda por apellido falla para apellidos comunes o no indexados

---

## 17. Commits de esta sesión (8-jun-2026)

```
cb48ca3  feat: fallback live=all en liveData para pruebas pre-Mundial
e260b0e  security: headers HTTP, rate limiting y sanitización inputs
733cf15  fix: eliminar logo API-Football en detalle de equipo
cae80d5  fix: corregir 35/48 IDs API-Football (4 duplicados críticos)
ac0bab2  feat: proxy serverless /api/player para ocultar API key
2b1cbf3  fix: SPA rewrites vercel.json + fallback bandera en perfil jugador
69fc93d  feat: página de perfil de jugador con foto y stats de API-Football
```
