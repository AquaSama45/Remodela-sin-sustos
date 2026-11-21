// Servidor local de desarrollo: npm run dev:api
import { app } from './app.js'

const puerto = process.env.API_PORT ?? 3001
app.listen(puerto, () => console.log(`API de Negocio en http://localhost:${puerto}/api`))