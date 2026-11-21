// Prueba rápida de la API con un usuario demo:
//   node --env-file=.env scripts/probar-api.mjs <email> [ruta] [METODO]
// Ej: node --env-file=.env scripts/probar-api.mjs diana.cardona@obraclara.test /proyectos
import { createClient } from '@supabase/supabase-js'

const [email, ruta = '/me', metodo = 'GET'] = process.argv.slice(2)
const base = process.env.API_URL ?? `http://localhost:${process.env.API_PORT ?? 3001}/api`

if (!email) {
  console.error('Uso: node --env-file=.env scripts/probar-api.mjs <email> [ruta] [METODO]')
  process.exit(1)
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
const { data, error } = await supabase.auth.signInWithPassword({ email, password: process.env.SEED_PASSWORD })
if (error) {
  console.error('✖ Login:', error.message)
  process.exit(1)
}

const respuesta = await fetch(base + ruta, {
  method: metodo.toUpperCase(),
  headers: { Authorization: `Bearer ${data.session.access_token}` },
})
console.log(`${metodo.toUpperCase()} ${ruta} → ${respuesta.status}`)
console.log(JSON.stringify(await respuesta.json(), null, 2))