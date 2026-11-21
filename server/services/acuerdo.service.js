// UC4 — Generar y registrar acuerdo formal (RF-05)
import * as cotizaciones from '../repositories/cotizaciones.repository.js'
import * as acuerdos from '../repositories/acuerdos.repository.js'
import { acuerdoADto } from '../mappers/cotizacion.mapper.js'
import { HttpError } from '../utils/HttpError.js'

// Cotizacion.aceptar() + AcuerdoFormal.generarDocumento()
export async function aceptarCotizacion(db, cotizacionId, ajustes) {
  const cotizacion = await cotizaciones.obtener(db, cotizacionId)
  if (!cotizacion) throw new HttpError(404, 'La cotización no existe o no tienes acceso')

  await cotizaciones.aceptar(db, cotizacionId, ajustes)
  return consultarVigente(db, cotizacion.proyecto_id)
}

export async function consultarVigente(db, proyectoId) {
  const acuerdo = await acuerdos.obtenerVigente(db, proyectoId)
  if (!acuerdo) throw new HttpError(404, 'El proyecto no tiene un acuerdo vigente o no tienes acceso a él')
  return acuerdoADto(acuerdo)
}