// UC2 — Registrar cotización estructurada (RF-03)
// UC3 — Comparar cotizaciones (RF-04)
import * as cotizaciones from '../repositories/cotizaciones.repository.js'
import * as proyectos from '../repositories/proyectos.repository.js'
import * as perfiles from '../repositories/perfiles.repository.js'
import { cotizacionADto, cotizacionAFila } from '../mappers/cotizacion.mapper.js'
import { HttpError } from '../utils/HttpError.js'

async function exigirProyectoEnCotizacion(db, proyectoId) {
  const proyecto = await proyectos.obtener(db, proyectoId)
  if (!proyecto) throw new HttpError(404, 'El proyecto no existe o no estás vinculado a él')
  if (proyecto.estado !== 'COTIZACION') {
    throw new HttpError(409, 'El proyecto no está recibiendo cotizaciones')
  }
}

export async function listar(db, proyectoId) {
  const filas = await cotizaciones.listarPorProyecto(db, proyectoId)
  return filas.map(cotizacionADto)
}

// UC2: el contratista registra su cotización (borrador o enviada)
export async function crear(db, usuarioId, proyectoId, datos) {
  const { contratista_id: contratistaId } = await perfiles.obtener(db, usuarioId)
  if (!contratistaId) throw new HttpError(403, 'Tu usuario no está vinculado a un contratista')
  await exigirProyectoEnCotizacion(db, proyectoId)

  const previas = await cotizaciones.listarPorProyecto(db, proyectoId)
  if (previas.some((c) => c.estado === 'BORRADOR')) {
    throw new HttpError(409, 'Ya tienes un borrador en este proyecto; edítalo en lugar de crear otro')
  }
  if (previas.length) {
    throw new HttpError(409, 'Ya cotizaste este proyecto; para cambiarla crea una nueva versión')
  }

  const fila = await cotizaciones.crear(db, {
    ...cotizacionAFila(datos),
    proyecto_id: proyectoId,
    contratista_id: contratistaId,
    version: 1,
  })
  return cotizacionADto(fila)
}

// UC2 A1: completar el borrador después (y opcionalmente enviarlo)
export async function editarBorrador(db, cotizacionId, datos) {
  const actual = await cotizaciones.obtener(db, cotizacionId)
  if (!actual) throw new HttpError(404, 'La cotización no existe o no es tuya')
  if (actual.estado !== 'BORRADOR') {
    throw new HttpError(409, 'Una cotización enviada no se edita; crea una nueva versión (UC2)')
  }
  return cotizacionADto(await cotizaciones.actualizar(db, cotizacionId, cotizacionAFila(datos)))
}

// UC2 regla: la enviada se reemplaza por una nueva versión en BORRADOR
export async function nuevaVersion(db, cotizacionId) {
  const actual = await cotizaciones.obtener(db, cotizacionId)
  if (!actual) throw new HttpError(404, 'La cotización no existe o no es tuya')
  if (actual.estado === 'BORRADOR') throw new HttpError(409, 'Esta cotización todavía es un borrador; edítala')
  await exigirProyectoEnCotizacion(db, actual.proyecto_id)

  const previas = await cotizaciones.listarPorProyecto(db, actual.proyecto_id)
  if (previas.some((c) => c.estado === 'BORRADOR')) {
    throw new HttpError(409, 'Ya tienes una nueva versión en borrador')
  }
  const ultimaVersion = Math.max(...previas.map((c) => c.version))

  const fila = await cotizaciones.crear(db, {
    proyecto_id: actual.proyecto_id,
    contratista_id: actual.contratista_id,
    version: ultimaVersion + 1,
    reemplaza_a: actual.id,
    costo_materiales: actual.costo_materiales,
    costo_mano_obra: actual.costo_mano_obra,
    imprevistos: actual.imprevistos,
    tiempo_ejecucion_dias: actual.tiempo_ejecucion_dias,
    hitos_propuestos: actual.hitos_propuestos,
    exclusiones: actual.exclusiones,
    sin_exclusiones: actual.sin_exclusiones,
    estado: 'BORRADOR',
  })
  return cotizacionADto(fila)
}

// Última versión de cada contratista
function ultimasVersiones(filas) {
  const porContratista = new Map()
  for (const c of filas) {
    const previa = porContratista.get(c.contratista_id)
    if (!previa || c.version > previa.version) porContratista.set(c.contratista_id, c)
  }
  return [...porContratista.values()]
}

// UC3: vista comparativa de las cotizaciones vigentes del proyecto
export async function comparar(db, rol, proyectoId) {
  const vigentes = ultimasVersiones(
    await cotizaciones.listarPorProyecto(db, proyectoId, ['ENVIADA', 'EN_REVISION']),
  )

  // UC3 postcondición 2: las consultadas por la coordinación quedan EN_REVISION
  if (['coordinador', 'auxiliar'].includes(rol)) {
    const porRevisar = vigentes.filter((c) => c.estado === 'ENVIADA')
    await cotizaciones.marcarEnRevision(db, porRevisar.map((c) => c.id))
    porRevisar.forEach((c) => (c.estado = 'EN_REVISION'))
  }

  const items = vigentes.map(cotizacionADto).sort((a, b) => a.total - b.total)
  const menor = (campo) =>
    items.length ? items.reduce((m, c) => (c[campo] < m[campo] ? c : m)).id : null

  let aviso = null
  if (items.length === 0) aviso = 'No hay cotizaciones para comparar (UC3 E1)'
  if (items.length === 1) aviso = 'Solo hay una cotización; no hay con qué compararla (UC3 A1)'

  return {
    cotizaciones: items,
    resaltados: { menorTotal: menor('total'), menorTiempo: menor('tiempoDias') },
    aviso,
  }
}

export async function rechazar(db, cotizacionId) {
  const ok = await cotizaciones.rechazar(db, cotizacionId)
  if (!ok) throw new HttpError(409, 'Solo se rechazan cotizaciones enviadas o en revisión')
}