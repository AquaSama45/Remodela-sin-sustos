// Recorre UC2 → UC3 → UC4 sobre Laureles con los usuarios demo, a través de la API.
// Deja el proyecto con acuerdo vigente (así el portafolio de UC6 muestra datos).
//   1) npm run dev:api        (en otra terminal)
//   2) node --env-file=.env scripts/flujo-cotizacion.mjs
// Se puede correr varias veces: si Laureles ya tiene acuerdo, solo lo muestra.
import { createClient } from '@supabase/supabase-js'

const BASE = `http://localhost:${process.env.API_PORT ?? 3001}/api`
const LAURELES = '40000000-0000-4000-8000-000000000001'

const tokens = {}
async function token(email) {
  if (tokens[email]) return tokens[email]
  const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
  const { data, error } = await sb.auth.signInWithPassword({ email, password: process.env.SEED_PASSWORD })
  if (error) throw new Error(`Login ${email}: ${error.message}`)
  return (tokens[email] = data.session.access_token)
}

async function api(email, metodo, ruta, cuerpo) {
  const r = await fetch(BASE + ruta, {
    method: metodo,
    headers: { Authorization: `Bearer ${await token(email)}`, 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  })
  const datos = r.status === 204 ? null : await r.json()
  return { status: r.status, datos }
}

function paso(titulo, { status, datos }, esperado) {
  const ok = Array.isArray(esperado) ? esperado.includes(status) : status === esperado
  console.log(`${ok ? '✔' : '✖'} ${titulo} → ${status}${datos?.error ? ` (${datos.error})` : ''}`)
  if (datos?.detalles) console.log('   ', datos.detalles.join(' | '))
  return datos
}

const DIANA = 'diana.cardona@obraclara.test'
const CARLOS = 'carlos.integral@obrasmedellin.test'
const GUSTAVO = 'gustavo.maestro@obras.test'
const MATEO = 'mateo.taller@acabadosbelen.test'
const CLIENTE = 'familia.gomez@cliente.test'
const GERENCIA = 'gerencia@obraclara.test'

// Mismas cotizaciones del caso ancla que muestra el comparador del frontend
const COTIZACIONES = [
  [CARLOS, {
    costoMateriales: 11500000, costoManoObra: 8500000, imprevistos: 1900000, tiempoDias: 28,
    hitos: [
      { descripcion: 'Anticipo para compra de materiales e inicio', porcentaje: 40 },
      { descripcion: 'Demolición, red hidrosanitaria y enchapes', porcentaje: 30 },
      { descripcion: 'Instalación de aparatos, acabados y entrega', porcentaje: 30 },
    ],
    exclusiones: 'Sin exclusiones. Incluye retiro de escombros y limpieza.', enviar: true,
  }],
  [GUSTAVO, {
    costoMateriales: 13200000, costoManoObra: 9000000, imprevistos: 1500000, tiempoDias: 35,
    hitos: [
      { descripcion: 'Anticipo inicial de obra', porcentaje: 50 },
      { descripcion: 'Acta de entrega final a satisfacción', porcentaje: 50 },
    ],
    exclusiones: 'No incluye acarreos de escombros fuera de la unidad residencial.', enviar: true,
  }],
  [MATEO, {
    costoMateriales: 10800000, costoManoObra: 10500000, imprevistos: 1200000, tiempoDias: 25,
    hitos: [
      { descripcion: 'Anticipo para acopio de porcelanato y tubería', porcentaje: 30 },
      { descripcion: 'Avance al 50% de partidas ejecutadas', porcentaje: 40 },
      { descripcion: 'Entrega final y pruebas técnicas', porcentaje: 30 },
    ],
    exclusiones: 'No incluye accesorios de grifería ni espejos.', enviar: true,
  }],
]

const existente = await api(DIANA, 'GET', `/proyectos/${LAURELES}/acuerdo`)
if (existente.status === 200) {
  console.log('Laureles ya tiene acuerdo vigente; no se repite el flujo.\n')
} else {
  console.log('— UC2: los contratistas cotizan —')
  paso('Carlos envía sin exclusiones declaradas (debe fallar)',
    await api(CARLOS, 'POST', `/proyectos/${LAURELES}/cotizaciones`, { ...COTIZACIONES[0][1], exclusiones: '' }), 400)
  for (const [email, cotizacion] of COTIZACIONES) {
    paso(`${email.split('.')[0]} envía su cotización`,
      await api(email, 'POST', `/proyectos/${LAURELES}/cotizaciones`, cotizacion), [201, 409])
  }
  paso('Carlos intenta cotizar dos veces (debe fallar)',
    await api(CARLOS, 'POST', `/proyectos/${LAURELES}/cotizaciones`, COTIZACIONES[0][1]), 409)
  const propias = paso('Carlos lista sus cotizaciones (solo ve la suya)',
    await api(CARLOS, 'GET', `/proyectos/${LAURELES}/cotizaciones`), 200)
  console.log(`    ve ${propias.length} cotización(es)`)

  console.log('\n— UC3: la coordinación compara —')
  const comparacion = paso('Diana abre la comparación',
    await api(DIANA, 'GET', `/proyectos/${LAURELES}/comparacion`), 200)
  for (const c of comparacion.cotizaciones) {
    console.log(`    ${c.contratista.padEnd(15)} total ${c.total.toLocaleString('es-CO')}  ${c.tiempoDias} días  ${c.estado}`)
  }
  const carlos = comparacion.cotizaciones.find((c) => c.contratista === 'Carlos Pérez')

  console.log('\n— UC4: la coordinación acepta y se genera el acuerdo —')
  paso('Carlos intenta aceptar su propia cotización (debe fallar)',
    await api(CARLOS, 'POST', `/cotizaciones/${carlos.id}/aceptar`), 403)
  paso('Diana acepta con precio mayor al cotizado (debe fallar)',
    await api(DIANA, 'POST', `/cotizaciones/${carlos.id}/aceptar`, { precioTotal: 99000000 }), 422)
  // UC4 A1: la coordinación fija el avance de obra que exige cada hito
  paso('Diana acepta la cotización de Carlos',
    await api(DIANA, 'POST', `/cotizaciones/${carlos.id}/aceptar`, {
      hitos: carlos.hitos.map((h, i) => ({ ...h, avanceRequerido: [0, 50, 95][i] })),
      responsabilidades: 'El contratista responde por materiales, mano de obra y retiro de escombros.',
    }), 201)
}

console.log('\n— Resultado —')
const acuerdo = paso('El cliente consulta el acuerdo de su proyecto (UC7)',
  await api(CLIENTE, 'GET', `/proyectos/${LAURELES}/acuerdo`), 200)
if (acuerdo?.hitos) {
  console.log(`    precio ${acuerdo.precioTotal.toLocaleString('es-CO')} · contratista ${acuerdo.contratista ?? '(reservado)'}`)
  for (const h of acuerdo.hitos) {
    console.log(`    hito ${h.numero}: ${h.monto.toLocaleString('es-CO')} · exige ${h.avanceRequerido}% de avance · ${h.estado}`)
  }
}
const cotizCliente = await api(CLIENTE, 'GET', `/proyectos/${LAURELES}/cotizaciones`)
console.log(`${cotizCliente.datos.length === 0 ? '✔' : '✖'} El cliente no ve cotizaciones (US-08) → ${cotizCliente.datos.length}`)
const mateo = await api(MATEO, 'GET', `/proyectos/${LAURELES}/acuerdo`)
console.log(`${mateo.status === 404 ? '✔' : '✖'} Mateo no ve el acuerdo de Carlos (US-11) → ${mateo.status}`)
const portafolio = paso('Gerencia consulta el portafolio (UC6)', await api(GERENCIA, 'GET', '/portafolio'), 200)
for (const p of portafolio?.proyectos ?? []) {
  console.log(`    ${p.nombre} · ${p.estado} · presupuesto ${p.presupuesto.toLocaleString('es-CO')}`)
}