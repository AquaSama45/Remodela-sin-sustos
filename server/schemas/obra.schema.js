// DTOs de entrada de avance (UC5), hitos (UC8), cambio de alcance (UC9) y umbral.
// Los nombres de campo coinciden con los formularios del frontend.
import { z } from 'zod'
import { alcanceSchema } from './alcance.schema.js'

const texto = z.string().trim().optional()

// UC5: mismo formulario que RegistroAvanceForm
export const avanceSchema = z.object({
  fecha: z.iso.date({ error: 'Fecha inválida (AAAA-MM-DD)' }).optional(),
  partida: texto,
  porcentaje: z.coerce
    .number({ error: 'Indica el porcentaje de avance' })
    .min(0, 'El avance no puede ser negativo')
    .max(100, 'El avance no puede superar 100%'),
  costoIncurrido: z.coerce.number().min(0, 'El costo no puede ser negativo').default(0),
  descripcion: z
    .string({ error: 'Describe el trabajo ejecutado desde el último reporte' })
    .trim()
    .min(1, 'Describe el trabajo ejecutado desde el último reporte'),
  motivoDesviacion: texto,
  fotoNombre: texto,
})

// UC8: comprobante del pago (mismo modal de HitosPagoPanel)
export const pagoSchema = z.object({
  referencia: z
    .string({ error: 'Ingresa la referencia bancaria del comprobante' })
    .trim()
    .min(1, 'Ingresa la referencia bancaria del comprobante'),
  medio: texto,
  observaciones: texto,
  fecha: z.iso.date().optional(),
  monto: z.coerce.number().positive().optional(),       // UC8 E1: monto distinto al pactado
  justificacionMonto: texto,
})

// UC8 A1: retener el pago con una nota
export const retenerSchema = z.object({
  nota: z
    .string({ error: 'Deja una nota explicando por qué se retiene el pago' })
    .trim()
    .min(1, 'Deja una nota explicando por qué se retiene el pago'),
})

// UC9: nuevo alcance + justificación obligatoria (+ ajuste de precio opcional, A1)
export const cambioAlcanceSchema = z.object({
  ambientes: alcanceSchema.shape.ambientes,
  justificacion: z
    .string({ error: 'El cambio de alcance exige una justificación' })
    .trim()
    .min(1, 'El cambio de alcance exige una justificación'),
  precioNuevo: z.coerce.number().positive().optional(),
})

// UC5 regla: el umbral de desviación es parametrizable por la empresa
export const umbralSchema = z.object({
  umbralDesviacion: z.coerce.number().min(0).max(100),
})