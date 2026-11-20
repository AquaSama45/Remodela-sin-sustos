// DTOs de entrada de cotización (UC2) y aceptación (UC4).
// Los nombres de campo coinciden con los formularios del frontend.
import { z } from 'zod'

// '' o null → sin valor; el resto se convierte a número
const numero = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
  z.number({ error: 'Debe ser un número' }).min(0, 'No puede ser negativo').optional(),
)

const hitoPropuesto = z.object({
  descripcion: z.string().trim().min(1, 'El hito necesita una descripción'),
  porcentaje: z.coerce.number().positive('El porcentaje debe ser mayor a 0').max(100),
})

export const cotizacionSchema = z
  .object({
    costoMateriales: numero,
    costoManoObra: numero,
    imprevistos: numero,
    tiempoDias: numero,
    hitos: z.array(hitoPropuesto).default([]),
    exclusiones: z.string().trim().optional().default(''),
    declaraSinExclusiones: z.boolean().default(false),
    enviar: z.boolean().default(false), // false = guardar borrador (UC2 A1)
  })
  .superRefine((c, ctx) => {
    if (!c.enviar) return
    // UC2 E1: no se envía sin las categorías obligatorias
    const falta = (path, message) => ctx.addIssue({ code: 'custom', path: [path], message })
    if (c.costoMateriales === undefined) falta('costoMateriales', 'Obligatorio para enviar')
    if (c.costoManoObra === undefined) falta('costoManoObra', 'Obligatorio para enviar')
    if (!c.tiempoDias || !Number.isInteger(c.tiempoDias)) falta('tiempoDias', 'Debe ser un número entero de días mayor a 0')
    if (!c.hitos.length) falta('hitos', 'Propón al menos un hito de pago')
    else {
      const suma = c.hitos.reduce((s, h) => s + h.porcentaje, 0)
      if (suma !== 100) falta('hitos', `Los porcentajes deben sumar 100 (suman ${suma})`)
    }
    // UC2 regla: exclusiones obligatorias aunque sea "sin exclusiones"
    if (!c.exclusiones && !c.declaraSinExclusiones) {
      falta('exclusiones', 'Declara las exclusiones o marca "sin exclusiones"')
    }
  })

// UC4 A1: la coordinación puede ajustar hitos y precio antes de confirmar
export const aceptarSchema = z
  .object({
    hitos: z
      .array(
        hitoPropuesto.extend({
          avanceRequerido: z.coerce.number().min(0).max(100).optional(),
        }),
      )
      .optional(),
    precioTotal: z.coerce.number().positive().optional(),
    responsabilidades: z.string().trim().optional(),
  })
  .default({})