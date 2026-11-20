import * as portafolio from '../services/portafolio.service.js'

export async function consultar(req, res) {
  const { estado, pagina, tamano } = req.query
  res.json(await portafolio.generarReportePortafolio(req.db, { estado, pagina, tamano }))
}