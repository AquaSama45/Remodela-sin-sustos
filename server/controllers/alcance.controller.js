import * as alcance from '../services/alcance.service.js'

export async function consultar(req, res) {
  res.json(await alcance.consultar(req.db, req.params.id))
}

export async function guardarBorrador(req, res) {
  res.json(await alcance.guardarBorrador(req.db, req.params.id, req.body.ambientes))
}

export async function oficializar(req, res) {
  res.json(await alcance.oficializar(req.db, req.params.id, req.usuario.id))
}