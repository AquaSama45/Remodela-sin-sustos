import * as cotizacion from '../services/cotizacion.service.js'

export async function listar(req, res) {
  res.json(await cotizacion.listar(req.db, req.params.id))
}

export async function crear(req, res) {
  res.status(201).json(await cotizacion.crear(req.db, req.usuario.id, req.params.id, req.body))
}

export async function editarBorrador(req, res) {
  res.json(await cotizacion.editarBorrador(req.db, req.params.id, req.body))
}

export async function nuevaVersion(req, res) {
  res.status(201).json(await cotizacion.nuevaVersion(req.db, req.params.id))
}

export async function comparar(req, res) {
  res.json(await cotizacion.comparar(req.db, req.rol, req.params.id))
}

export async function rechazar(req, res) {
  await cotizacion.rechazar(req.db, req.params.id)
  res.status(204).end()
}