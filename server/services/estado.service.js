// UC7 — Consultar estado de su proyecto (soporta RF-05, RF-07, RF-09)
// Una sola llamada con lo que el cliente necesita ver; RLS garantiza que sea su proyecto.
import * as proyectos from '../repositories/proyectos.repository.js'
import * as acuerdos from '../repositories/acuerdos.repository.js'
import * as reportes from '../repositories/reportes.repository.js'
import { acuerdoADto } from '../mappers/cotizacion.mapper.js'
import { reporteADto } from '../mappers/obra.mapper.js'
import { HttpError } from '../utils/HttpError.js'

export async function consultar(db, proyectoId) {
  const proyecto = await proyectos.obtener(db, proyectoId)
  // UC7 E1: proyecto ajeno → acceso denegado (RLS lo oculta)
  if (!proyecto) throw new HttpError(404, 'El proyecto no existe o no tienes acceso a él')

  const [acuerdo, avances] = await Promise.all([
    acuerdos.obtenerVigente(db, proyectoId),
    reportes.listar(db, proyectoId),
  ])

  return {
    proyecto: {
      id: proyecto.id,
      nombre: proyecto.nombre,
      direccion: proyecto.direccion_inmueble,
      estado: proyecto.estado,
      cliente: proyecto.clientes?.nombre ?? null,
    },
    acuerdo: acuerdo ? acuerdoADto(acuerdo) : null,
    ultimoAvance: avances[0] ? reporteADto(avances[0]) : null,
    avances: avances.map(reporteADto),
  }
}