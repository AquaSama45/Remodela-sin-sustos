// Vínculo del usuario con su entidad de negocio (Contratista, Cliente, Empresa)
export async function obtener(db, usuarioId) {
  const { data, error } = await db
    .from('perfiles')
    .select('id, rol, empresa_id, cliente_id, contratista_id')
    .eq('id', usuarioId)
    .single()
  if (error) throw error
  return data
}