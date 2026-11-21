// Primera barrera por rol (la definitiva es RLS en la base de datos)
import { HttpError } from '../utils/HttpError.js'

export const permitirRoles = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.rol)) {
    throw new HttpError(403, 'Tu rol no tiene permiso para esta acción')
  }
  next()
}