// Controladores de ejecución de obra: avance (UC5), hitos (UC8),
// cambios de alcance (UC9), estado del proyecto (UC7) y umbral
import * as avance from '../services/avance.service.js'
import * as hito from '../services/hito.service.js'
import * as cambio from '../services/cambio.service.js'
import * as estado from '../services/estado.service.js'
import * as empresa from '../services/empresa.service.js'

export async function reportarAvance(req, res) {
  res.status(201).json(await avance.reportar(req.db, req.usuario.id, req.params.id, req.body))
}

export async function listarAvances(req, res) {
  res.json(await avance.listar(req.db, req.params.id))
}

export async function aprobarHito(req, res) {
  res.json(await hito.aprobar(req.db, req.params.id))
}

export async function retenerHito(req, res) {
  res.json(await hito.retener(req.db, req.params.id, req.body.nota))
}

export async function pagarHito(req, res) {
  res.json(await hito.pagar(req.db, req.params.id, req.body))
}

export async function registrarCambioAlcance(req, res) {
  res.status(201).json(await cambio.registrar(req.db, req.params.id, req.body))
}

export async function historialCambios(req, res) {
  res.json(await cambio.historial(req.db, req.params.id))
}

export async function estadoProyecto(req, res) {
  res.json(await estado.consultar(req.db, req.params.id))
}

export async function ajustarUmbral(req, res) {
  res.json(await empresa.ajustarUmbral(req.db, req.usuario.id, req.body.umbralDesviacion))
}