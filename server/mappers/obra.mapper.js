// Filas de avance e historial → forma que usa el frontend

const numeroONulo = (v) => (v === null || v === undefined ? null : Number(v))

export function reporteADto(r) {
  return {
    id: r.id,
    proyectoId: r.proyecto_id,
    fecha: r.fecha,
    partida: r.partida,
    porcentaje: Number(r.porcentaje_completado),
    costoIncurrido: Number(r.costo_incurrido),
    descripcion: r.descripcion,
    motivoDesviacion: r.motivo_desviacion,
    fotoNombre: r.foto_url,
    // Calculado por el sistema (RF-09): el usuario no lo digita
    costoRealAcumulado: numeroONulo(r.costo_real_acumulado),
    costoPresupuestado: numeroONulo(r.costo_presupuestado),
    desviacionCosto: numeroONulo(r.desviacion_costo),
    desviacionPorcentaje: numeroONulo(r.desviacion_porcentaje),
    desviacionTiempoDias: r.desviacion_tiempo,
    alerta: r.supera_umbral,
    creadoEn: r.creado_en,
  }
}

export function cambioADto(c) {
  return {
    id: c.id,
    acuerdoId: c.acuerdo_id,
    fecha: c.fecha_cambio,
    autor: c.perfiles?.nombre ?? null,
    justificacion: c.detalle_justificacion,
    precioAnterior: numeroONulo(c.precio_anterior),
    precioNuevo: numeroONulo(c.precio_nuevo),
    versionAnterior: c.version_anterior,
    versionNueva: c.version_nueva,
  }
}