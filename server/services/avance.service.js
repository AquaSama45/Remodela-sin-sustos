// UC5 — Reportar avance y costos (RF-07, RF-09)
import * as reportes from '../repositories/reportes.repository.js'
import * as perfiles from '../repositories/perfiles.repository.js'
import { reporteADto } from '../mappers/obra.mapper.js'
import { HttpError } from '../utils/HttpError.js'

// La BD valida el acuerdo vigente, que el avance no retroceda, calcula la
// desviación y, si supera el umbral, encola la alerta (US-06) en la misma transacción.
export async function reportar(db, usuarioId, proyectoId, d) {
  const { contratista_id: contratistaId } = await perfiles.obtener(db, usuarioId)
  if (!contratistaId) throw new HttpError(403, 'Tu usuario no está vinculado a un contratista')

  const fila = await reportes.crear(db, {
    proyecto_id: proyectoId,
    contratista_id: contratistaId,
    fecha: d.fecha,
    partida: d.partida || null,
    porcentaje_completado: d.porcentaje,
    costo_incurrido: d.costoIncurrido,
    descripcion: d.descripcion,
    motivo_desviacion: d.motivoDesviacion || null,
    foto_url: d.fotoNombre || null,
  })
  return reporteADto(fila)
}

export async function listar(db, proyectoId) {
  return (await reportes.listar(db, proyectoId)).map(reporteADto)
}