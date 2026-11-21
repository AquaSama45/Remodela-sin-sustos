// Hitos de pago (UC8). Las transiciones válidas las impone la BD.

export async function obtener(db, id) {
  const { data, error } = await db
    .from('hitos_de_pago')
    .select('id, estado, acuerdos_formales(proyecto_id)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

async function actualizar(db, id, cambios) {
  const { data, error } = await db.from('hitos_de_pago').update(cambios).eq('id', id).select('id')
  if (error) throw error
  return data.length > 0
}

export const aprobar = (db, id) => actualizar(db, id, { estado: 'APROBADO' })
export const retener = (db, id, nota) => actualizar(db, id, { estado: 'PENDIENTE', nota_retencion: nota })

export async function pagar(db, id, d) {
  const { error } = await db.rpc('registrar_pago_hito', {
    p_hito: id,
    p_referencia: d.referencia,
    p_medio: d.medio || null,
    p_observaciones: d.observaciones || null,
    p_monto: d.monto ?? null,
    p_justificacion: d.justificacionMonto || null,
    p_fecha: d.fecha ?? null,
  })
  if (error) throw error
}