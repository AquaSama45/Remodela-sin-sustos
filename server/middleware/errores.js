// Traduce errores de Postgres/Supabase a respuestas HTTP con mensajes en español

// Códigos de Postgres y PostgREST → estado HTTP
const ESTADO_POR_CODIGO = {
  '23505': 409,    // dato duplicado (unique)
  '23514': 422,    // regla de negocio (check)
  '23502': 422,    // campo obligatorio
  '23503': 422,    // referencia inexistente
  '22P02': 400,    // formato inválido (ej. id que no es uuid)
  'P0001': 422,    // RAISE EXCEPTION de un trigger
  '42501': 403,    // bloqueado por RLS
  'PGRST116': 404, // no se encontró el registro
}

// Restricciones de la BD → mensaje que entiende el usuario
const MENSAJE_POR_RESTRICCION = {
  alcances_proyecto_id_key: 'Este proyecto ya tiene un alcance registrado',
  cotizacion_completa: 'La cotización está incompleta: faltan el tiempo de ejecución o la forma de pago',
  exclusiones_declaradas: 'Debes declarar las exclusiones o marcar "sin exclusiones"',
  acuerdo_vigente_unico: 'El proyecto ya tiene un acuerdo vigente',
  monto_distinto_justificado: 'Pagar un monto distinto al pactado exige una justificación',
  pago_completo: 'Para marcar el hito como pagado se necesitan el monto y la fecha de pago',
  historial_cambios_detalle_justificacion_check: 'El cambio de alcance exige una justificación',
  hitos_propuestos_completos: 'Los hitos de pago propuestos deben sumar 100%',
  pago_con_referencia: 'Ingresa la referencia bancaria del comprobante',
  reportes_avance_porcentaje_completado_check: 'El avance debe estar entre 0% y 100%',
  reportes_avance_descripcion_check: 'Describe el trabajo ejecutado',
}

export function manejarErrores(err, _req, res, _next) {
  const status = err.status ?? ESTADO_POR_CODIGO[err.code] ?? 500
  const restriccion = err.message?.match(/constraint "([^"]+)"/)?.[1]

  let mensaje = MENSAJE_POR_RESTRICCION[restriccion] ?? err.message
  if (err.code === '42501') mensaje = 'No tienes permiso sobre este registro'
  if (status >= 500) {
    console.error(err)
    mensaje = 'Error interno del servidor'
  }

  res.status(status).json({ error: mensaje, detalles: err.detalles })
}