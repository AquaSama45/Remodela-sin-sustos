// Acceso a datos del acuerdo formal y sus hitos (UC4, UC7, UC8). RLS aplica.

const COLUMNAS = `id, proyecto_id, cotizacion_id, fecha_firma, precio_total,
  responsabilidades, alcance_acordado, vigente,
  cotizaciones(tiempo_ejecucion_dias, contratistas(nombre)),
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