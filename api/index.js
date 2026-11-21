// Punto de entrada de la API de Negocio en Vercel (función serverless).
// vercel.json redirige /api/* aquí; Express recibe la ruta original.
import { app } from '../server/app.js'

export default app