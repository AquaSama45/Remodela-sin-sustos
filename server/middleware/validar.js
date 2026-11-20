// Valida el cuerpo de la petición con un esquema Zod (DTO de entrada)
import { HttpError } from '../utils/HttpError.js'

export const validar = (esquema) => (req, _res, next) => {
  const resultado = esquema.safeParse(req.body ?? {})
  if (!resultado.success) {
    const detalles = resultado.error.issues.map((i) => `${i.path.join('.') || 'cuerpo'}: ${i.message}`)
    throw new HttpError(400, 'Datos inválidos', detalles)
  }
  req.body = resultado.data
  next()
}