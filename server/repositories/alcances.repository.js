// Acceso a datos del alcance (UC1). Usa el cliente del usuario (RLS aplica).

export async function obtenerPorProyecto(db, proyectoId) {
  const { data, error } = await db
    .from('alcances')
    .select('id, proyecto_id, ambientes, estado, oficializado_en, oficializado_por, actualizado_en')
    .eq('proyecto_id', proyectoId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function guardarBorrador(db, proyectoId, ambientes) {
  const { data, error } = await db
    .from('alcances')
    .upsert({ proyecto_id: proyectoId, ambientes }, { onConflict: 'proyecto_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function marcarOficial(db, alcanceId, usuarioId) {
  const { data, error } = await db
    .from('alcances')
    .update({ estado: 'OFICIAL', oficializado_en: new Date().toISOString(), oficializado_por: usuarioId })
    .eq('id', alcanceId)
    .eq('estado', 'BORRADOR')
    .select()
    .single()
  if (error) throw error
  return data
}