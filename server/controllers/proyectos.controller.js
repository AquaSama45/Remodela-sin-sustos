import * as proyectos from '../repositories/proyectos.repository.js'

export async function listar(req, res) {
  res.json(await proyectos.listar(req.db))
}