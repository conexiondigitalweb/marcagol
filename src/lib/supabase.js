import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase env vars missing:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey })
}

export const supabase = createClient(supabaseUrl, supabaseKey)
export const supabaseReady = !!(supabaseUrl && supabaseKey)
