// UC6 — Consultar consolidado del portafolio (RF-10)
import * as proyectos from '../repositories/proyectos.repository.js'

const TAMANO_MAXIMO = 50 // RNF-05: nunca se trae todo el portafolio de una vez

// Empresa.generarReportePortafolio() + Proyecto.consolidarCostosReales()
export async function generarReportePortafolio(db, { estado, pagina = 1, tamano = 20 }) {
  const porPagina = Math.min(Math.max(Number(tamano) || 20, 1), TAMANO_MAXIMO)
  const numeroPagina = Math.max(Number(pagina) || 1, 1)
  const desde = (numeroPagina - 1) * porPagina

  const { filas, total } = await proyectos.listarConSeguimiento(db, {
    estado,
    desde,
    hasta: desde + porPagina - 1,
  })

  // Misma forma que usa el Dashboard del frontend
  const items = filas.map((p) => {
    const acuerdo = p.acuerdos_formales.find((a) => a.vigente) ?? p.acuerdos_formales[0]
    const ultimo = p.reportes_avance[0] ?? null
    return {
      id: p.id,
      nombre: p.nombre,
      cliente: p.clientes?.nombre ?? null,
      estado: p.estado,
      presupuesto: Number(acuerdo.precio_total),
      costoReal: Number(ultimo?.costo_real_acumulado ?? 0),
      avance: Number(ultimo?.porcentaje_completado ?? 0),
      desviacion: Number(ultimo?.desviacion_porcentaje ?? 0),
      alerta: ultimo?.supera_umbral ?? false, // UC6 paso 4: resaltar los que superan el umbral
      ultimoReporte: ultimo?.fecha ?? null,
    }
  })

  return {
    proyectos: items,
    totales: {
      presupuesto: items.reduce((s, p) => s + p.presupuesto, 0),
      costoReal: items.reduce((s, p) => s + p.costoReal, 0),
      conAlerta: items.filter((p) => p.alerta).length,
    },
    paginacion: { pagina: numeroPagina, tamano: porPagina, total },
  }
}