import { createClient } from '@supabase/supabase-js'

// Estas variables las leerá Vercel de lo que configuramos en su panel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan las variables de entorno de Supabase")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)