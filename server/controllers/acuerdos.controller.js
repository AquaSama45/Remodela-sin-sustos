import * as acuerdo from '../services/acuerdo.service.js'

export async function aceptar(req, res) {
  res.status(201).json(await acuerdo.aceptarCotizacion(req.db, req.params.id, req.body))
}

export async function consultarVigente(req, res) {
  res.json(await acuerdo.consultarVigente(req.db, req.params.id))
}