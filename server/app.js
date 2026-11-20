// Aplicación Express: se usa en desarrollo (dev.js) y en Vercel (api/index.js)
import express from 'express'
import { router } from './routes/index.js'
import { manejarErrores } from './middleware/errores.js'

export const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))
app.use('/api', router)
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))
app.use(manejarErrores)