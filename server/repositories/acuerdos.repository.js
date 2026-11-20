// Acceso a datos del acuerdo formal, sus hitos y su historial (UC4, UC7, UC8, UC9). RLS aplica.

const COLUMNAS = `id, proyecto_id, cotizacion_id, fecha_firma, precio_total,
  responsabilidades, alcance_acordado, vigente,
  contratistas(nombre),
  cotizaciones(tiempo_ejecucion_dias),
  hitos_de_pago(id, orden, descripcion, monto, porcentaje_pago, porcentaje_obra,
    estado, nota_retencion, aprobado_en, monto_pagado, pagado_en,
    medio_pago, referencia_pago, observaciones_pago)`

export async function obtenerVigente(db, proyectoId) {
  const { data, error } = await db
    .from('acuerdos_formales')
    .select(COLUMNAS)
    .eq('proyecto_id', proyectoId)
    .eq('vigente', true)
    .order('orden', { referencedTable: 'hitos_de_pago', ascending: true })
    .maybeSingle()
  if (error) throw error
  return data
}

export async function obtenerProyectoDelAcuerdo(db, acuerdoId) {
  const { data, error } = await db.from('acuerdos_formales').select('proyecto_id').eq('id', acuerdoId).maybeSingle()
  if (error) throw error
  return data?.proyecto_id ?? null
}

// UC9: la regla completa vive en registrar_cambio_alcance() de la BD
export async function registrarCambio(db, acuerdoId, { ambientes, justificacion, precioNuevo }) {
  const { data, error } = await db.rpc('registrar_cambio_alcance', {
    p_acuerdo: acuerdoId,
    p_ambientes: ambientes,
    p_justificacion: justificacion,
    p_precio_nuevo: precioNuevo ?? null,
  })
  if (error) throw error
  return data
}

export async function historial(db, acuerdoId) {
  const { data, error } = await db
    .from('historial_cambios')
    .select('id, acuerdo_id, fecha_cambio, detalle_justificacion, precio_anterior, precio_nuevo, version_anterior, version_nueva, perfiles(nombre)')
    .eq('acuerdo_id', acuerdoId)
    .order('fecha_cambio', { ascending: false })
  if (error) throw error
  return data
}