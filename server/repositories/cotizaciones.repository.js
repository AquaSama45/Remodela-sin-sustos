// Acceso a datos de cotizaciones (UC2, UC3, UC4). RLS aplica:
// el contratista solo ve las suyas; la coordinación ve todas las de su empresa.

const COLUMNAS = `id, proyecto_id, contratista_id, version, reemplaza_a,
  costo_materiales, costo_mano_obra, imprevistos, total, tiempo_ejecucion_dias,
  forma_pago, exclusiones, sin_exclusiones, hitos_propuestos, estado, enviada_en,
  contratistas(nombre, tipo_contratista)`

export async function listarPorProyecto(db, proyectoId, estados) {
  let consulta = db
    .from('cotizaciones')
    .select(COLUMNAS)
    .eq('proyecto_id', proyectoId)
    .order('contratista_id')
    .order('version', { ascending: false })
  if (estados) consulta = consulta.in('estado', estados)
  const { data, error } = await consulta
  if (error) throw error
  return data
}

export async function obtener(db, id) {
  const { data, error } = await db.from('cotizaciones').select(COLUMNAS).eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function crear(db, fila) {
  const { data, error } = await db.from('cotizaciones').insert(fila).select(COLUMNAS).single()
  if (error) throw error
  return data
}

export async function actualizar(db, id, cambios) {
  const { data, error } = await db.from('cotizaciones').update(cambios).eq('id', id).select(COLUMNAS).single()
  if (error) throw error
  return data
}

// UC3 postcondición 2: las consultadas quedan EN_REVISION
export async function marcarEnRevision(db, ids) {
  if (!ids.length) return
  const { error } = await db.from('cotizaciones').update({ estado: 'EN_REVISION' }).in('id', ids).eq('estado', 'ENVIADA')
  if (error) throw error
}

export async function rechazar(db, id) {
  const { data, error } = await db
    .from('cotizaciones')
    .update({ estado: 'RECHAZADA' })
    .eq('id', id)
    .in('estado', ['ENVIADA', 'EN_REVISION'])
    .select('id')
  if (error) throw error
  return data.length > 0
}

// UC4: la regla completa vive en la función aceptar_cotizacion() de la BD
export async function aceptar(db, id, { hitos, precioTotal, responsabilidades }) {
  const { data, error } = await db.rpc('aceptar_cotizacion', {
    p_cotizacion: id,
    p_hitos: hitos
      ? hitos.map((h) => ({ descripcion: h.descripcion, porcentaje: h.porcentaje, avance_requerido: h.avanceRequerido }))
      : null,
    p_precio_total: precioTotal ?? null,
    p_responsabilidades: responsabilidades || null,
  })
  if (error) throw error
  return data // id del acuerdo
}