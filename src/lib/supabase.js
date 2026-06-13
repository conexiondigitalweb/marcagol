import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[supabase.js] Variables de entorno faltantes.\n' +
    '  VITE_SUPABASE_URL:      ' + (supabaseUrl  || 'UNDEFINED') + '\n' +
    '  VITE_SUPABASE_ANON_KEY: ' + (supabaseKey  ? '✓ presente' : 'UNDEFINED') + '\n' +
    'Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel → Settings → Environment Variables.'
  )
}

export const supabase = createClient(supabaseUrl ?? 'http://localhost', supabaseKey ?? 'missing')
export const supabaseReady = !!(supabaseUrl && supabaseKey)
