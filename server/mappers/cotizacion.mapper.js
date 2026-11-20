// Traduce filas de la BD (snake_case) a la forma que usa el frontend (camelCase)

export function cotizacionADto(c) {
  const total = Number(c.total)
  return {
    id: c.id,
    proyectoId: c.proyecto_id,
    version: c.version,
    contratistaId: c.contratista_id,
    contratista: c.contratistas?.nombre ?? null,
    empresa: c.contratistas?.tipo_contratista ?? null,
    materiales: Number(c.costo_materiales),
    manoObra: Number(c.costo_mano_obra),
    imprevistos: Number(c.imprevistos),
    total,
    tiempoDias: c.tiempo_ejecucion_dias,
    formaPagoResumen: c.forma_pago,
    hitos: (c.hitos_propuestos ?? []).map((h) => ({
      descripcion: h.descripcion,
      porcentaje: Number(h.porcentaje),
      monto: Math.round((total * Number(h.porcentaje)) / 100),
    })),
    exclusiones: c.exclusiones || (c.sin_exclusiones ? 'Sin exclusiones' : null),
    sinExclusiones: c.sin_exclusiones,
    estado: c.estado,
    enviadaEn: c.enviada_en,
  }
}

// DTO del formulario → columnas de la tabla cotizaciones
export function cotizacionAFila(d) {
  return {
    costo_materiales: d.costoMateriales ?? 0,
    costo_mano_obra: d.costoManoObra ?? 0,
    imprevistos: d.imprevistos ?? 0,
    tiempo_ejecucion_dias: d.tiempoDias ?? null,
    hitos_propuestos: d.hitos,
    exclusiones: d.exclusiones || null,
    sin_exclusiones: d.declaraSinExclusiones,
    estado: d.enviar ? 'ENVIADA' : 'BORRADOR',
  }
}

export function acuerdoADto(a) {
  return {
    id: a.id,
    proyectoId: a.proyecto_id,
    cotizacionId: a.cotizacion_id,
    fechaFirma: a.fecha_firma,
    precioTotal: Number(a.precio_total),
    responsabilidades: a.responsabilidades,
    alcance: a.alcance_acordado,
    vigente: a.vigente,
    contratista: a.contratistas?.nombre ?? null,
    tiempoDias: a.cotizaciones?.tiempo_ejecucion_dias ?? null,
    // Misma forma que usa HitosPagoPanel
    hitos: (a.hitos_de_pago ?? []).map((h) => ({
      id: h.id,
      numero: h.orden,
      descripcion: h.descripcion,
      porcentaje: Number(h.porcentaje_pago),
      avanceRequerido: Number(h.porcentaje_obra),
      monto: Number(h.monto),
      estado: h.estado,
      notaRetencion: h.nota_retencion,
      aprobadoEn: h.aprobado_en,
      comprobante:
        h.estado === 'PAGADO'
          ? {
              fecha: h.pagado_en,
              monto: Number(h.monto_pagado),
              medio: h.medio_pago,
              referencia: h.referencia_pago,
              observaciones: h.observaciones_pago,
            }
          : null,
    })),
  }
}