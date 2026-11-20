// Rutas de la API de Negocio (contenedor "API" del C4)
import { Router } from 'express'
import { autenticacion } from '../middleware/autenticacion.js'
import { permitirRoles } from '../middleware/permitirRoles.js'
import { validar } from '../middleware/validar.js'
import { alcanceSchema } from '../schemas/alcance.schema.js'
import { obtenerUsuarioActual } from '../controllers/sesion.controller.js'
import * as proyectos from '../controllers/proyectos.controller.js'
import * as portafolio from '../controllers/portafolio.controller.js'
import * as alcance from '../controllers/alcance.controller.js'

export const router = Router()

// Pública: monitoreo de disponibilidad (RNF-04)
router.get('/health', (_req, res) => res.json({ estado: 'ok', hora: new Date().toISOString() }))

// Todo lo que sigue exige sesión (RNF-03)
router.use(autenticacion)

router.get('/me', obtenerUsuarioActual)

// Proyectos visibles para el usuario (RLS decide cuáles)
router.get('/proyectos', proyectos.listar)

// UC6 — Consolidado del portafolio (RF-10). Actores: Coordinador, Gerencia
router.get('/portafolio', permitirRoles('coordinador', 'gerencia'), portafolio.consultar)

// UC1 — Alcance del proyecto (RF-01, RF-02). Actor: Coordinador
router.get('/proyectos/:id/alcance', alcance.consultar)
router.put(
  '/proyectos/:id/alcance',
  permitirRoles('coordinador', 'auxiliar'),
  validar(alcanceSchema),
  alcance.guardarBorrador,
)
router.post('/proyectos/:id/alcance/oficializar', permitirRoles('coordinador'), alcance.oficializar)