// Rutas de la API de Negocio (contenedor "API" del C4)
import { Router } from 'express'
import { autenticacion } from '../middleware/autenticacion.js'
import { obtenerUsuarioActual } from '../controllers/sesion.controller.js'

export const router = Router()

// Pública: monitoreo de disponibilidad (RNF-04)
router.get('/health', (_req, res) => res.json({ estado: 'ok', hora: new Date().toISOString() }))

// Todo lo que sigue exige sesión (RNF-03)
router.use(autenticacion)

router.get('/me', obtenerUsuarioActual)