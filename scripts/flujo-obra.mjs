// Recorre la ejecución de obra en Laureles con los usuarios demo, a través de la API:
// UC5 avance y desviación → UC8 pagos de hitos → UC9 cambio de alcance → UC7 vista del cliente.
// Requiere haber corrido antes scripts/flujo-cotizacion.mjs (Laureles con acuerdo vigente).
//   1) npm run dev:api        (en otra terminal)
//   2) node --env-file=.env scripts/flujo-obra.mjs
// Se puede correr varias veces: si ya hay avances, solo muestra el resultado.
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
  console.log(`${status === esperado ? '✔' : '✖'} ${titulo} → ${status}${datos?.error ? ` (${datos.error})` : ''}`)
  if (datos?.detalles) console.log('   ', datos.detalles.join(' | '))
  return datos
}

const pesos = (n) => (n ?? 0).toLocaleString('es-CO')
const DIANA = 'diana.cardona@obraclara.test'
const CARLOS = 'carlos.integral@obrasmedellin.test'
const MATEO = 'mateo.taller@acabadosbelen.test'
const CLIENTE = 'familia.gomez@cliente.test'
const GERENCIA = 'gerencia@obraclara.test'

const acuerdoInicial = paso('Laureles tiene acuerdo vigente', await api(DIANA, 'GET', `/proyectos/${LAURELES}/acuerdo`), 200)
if (!acuerdoInicial?.hitos) {
  console.log('Primero corre scripts/flujo-cotizacion.mjs')
  process.exit(1)
}
const [hito1, hito2] = acuerdoInicial.hitos

const previos = await api(DIANA, 'GET', `/proyectos/${LAURELES}/avances`)
if (previos.datos.length) {
  console.log('Laureles ya tiene avances reportados; no se repite el flujo.\n')
} else {
  console.log('\n— UC5: avance y desviación (umbral 10%) —')
  paso('Mateo reporta en la obra de Carlos (debe fallar)',
    await api(MATEO, 'POST', `/proyectos/${LAURELES}/avances`, { porcentaje: 10, costoIncurrido: 1, descripcion: 'x' }), 422)
  let r = paso('Carlos reporta 20% con $4.000.000',
    await api(CARLOS, 'POST', `/proyectos/${LAURELES}/avances`, {
      partida: 'Demolición y retiro de escombros', porcentaje: 20, costoIncurrido: 4000000,
      descripcion: 'Demolición de mesón y enchapes existentes terminada',
    }), 201)
  console.log(`    desviación ${r.desviacionPorcentaje}% · alerta: ${r.alerta}`)
  paso('Carlos reporta 10% (retrocede, debe fallar)',
    await api(CARLOS, 'POST', `/proyectos/${LAURELES}/avances`, { porcentaje: 10, descripcion: 'x' }), 422)

  console.log('\n— UC8: pagos por hitos —')
  paso('Diana paga el anticipo (hito 1)',
    await api(DIANA, 'POST', `/hitos/${hito1.id}/pagar`, {
      referencia: 'TR-83920194', medio: 'Transferencia Bancolombia', observaciones: 'Desembolso inicial según acta',
    }), 200)
  paso('Diana intenta pagar el hito 2 con solo 20% de avance (debe fallar)',
    await api(DIANA, 'POST', `/hitos/${hito2.id}/pagar`, { referencia: 'TR-1' }), 422)

  r = paso('Carlos reporta 50% con $9.500.000 más (sobrecosto)',
    await api(CARLOS, 'POST', `/proyectos/${LAURELES}/avances`, {
      partida: 'Enchape de pisos y paredes', porcentaje: 50, costoIncurrido: 9500000,
      descripcion: 'Red hidrosanitaria y enchapes de cocina terminados',
      motivoDesviacion: 'Subió el precio del porcelanato',
    }), 201)
  console.log(`    acumulado ${pesos(r.costoRealAcumulado)} vs presupuestado ${pesos(r.costoPresupuestado)} → ${r.desviacionPorcentaje}% · ALERTA: ${r.alerta}`)

  paso('Diana retiene el hito 2 sin nota (debe fallar)', await api(DIANA, 'POST', `/hitos/${hito2.id}/retener`, {}), 400)
  paso('Diana retiene el hito 2 con nota',
    await api(DIANA, 'POST', `/hitos/${hito2.id}/retener`, { nota: 'Revisar el sobrecosto antes de desembolsar' }), 200)
  paso('Carlos intenta registrar un pago (debe fallar)',
    await api(CARLOS, 'POST', `/hitos/${hito2.id}/pagar`, { referencia: 'X' }), 403)
  paso('Diana paga el hito 2 tras revisar',
    await api(DIANA, 'POST', `/hitos/${hito2.id}/pagar`, { referencia: 'TR-83920511', medio: 'Transferencia Bancolombia' }), 200)
  paso('Diana intenta pagar el hito 2 otra vez (debe fallar)',
    await api(DIANA, 'POST', `/hitos/${hito2.id}/pagar`, { referencia: 'TR-9' }), 422)

  console.log('\n— UC9: cambio de alcance —')
  const nuevoAlcance = [
    ...acuerdoInicial.alcance,
    { nombre: 'Zona de Ropas', partidas: [{ nombre: 'Enchape de piso y lavadero', materiales: ['Cerámica antideslizante', 'Lavadero prefabricado'] }] },
  ]
  paso('Diana registra el cambio sin justificación (debe fallar)',
    await api(DIANA, 'POST', `/acuerdos/${acuerdoInicial.id}/cambios-alcance`, { ambientes: nuevoAlcance, justificacion: '' }), 400)
  paso('Diana agrega la zona de ropas (+$1.100.000)',
    await api(DIANA, 'POST', `/acuerdos/${acuerdoInicial.id}/cambios-alcance`, {
      ambientes: nuevoAlcance, justificacion: 'El cliente pidió incluir la zona de ropas', precioNuevo: 23000000,
    }), 201)
}

console.log('\n— UC7: lo que ve el cliente —')
const estado = paso('La Familia Gómez consulta su proyecto', await api(CLIENTE, 'GET', `/proyectos/${LAURELES}/estado`), 200)
if (estado?.acuerdo) {
  console.log(`    ${estado.proyecto.nombre} · ${estado.proyecto.estado}`)
  console.log(`    contratista ${estado.acuerdo.contratista} · precio ${pesos(estado.acuerdo.precioTotal)}`)
  console.log(`    último avance ${estado.ultimoAvance?.porcentaje}% · desviación ${estado.ultimoAvance?.desviacionPorcentaje}% · alerta ${estado.ultimoAvance?.alerta}`)
  for (const h of estado.acuerdo.hitos) {
    console.log(`    hito ${h.numero}: ${pesos(h.monto)} · ${h.estado}${h.comprobante ? ` (ref ${h.comprobante.referencia})` : ''}`)
  }
}
const historial = paso('El cliente consulta el historial de cambios', await api(CLIENTE, 'GET', `/acuerdos/${acuerdoInicial.id}/historial`), 200)
for (const c of historial ?? []) console.log(`    ${pesos(c.precioAnterior)} → ${pesos(c.precioNuevo)} · ${c.justificacion}`)
const ajeno = await api(MATEO, 'GET', `/proyectos/${LAURELES}/avances`)
console.log(`${ajeno.datos.length === 0 ? '✔' : '✖'} Mateo no ve los avances de la obra de Carlos → ${ajeno.datos.length}`)

console.log('\n— UC6: portafolio —')
const portafolio = paso('Gerencia consulta el portafolio', await api(GERENCIA, 'GET', '/portafolio'), 200)
for (const p of portafolio?.proyectos ?? []) {
  console.log(`    ${p.nombre} · avance ${p.avance}% · costo ${pesos(p.costoReal)} / ${pesos(p.presupuesto)} · desviación ${p.desviacion}%${p.alerta ? ' ⚠ ALERTA' : ''}`)
}