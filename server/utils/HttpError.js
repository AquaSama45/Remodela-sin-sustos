// Error con código HTTP y mensaje para el usuario
export class HttpError extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje)
    this.status = status
    this.detalles = detalles
  }
}