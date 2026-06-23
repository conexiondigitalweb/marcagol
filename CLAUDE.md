# marcagol — Notas para Claude Code

## RIESGOS DE CACHÉ RESUELTOS (commit 467791e — 22-jun-2026)
- ✅ saveResult() ahora SIEMPRE sobrescribe — correcciones de API-Football se propagan en próxima visita
- ✅ FT en KV: TTL reducido de 86400s (24h) a 7200s (2h) — ventana de datos incorrectos acotada
- ✅ estadisticas-mundial TTL consistente: L1 memCache y L2 KV ambos en 300s — eliminada ventana de 240s de inconsistencia entre instancias Vercel

## RIESGOS DE CACHÉ PENDIENTES (sin solución aún)
- ⚠️ Sin mecanismo de invalidación remota para localStorage — si API-Football corrige un resultado y el usuario no vuelve a visitar el partido, su caché permanece incorrecta hasta nuevo deploy con bump de cache key
- ⚠️ L1 memCache sin sincronización entre instancias Vercel Fluid Compute — requests simultáneos pueden llegar a instancias distintas con estados L1 diferentes (limitado por TTLs cortos)
- ⚠️ fixtureMap 24h localStorage — links rotos si el mapa se construyó con equipos TBD (partidos eliminatorias antes de definirse)
