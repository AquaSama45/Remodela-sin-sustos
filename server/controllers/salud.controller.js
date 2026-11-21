// RNF-04: monitoreo de disponibilidad. Verifica la API y la base de datos.
// Un monitor externo (UptimeRobot) lo consulta cada 5 minutos; de paso mantiene
// activo el proyecto de Supabase, que en el plan gratuito se pausa sin uso.
import { clienteSistema } from '../config/supabase.js'

export async function salud(_req, res) {
  let baseDatos = 'sin verificar'
  if (clienteSistema) {
    const { error } = await clienteSistema.from('empresas').select('id', { head: true, count: 'exact' })
    baseDatos = error ? 'caida' : 'ok'
  }
  const ok = baseDatos !== 'caida'
  res.status(ok ? 200 : 503).json({ estado: ok ? 'ok' : 'degradado', baseDatos, hora: new Date().toISOString() })
}