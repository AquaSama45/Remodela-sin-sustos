// Reportes de avance (UC5). El cálculo de desviación lo hace la BD al insertar.
const COLUMNAS = `id, proyecto_id, fecha, partida, porcentaje_completado, costo_incurrido,
  descripcion, motivo_desviacion, foto_url, costo_real_acumulado, costo_presupuestado,
  desviacion_costo, desviacion_porcentaje, desviacion_tiempo, supera_umbral, creado_en`

export async function crear(db, fila) {
  const { data, error } = await db.from('reportes_avance').insert(fila).select(COLUMNAS).single()
  if (error) throw error
  return data
}

export async function listar(db, proyectoId) {
  const { data, error } = await db
    .from('reportes_avance')
    .select(COLUMNAS)
    .eq('proyecto_id', proyectoId)
    .order('fecha', { ascending: false })
    .order('creado_en', { ascending: false })
  if (error) throw error
  return data
}