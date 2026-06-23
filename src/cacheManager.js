export function runCacheInvalidation(version) {
  try {
    const stored = localStorage.getItem('wc2026_cache_version')
    if (stored === version) return // misma versión, nada que hacer

    // Versión nueva detectada — limpiar todas las keys de datos
    const keysToDelete = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      // Limpiar si la key empieza con alguno de los prefijos de datos
      const shouldClear = [
        'wc2026_ft_fixture_v3_',
        'wc2026_ft_detail_v3_',
        'wc2026_results_v1',
        'wc2026_fixture_map_v2',
        'marcagol_player_',
      ].some(prefix => key.startsWith(prefix))
      if (shouldClear) keysToDelete.push(key)
    }
    keysToDelete.forEach(key => localStorage.removeItem(key))

    // Guardar nueva versión
    localStorage.setItem('wc2026_cache_version', version)
    console.log(`[CacheManager] Caché limpiado. Versión anterior: ${stored ?? 'ninguna'} → Nueva: ${version}. Keys eliminadas: ${keysToDelete.length}`)
  } catch (e) {
    // localStorage puede fallar en modo privado — ignorar silenciosamente
    console.warn('[CacheManager] Error al invalidar caché:', e)
  }
}
