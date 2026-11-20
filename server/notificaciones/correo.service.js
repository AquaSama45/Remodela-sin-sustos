// Contenedor "Servicio de notificaciones" del C4 (US-04, US-06, UC9).
// Los triggers de la BD encolan los correos en la tabla notificaciones;
// aquí se envían con Resend y se marcan como enviados.
import { clienteSistema } from '../config/supabase.js'

const LOTE = 20
const MAX_INTENTOS = 5
const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

async function enviarConResend({ para, asunto, cuerpo }) {
  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.CORREO_REMITENTE ?? 'Remodela sin sustos <onboarding@resend.dev>',
      to: [para],
      subject: asunto,
      text: `${cuerpo}\n\n— Remodela sin sustos`,
    }),
  })
  if (!respuesta.ok) throw new Error(`Resend ${respuesta.status}: ${await respuesta.text()}`)
}

// Envía los correos pendientes. Nunca lanza error: un fallo de correo
// no revierte la operación de negocio; la fila queda pendiente y se reintenta.
export async function procesarCola({ db = clienteSistema, enviar = enviarConResend } = {}) {
  if (!db) return { enviadas: 0, omitido: 'Falta SUPABASE_SECRET_KEY' }
  if (enviar === enviarConResend && !process.env.RESEND_API_KEY) {
    return { enviadas: 0, omitido: 'Falta RESEND_API_KEY' }
  }

  try {
    const { data: pendientes, error } = await db
      .from('notificaciones')
      .select('id, destinatario, asunto, cuerpo, intentos')
      .eq('enviada', false)
      .lt('intentos', MAX_INTENTOS)
      .order('creado_en')
      .limit(LOTE)
    if (error) throw error

    // Modo demo: los destinatarios de prueba (.test) no existen, así que todo
    // se redirige a un buzón real indicando a quién iba dirigido.
    const redirigir = process.env.CORREO_REDIRIGIR_A
    let enviadas = 0

    for (const n of pendientes) {
      try {
        await enviar({
          para: redirigir || n.destinatario,
          asunto: redirigir ? `[para ${n.destinatario}] ${n.asunto}` : n.asunto,
          cuerpo: n.cuerpo,
        })
        await db
          .from('notificaciones')
          .update({ enviada: true, enviada_en: new Date().toISOString(), intentos: n.intentos + 1, ultimo_error: null })
          .eq('id', n.id)
        enviadas++
      } catch (e) {
        await db
          .from('notificaciones')
          .update({ intentos: n.intentos + 1, ultimo_error: String(e.message).slice(0, 500) })
          .eq('id', n.id)
      }
      await pausa(600) // Resend gratis: máximo 2 correos por segundo
    }

    return { enviadas, fallidas: pendientes.length - enviadas }
  } catch (e) {
    console.error('Cola de correos:', e.message)
    return { enviadas: 0, error: e.message }
  }
}