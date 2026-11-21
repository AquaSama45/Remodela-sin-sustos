// RNF-03: ninguna ruta de negocio responde sin una sesión válida
import { clienteAuth, clienteDelUsuario } from '../config/supabase.js'
import { HttpError } from '../utils/HttpError.js'

export async function autenticacion(req, _res, next) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1]
  if (!token) throw new HttpError(401, 'Debes iniciar sesión')

  const { data, error } = await clienteAuth.auth.getUser(token)
  if (error || !data?.user) throw new HttpError(401, 'Sesión inválida o expirada')

  req.usuario = data.user
  req.rol = data.user.app_metadata?.rol
  req.db = clienteDelUsuario(token)
  next()
}