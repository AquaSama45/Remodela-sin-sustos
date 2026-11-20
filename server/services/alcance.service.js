// UC1 — Definir y estructurar el alcance del proyecto (RF-01, RF-02)
import * as alcances from '../repositories/alcances.repository.js'
import * as proyectos from '../repositories/proyectos.repository.js'
import { HttpError } from '../utils/HttpError.js'

// Alcance.validarCompletitud() — UC1 E1: cada ambiente con partidas, cada partida con materiales
export function validarCompletitud(ambientes) {
  if (!ambientes?.length) return ['El alcance no tiene ningún ambiente']

  const faltantes = []
  for (const ambiente of ambientes) {
    if (!ambiente.partidas?.length) {
      faltantes.push(`${ambiente.nombre}: no tiene partidas de trabajo`)
      continue
    }
    for (const partida of ambiente.partidas) {
      if (!partida.materiales?.length) {
        faltantes.push(`${ambiente.nombre} / ${partida.nombre}: no tiene materiales`)
      }
    }
  }
  return faltantes
}

export async function consultar(db, proyectoId) {
  const alcance = await alcances.obtenerPorProyecto(db, proyectoId)
  if (!alcance) throw new HttpError(404, 'El proyecto no tiene alcance registrado o no tienes acceso a él')
  return alcance
}

// UC1 A1: guardar borrador incompleto para continuar después
export async function guardarBorrador(db, proyectoId, ambientes) {
  const actual = await alcances.obtenerPorProyecto(db, proyectoId)
  if (actual?.estado === 'OFICIAL') {
    throw new HttpError(409, 'El alcance ya es oficial. Para modificarlo se registra un cambio de alcance (UC9).')
  }
  return alcances.guardarBorrador(db, proyectoId, ambientes)
}

// UC1 pasos 5–6: validar, sellar como oficial y habilitar el proyecto para cotizar
export async function oficializar(db, proyectoId, usuarioId) {
  const actual = await alcances.obtenerPorProyecto(db, proyectoId)
  if (!actual) throw new HttpError(404, 'Primero guarda el alcance como borrador')
  if (actual.estado === 'OFICIAL') throw new HttpError(409, 'Este proyecto ya tiene un alcance oficial')

  const faltantes = validarCompletitud(actual.ambientes)
  if (faltantes.length) throw new HttpError(422, 'El alcance está incompleto', faltantes)

  const oficial = await alcances.marcarOficial(db, actual.id, usuarioId)
  await proyectos.cambiarEstado(db, proyectoId, 'COTIZACION')
  return oficial
}