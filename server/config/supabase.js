// Conexión con Supabase (contenedor "Base de Datos" del C4)
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const llavePublica = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !llavePublica) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el .env')
}

const opciones = { auth: { persistSession: false, autoRefreshToken: false } }

// Cliente sin sesión: solo se usa para validar tokens
export const clienteAuth = createClient(url, llavePublica, opciones)

// Cliente "como el usuario": reenvía su token a Supabase,
// así RLS sigue aplicando en cada consulta (RNF-03)
export function clienteDelUsuario(token) {
  return createClient(url, llavePublica, {
    ...opciones,
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}