import { procesarCola } from '../notificaciones/correo.service.js'

// Reintento manual de la cola (los envíos normales ocurren tras cada operación)
export async function procesar(_req, res) {
  res.json(await procesarCola())
}