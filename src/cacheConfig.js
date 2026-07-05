// Versión global de caché — incrementar con cada deploy que requiera limpiar localStorage
export const CACHE_VERSION = '3'

// Todas las cache keys del proyecto — fuente de verdad única
export const CACHE_KEYS = {
  // Keys de versión
  VERSION: 'wc2026_cache_version',

  // Keys de datos de API (se limpian al cambiar CACHE_VERSION)
  FT_FIXTURE_PREFIX: 'wc2026_ft_fixture_v3_',
  FT_DETAIL_PREFIX: 'wc2026_ft_detail_v3_',
  RESULTS: 'wc2026_results_v1',
  FIXTURE_MAP: 'wc2026_fixture_map_v2',
  PLAYER_PREFIX: 'marcagol_player_',

  // Keys de usuario (NUNCA se limpian — son datos del usuario)
  PREDICTIONS: 'marcagol_predictions',
  MIS_PARTICIPACIONES: 'wc2026_mis_participaciones',
  MIS_POLLAS: 'mis_pollas',
  POLLA_TOKEN_PREFIX: 'polla_token_',
  POLLA_NOMBRE: 'polla_nombre',
  PWA_INSTALL_DISMISSED: 'pwa-install-dismissed',
}

// Prefijos que se limpian por versión — SOLO datos de API, NUNCA datos del usuario
export const CACHE_PREFIXES_TO_CLEAR = [
  'wc2026_ft_fixture_v3_',
  'wc2026_ft_detail_v3_',
  'wc2026_results_v1',
  'wc2026_fixture_map_v2',
  'marcagol_player_',
]
