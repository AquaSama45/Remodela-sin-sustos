import * as acuerdo from '../services/acuerdo.service.js'
import { procesarCola } from '../notificaciones/correo.service.js'

export async function aceptar(req, res) {
  const resultado = await acuerdo.aceptarCotizacion(req.db, req.params.id, req.body)
  await procesarCola() // UC4 paso 5: notifica a contratista y cliente
  res.status(201).json(resultado)
}

export async function consultarVigente(req, res) {
  res.json(await acuerdo.consultarVigente(req.db, req.params.id))
}