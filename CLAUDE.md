# CONTEXTO MARCAGOL.LIVE - CLAUDE CODE (actualizado 22-jun-2026)

## PROYECTO
- **URL:** marcagol.live — PWA del Mundial 2026
- **GitHub:** github.com/conexiondigitalweb/marcagol
- **Vercel:** marcagols2026 (auto-deploy desde main)
- **Stack:** React + Vite + Tailwind
- **Carpeta local:** C:\Users\USUARIO\marcagol

## APIS
- **API-Football:** plan ULTRA 75,000 req/día. Endpoint: v3.football.api-sports.io. Mundial = league=1, season=2026
- **Anthropic:** serverless /api/analyze.js con retry backoff + streaming + claude-haiku-4-5-20251001
- **Proxy /api/football.js** oculta la API key. TTLs:
  - live: 20s
  - events: 10s
  - lineups: 30s
  - statistics: 60s
  - fixtures FT: 7200s (2h)
  - fixtures date=hoy: 60s
  - standings live: 60s
  - standings normal: 300s
  - scorers/assists: 120s
  - estadisticas-mundial: 300s
- **Proxy /api/news.js** para GNews con caché 15min
- **Proxy /api/player.js** para perfiles de jugadores
- **Proxy /api/polla.js** para operaciones Supabase: crear, votar, detalle, mis-pollas, cerrar, reabrir, eliminar-voto, reclamar, activas, cerrar-automatico
- **/api/football.js action=fixtures-status** para verificar estado FT de partidos (usado por cierre automático de pollas)
- **/api/football.js action=estadisticas-mundial** calcula estadísticas del torneo desde eventos FT en Redis

## VARIABLES DE ENTORNO EN VERCEL
- VITE_API_FOOTBALL_KEY ✅
- VITE_ANTHROPIC_KEY ✅
- ANTHROPIC_API_KEY ✅
- GNEWS_KEY ✅
- VITE_SUPABASE_URL ✅ (All Environments)
- VITE_SUPABASE_ANON_KEY ✅ (All Environments)
- SUPABASE_URL ✅
- SUPABASE_ANON_KEY ✅
- SUPABASE_SERVICE_ROLE_KEY ✅
- KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN, KV_REST_API_READ_ONLY_TOKEN ✅ (Upstash Redis via Vercel Marketplace)

## INFRAESTRUCTURA
- **Supabase:** proyecto Marcagol.live (qgomitqncgnkjojubghd.supabase.co) — East US North Virginia
- **Upstash Redis:** upstash-kv-champagne-house — caché serverless para API-Football
- **Vercel KV** integrado con marcagols2026
- **RLS desactivado** en tablas pollas y votos (datos públicos, sin info sensible)

## TABLAS SUPABASE
- **pollas:** id, partido_id, equipo_local, equipo_visitante, fecha_partido, creador_nombre, permite_repetir, max_repeticiones, activa, publica, token_admin, created_at
- **votos:** id, polla_id, participante_nombre, goles_local, goles_visitante, created_at

## FUNCIONALIDADES EN PRODUCCIÓN
1. PWA instalable en Android e iOS con auto-update automático (cuenta regresiva 3s + recarga). skipWaiting: true + clientsClaim: true. Intervalo de check 30s.
2. Datos en vivo: marcador, minuto a minuto, estadísticas, alineaciones
3. Polling diferenciado: eventos 10s, marcador 30s, stats 60s, lineups 30s
4. Polling automático 60s en Home, Calendario, Grupos, GroupDetail, TeamDetail y MatchDetail
5. Alineaciones con sustituciones, amarillas, goleadores, asistidores — AMBOS equipos
6. Bug fix crítico: matching por player.id primero, fallback por nombre cuando IDs difieren entre /lineups y /events
7. Caché permanente localStorage para FT (saveResult() SIEMPRE sobrescribe)
8. Caché serverless Upstash Redis en /api/football.js con TTLs diferenciados
9. Perfil jugador /jugador/:team/:number con foto + stats
10. Countdown ≤3h, banner EN VIVO, banner "El Mundial ha comenzado"
11. Tabla de posiciones en vivo usando rank oficial de API-Football (no recalculamos localmente)
12. Marcador en vivo en TODAS las vistas
13. Predicciones & Quiniela personal con localStorage. Fix: partidos FT sin predicción muestran "No predijiste este partido · 0 pts"
14. Noticias con proxy serverless, deduplicación, fallback
15. Goleadores y Asistidores: fetchAllPages completo, stale-while-revalidate, "Ver 10 más" progresivo, disclaimer de retraso, TTL 120s
16. Nombres equipos en español: teamNames.js con esTeamName()
17. Vercel Analytics activo
18. CSP en vercel.json correctamente configurado
19. Rate limiting en todos los serverless
20. Bundle ~226kb con lazy loading
21. Home "Próximos Partidos": filtro fecha >= hoy Colombia, orden cronológico por timeCol, countdown ≤3h
22. POLLAS DE MARCADOR completas:
    - Públicas vs Privadas: campo publica boolean en Supabase
    - /pollas-activas: tablero público con todas las pollas activas
    - /crear-polla: selector partido, nombre creador, toggle público/privado, reglas
    - /polla/:id: votar, ver predicciones en tiempo real (polling 5s), panel admin
    - /mis-pollas: sección "EN ESTE DISPOSITIVO" + "EN POLLAS QUE PARTICIPÉ" (localStorage wc2026_mis_participaciones)
    - Botón "Ver pollas activas" en Mis Pollas
    - Bloque de pollas en Home debajo de próximos partidos
    - Validación nombre duplicado: error 409 con mensaje amigable en amber
    - Cierre automático al detectar FT via /api/football.js action=fixtures-status (sin cron jobs)
    - Filtro de pollas activas: fecha >= hoy Colombia, excluye partidos terminados
    - Resultados finales con ganadores 🏆, marcador exacto
    - Compartir por WhatsApp
23. Estadísticas dinámicas del Mundial en Home: goles anotados, promedio por partido, partidos jugados N/104, partidos 0-0, equipo más goleador, más goleado, marcador más repetido, autogoles. TTL 300s
24. Scroll automático a fecha actual en Calendario y Predicciones
25. Navegación directa entre grupos A-L en GroupDetail (píldoras con grupo activo en naranja)
26. Ficha de equipo: estadísticas "Mundial 2026" con total acumulado + desglose por fase. Polling standings 60s
27. Gol anulado por VAR: badge ❌ "Gol anulado por VAR" en minuto a minuto
28. Meta tags OG + og-image.png 1200x630px
29. Botón WhatsApp verde en MatchDetail y PollaDetalle
30. Términos y Condiciones en /terminos con link en footer
31. Broadcasts reales por partido Colombia en broadcasts.js
32. Bracket dieciseisavos alineado al sorteo oficial FIFA
33. Vista de Grupos en Home: orden por posición actual + puntos

## COMPORTAMIENTO API-FOOTBALL CONFIRMADO EN PRODUCCIÓN
- player.number es NULL en /fixtures/events — usar player.id para matching
- e.team?.id viene como STRING en eventos, team.team?.id como NUMBER en lineups → siempre usar Number()
- El mismo jugador puede tener IDs DISTINTOS en /lineups vs /events — buscar por ID primero, fallback por nombre
- Alineaciones se publican ~30-45 min antes del kickoff
- Goles pueden aparecer primero como anulados (VAR) — puede tardar ~10 min en procesarse
- /players/topscorers y /players/topassists se actualizan horas después (generalmente medianoche)
- API ya aplica criterios FIFA de desempate en /standings — usar su rank directamente
- API usa IDs distintos para mismo jugador en /lineups vs /events (bug confirmado en producción)

## ARQUITECTURA DE CACHÉ (4 capas)
1. **Service Worker:** Cache-First para assets estáticos. La regla api-football-cache es dead code.
2. **localStorage:** wc2026_ft_fixture_v3_*, wc2026_ft_detail_v3_*, wc2026_results_v1 (saveResult SIEMPRE sobrescribe), marcagol_predictions, wc2026_fixture_map_v2 (2h + invalidación automática si hay equipos TBD resueltos), wc2026_mis_participaciones, token_admin por polla
3. **Memoria cliente (liveData.js cache Map singleton):** live 30s, fixtures 5min, standings 10min, scorers 2min, events 10s, lineups 30s, statistics 60s
4. **KV/Redis (Upstash):** TTLs según endpoint (ver sección APIS)

## ARCHIVOS DE CACHÉ CENTRALIZADOS
- **src/cacheConfig.js** — fuente de verdad única: CACHE_VERSION actual ('1') + todas las 11 cache keys del proyecto
- **src/cacheManager.js** — runCacheInvalidation(version): limpia todas las keys de datos si CACHE_VERSION cambió, preserva keys de usuario

## CÓMO FORZAR LIMPIEZA DE CACHÉ EN PRODUCCIÓN (sin intervención del usuario)
1. Abrir src/cacheConfig.js
2. Incrementar CACHE_VERSION de '1' a '2' (o el número siguiente)
3. Commit y push → deploy automático en Vercel
4. En la próxima carga de cada usuario, localStorage se limpia solo antes de que React renderice

## RIESGOS DE CACHÉ RESUELTOS
- ✅ saveResult() ahora SIEMPRE sobrescribe — correcciones de API-Football se propagan en próxima visita (commit 467791e)
- ✅ FT en KV: TTL reducido de 86400s (24h) a 7200s (2h) — ventana de datos incorrectos acotada (commit 467791e)
- ✅ estadisticas-mundial TTL consistente: L1 memCache y L2 KV ambos en 300s — eliminada ventana de 240s de inconsistencia entre instancias Vercel (commit 467791e)
- ✅ fixtureMap: TTL reducido a 2h + invalidación automática si equipos TBD ya resueltos — cache key v2 (commit fc99e74)
- ✅ Invalidación automática de localStorage por versión de build — runCacheInvalidation(CACHE_VERSION) en main.jsx antes de render. Para forzar limpieza en todos los dispositivos: incrementar CACHE_VERSION en src/cacheConfig.js y hacer deploy. Las keys de usuario (mis_pollas, polla_token_*, polla_nombre, pwa-install-dismissed, wc2026_mis_participaciones) nunca se tocan. (commit 1d1d2b3)

## RIESGOS DE CACHÉ PENDIENTES
- ⚠️ L1 memCache sin sincronización entre instancias Vercel Fluid Compute — requests simultáneos pueden llegar a instancias con estados L1 diferentes (limitado por TTLs cortos)

## ESTRATEGIA DE NEGOCIO
- Fan page: Marcagol.live en Facebook e Instagram (@marcagollive)
- Modelo Freemium: Plan Gratis (hasta 20 participantes), Plan Grupo ($9.900 COP/mes), Plan Empresa ($49.900 COP/mes)
- Pollas: gancho viral principal
- Roadmap post-Mundial: login Google + Supabase → notificaciones push → app nativa Capacitor

## NOTAS TÉCNICAS CRÍTICAS
- Colombia GMT-5 fijo, SIN horario de verano — NUNCA hardcodear UTC o ET
- Siempre usar match.timeCol para ordenar y comparar horas
- Cache keys actuales: wc2026_ft_fixture_v3_* y wc2026_ft_detail_v3_*
- Claude Code puede exponer API keys en pantalla — nunca mostrar valores de keys
- PowerShell puede mostrar basura ANSI — cosmético, no afecta código
- Vercel plan Hobby — NO hay cron jobs disponibles. Usar estrategias client-side o serverless triggers

## ESTILO / DISEÑO
- Logo: punto naranja ● + "marca" blanco + "gol" #38BDF8
- Colores: fondo #0F172A, secundario #1E293B, acento #38BDF8, acción #F97316
