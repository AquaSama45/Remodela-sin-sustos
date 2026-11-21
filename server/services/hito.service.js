// UC8 — Registrar pago de hito / autorizar desembolso (RF-08)
// HitoDePago.liberarPago() / retenerPago()
import * as hitos from '../repositories/hitos.repository.js'
import { consultarVigente } from './acuerdo.service.js'
import { HttpError } from '../utils/HttpError.js'

async function proyectoDelHito(db, hitoId) {
  const hito = await hitos.obtener(db, hitoId)
  if (!hito) throw new HttpError(404, 'El hito no existe o no tienes acceso a él')
  return hito.acuerdos_formales.proyecto_id
}

// Cada operación devuelve el acuerdo actualizado, como lo pinta HitosPagoPanel
export async function aprobar(db, hitoId) {
  const proyectoId = await proyectoDelHito(db, hitoId)
  if (!(await hitos.aprobar(db, hitoId))) throw new HttpError(403, 'No tienes permiso sobre este hito')
  return consultarVigente(db, proyectoId)
}

export async function retener(db, hitoId, nota) {
  const proyectoId = await proyectoDelHito(db, hitoId)
  if (!(await hitos.retener(db, hitoId, nota))) throw new HttpError(403, 'No tienes permiso sobre este hito')
  return consultarVigente(db, proyectoId)
}

export async function pagar(db, hitoId, comprobante) {
  const proyectoId = await proyectoDelHito(db, hitoId)
  await hitos.pagar(db, hitoId, comprobante)
  return consultarVigente(db, proyectoId)
}