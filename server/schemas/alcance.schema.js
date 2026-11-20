// DTO de entrada del alcance: ambientes → partidas → materiales (RF-02)
import { z } from 'zod'

const material = z.string().trim().min(1, 'El material no puede estar vacío')

const partida = z.object({
  id: z.string().optional(),
  nombre: z.string().trim().min(1, 'La partida necesita un nombre'),
  materiales: z.array(material),
})

const ambiente = z.object({
  id: z.string().optional(),
  nombre: z.string().trim().min(1, 'El ambiente necesita un nombre'),
  partidas: z.array(partida),
})

export const alcanceSchema = z.object({
  ambientes: z.array(ambiente),
})