// Datos del usuario autenticado, con la misma forma que espera el AuthContext del frontend
export async function obtenerUsuarioActual(req, res) {
  const { data: perfil, error } = await req.db
    .from('perfiles')
    .select('id, nombre, email, cargo, rol, empresa_id, cliente_id, contratista_id')
    .eq('id', req.usuario.id)
    .single()
  if (error) throw error

  // RLS decide qué proyectos ve cada rol; aquí solo se listan sus ids
  const { data: proyectos, error: e2 } = await req.db.from('proyectos').select('id')
  if (e2) throw e2

  res.json({ ...perfil, proyectosAsignados: proyectos.map((p) => p.id) })
}