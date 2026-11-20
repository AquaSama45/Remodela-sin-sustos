export async function actualizarUmbral(db, empresaId, umbral) {
  const { data, error } = await db
    .from('empresas')
    .update({ umbral_desviacion: umbral })
    .eq('id', empresaId)
    .select('id, nombre, umbral_desviacion')
    .single()
  if (error) throw error
  return data
}