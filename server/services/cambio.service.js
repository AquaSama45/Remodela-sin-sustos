// UC9 — Registrar cambio de alcance (RF-06, RNF-02)
import * as acuerdos from '../repositories/acuerdos.repository.js'
import { cambioADto } from '../mappers/obra.mapper.js'

export async function registrar(db, acuerdoId, datos) {
  await acuerdos.registrarCambio(db, acuerdoId, datos)
  return historial(db, acuerdoId)
}

export async function historial(db, acuerdoId) {
  return (await acuerdos.historial(db, acuerdoId)).map(cambioADto)
}