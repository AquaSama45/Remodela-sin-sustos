// Acceso a datos de proyectos. Usa siempre el cliente del usuario (RLS aplica).

export async function listar(db) {
  const { data, error } = await db
    .from('proyectos')
    .select('id, nombre, direccion_inmueble, presupuesto_asignado, estado, clientes(nombre)')
    .order('creado_en', { ascending: true })
  if (error) throw error
  return data
}

// Proyectos con acuerdo (vigente o finalizado) y su último reporte de avance.
// "!inner" deja solo los que tienen al menos un acuerdo (regla de UC6).
export async function listarConSeguimiento(db, { estado, desde, hasta }) {
  let consulta = db
    .from('proyectos')
    .select(
      `id, nombre, estado, presupuesto_asignado,
       clientes(nombre),
       acuerdos_formales!inner(precio_total, vigente, fecha_firma),
       reportes_avance(fecha, porcentaje_completado, costo_real_acumulado,
                       desviacion_porcentaje, supera_umbral, creado_en)`,
      { count: 'exact' },
    )
    .order('nombre', { ascending: true })
    .order('fecha', { referencedTable: 'reportes_avance', ascending: false })
    .order('creado_en', { referencedTable: 'reportes_avance', ascending: false })
    .limit(1, { referencedTable: 'reportes_avance' })
    .range(desde, hasta)

  if (estado) consulta = consulta.eq('estado', estado)

  const { data, error, count } = await consulta
  if (error) throw error
  return { filas: data, total: count }
}

export async function cambiarEstado(db, proyectoId, estado) {
  const { error } = await db.from('proyectos').update({ estado }).eq('id', proyectoId)
  if (error) throw error
}


export async function obtener(db, proyectoId) {
  const { data, error } = await db.from('proyectos').select('id, estado').eq('id', proyectoId).maybeSingle()
  if (error) throw error
  return data
}