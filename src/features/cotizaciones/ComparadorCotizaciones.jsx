import { useState } from 'react'
import {
  FileSpreadsheet,
  ShieldCheck,
  Printer,
  TrendingDown,
  Zap,
  FileCheck,
  Building2,
} from 'lucide-react'

// Cotizaciones de prueba del caso ancla (Obra Clara S.A.S.)
const COTIZACIONES_CASO_ANCLA = [
  {
    id: 'cotiz-carlos',
    contratista: 'Carlos Pérez',
    empresa: 'Contratista Integral (Llave en mano)',
    materiales: 11500000,
    manoObra: 8500000,
    imprevistos: 1900000,
    total: 21900000,
    tiempoDias: 28,
    formaPagoResumen: '40% Anticipo / 30% Obra Gris / 30% Liquidación',
    hitos: [
      { descripcion: 'Anticipo para compra de materiales e inicio', porcentaje: 40, monto: 8760000 },
      { descripcion: 'Demolición, red hidrosanitaria y enchapes', porcentaje: 30, monto: 6570000 },
      { descripcion: 'Instalación de aparatos, acabados y entrega', porcentaje: 30, monto: 6570000 },
    ],
    exclusiones: 'Sin exclusiones. Incluye retiro de escombros y limpieza.',
    estado: 'ENVIADA',
  },
  {
    id: 'cotiz-gustavo',
    contratista: 'Gustavo Osorio',
    empresa: 'Maestro de Obra (Por administración)',
    materiales: 13200000,
    manoObra: 9000000,
    imprevistos: 1500000,
    total: 23700000,
    tiempoDias: 35,
    formaPagoResumen: '50% Inicio / 50% Entrega',
    hitos: [
      { descripcion: 'Anticipo inicial de obra', porcentaje: 50, monto: 11850000 },
      { descripcion: 'Acta de entrega final a satisfacción', porcentaje: 50, monto: 11850000 },
    ],
    exclusiones: 'No incluye acarreos de escombros fuera de la unidad residencial.',
    estado: 'ENVIADA',
  },
  {
    id: 'cotiz-mateo',
    contratista: 'Mateo Henao',
    empresa: 'Taller de Acabados Belén',
    materiales: 10800000,
    manoObra: 10500000,
    imprevistos: 1200000,
    total: 22500000,
    tiempoDias: 25,
    formaPagoResumen: '30% Inicio / 40% Avance / 30% Entrega',
    hitos: [
      { descripcion: 'Anticipo para acopio de porcelanato y tubería', porcentaje: 30, monto: 6750000 },
      { descripcion: 'Avance al 50% de partidas ejecutadas', porcentaje: 40, monto: 9000000 },
      { descripcion: 'Entrega final y pruebas técnicas', porcentaje: 30, monto: 6750000 },
    ],
    exclusiones: 'No incluye accesorios de grifería ni espejos.',
    estado: 'ENVIADA',
  },
]

export default function ComparadorCotizaciones({ proyecto }) {
  const proyId = proyecto?.id || 'proy-laureles'
  const ACUERDO_KEY = `acuerdo-vigente-${proyId}`

  const [acuerdoVigente, setAcuerdoVigente] = useState(() => {
    try {
      const guardado = localStorage.getItem(ACUERDO_KEY)
      return guardado ? JSON.parse(guardado) : null
    } catch {
      return null
    }
  })

  const [cotizaciones, setCotizaciones] = useState(COTIZACIONES_CASO_ANCLA)
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null)
  const [mostrarModalConfirmar, setMostrarModalConfirmar] = useState(false)

  const formatearDinero = (monto) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto || 0)

  const menorCosto = cotizaciones.length > 0 ? Math.min(...cotizaciones.map((c) => c.total)) : 0
  const menorTiempo = cotizaciones.length > 0 ? Math.min(...cotizaciones.map((c) => c.tiempoDias)) : 0

  const handleAbrirAceptar = (cotiz) => {
    setCotizacionSeleccionada(cotiz)
    setMostrarModalConfirmar(true)
  }

  const handleConfirmarAcuerdo = () => {
    if (!cotizacionSeleccionada) return

    const nuevoAcuerdo = {
      id: `acuerdo-${proyId}`,
      proyectoId: proyId,
      proyectoNombre: proyecto?.nombre || 'Proyecto de Remodelación',
      cliente: proyecto?.cliente || 'Cliente Propietario',
      empresaCoordinadora: 'Obra Clara S.A.S.',
      contratista: cotizacionSeleccionada.contratista,
      contratistaModalidad: cotizacionSeleccionada.empresa,
      precioTotal: cotizacionSeleccionada.total,
      tiempoDias: cotizacionSeleccionada.tiempoDias,
      fechaFirma: new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      hitos: cotizacionSeleccionada.hitos.map((h, i) => ({
        id: `hito-${i + 1}`,
        descripcion: h.descripcion,
        porcentaje: h.porcentaje,
        monto: (cotizacionSeleccionada.total * h.porcentaje) / 100,
        estado: 'PENDIENTE',
      })),
      exclusiones: cotizacionSeleccionada.exclusiones,
      estado: 'VIGENTE',
    }

    try {
      localStorage.setItem(ACUERDO_KEY, JSON.stringify(nuevoAcuerdo))
    } catch (e) {
      console.error('Error al guardar acuerdo:', e)
    }

    setCotizaciones((prev) =>
      prev.map((c) =>
        c.id === cotizacionSeleccionada.id
          ? { ...c, estado: 'ACEPTADA' }
          : { ...c, estado: 'RECHAZADA' }
      )
    )
    setAcuerdoVigente(nuevoAcuerdo)
    setMostrarModalConfirmar(false)
  }

  return (
    <div className="space-y-6">
      {/* 1. VISTA DE ACUERDO FORMAL GENERADO (US-04) */}
      {acuerdoVigente ? (
        <div className="space-y-5">
          {/* Banner de pantalla (OCULTO EN IMPRESIÓN con .no-print) */}
          <div className="no-print bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight">Acuerdo Formal Vigente</span>
                  <span className="bg-emerald-950 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-700">
                    OFICIAL · EN EJECUCIÓN
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Firmado el <strong>{acuerdoVigente.fechaFirma}</strong> · Trazable según RF-05
                </p>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all self-start sm:self-auto cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar en PDF</span>
            </button>
          </div>

          {/* DOCUMENTO FORMAL (HOJA MEMBRETADA PARA PANTALLA Y PAPEL/PDF) */}
          <div className="hoja-imprimible bg-white p-6 sm:p-12 rounded-2xl border border-slate-200 shadow-sm space-y-7 print:border-none print:p-0">
            {/* Membrete Institucional Formal */}
            <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-900 mb-1">
                  <Building2 className="w-6 h-6 text-indigo-700 print:text-black" />
                  <span className="font-serif-schoolbook text-lg font-black tracking-tight uppercase">
                    Obra Clara S.A.S.
                  </span>
                </div>
                <p className="text-xs text-slate-500 print:text-slate-700">
                  Coordinación y Supervisión de Remodelaciones de Vivienda
                </p>
                <p className="text-[11px] text-slate-400 print:text-slate-600">
                  Valle de Aburrá, Antioquia · NIT: 901.458.239-1
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Acta de Acuerdo N°
                </span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  AGY-ACU-{proyId.toUpperCase()}
                </span>
                <div className="text-xs text-slate-500 mt-1">
                  Fecha: <strong>{acuerdoVigente.fechaFirma}</strong>
                </div>
              </div>
            </div>

            {/* Título Principal */}
            <div className="text-center py-2">
              <h1 className="font-serif-schoolbook text-2xl font-bold text-slate-900 tracking-tight uppercase">
                Acuerdo Formal de Ejecución de Remodelación
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Documento vinculante de alcance, cronograma y condiciones económicas (<strong>RF-05</strong>)
              </p>
            </div>

            {/* Resumen del Proyecto y Precio */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 print:bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block">Obra / Inmueble:</span>
                <span className="font-serif-schoolbook text-sm font-bold text-slate-900 block mt-0.5">
                  {acuerdoVigente.proyectoNombre}
                </span>
                <span className="text-slate-600 text-[11px]">Plazo pactado: {acuerdoVigente.tiempoDias} días hábiles</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-semibold block">Presupuesto Total Acordado:</span>
                <span className="font-serif-schoolbook text-xl font-black text-indigo-950 print:text-black block mt-0.5">
                  {formatearDinero(acuerdoVigente.precioTotal)}
                </span>
                <span className="text-[11px] text-slate-500">Monto fijo no modificable sin acta de cambio</span>
              </div>
            </div>

            {/* Partes Intervinientes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-500 block uppercase text-[10px] tracking-wider mb-1">
                  1. Entidad Coordinadora
                </span>
                <div className="font-bold text-slate-900">{acuerdoVigente.empresaCoordinadora}</div>
                <div className="text-slate-500 text-[11px]">Supervisión y control de calidad</div>
              </div>

              <div className="p-3 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-500 block uppercase text-[10px] tracking-wider mb-1">
                  2. Contratista Asignado
                </span>
                <div className="font-bold text-slate-900">{acuerdoVigente.contratista}</div>
                <div className="text-slate-500 text-[11px]">{acuerdoVigente.contratistaModalidad}</div>
              </div>

              <div className="p-3 border border-slate-200 rounded-lg">
                <span className="font-bold text-slate-500 block uppercase text-[10px] tracking-wider mb-1">
                  3. Cliente Propietario
                </span>
                <div className="font-bold text-slate-900">{acuerdoVigente.cliente}</div>
                <div className="text-slate-500 text-[11px]">Propietario del inmueble</div>
              </div>
            </div>

            {/* Tabla de Hitos de Pago */}
            <div className="space-y-2.5">
              <h2 className="font-serif-schoolbook font-bold text-slate-900 text-sm uppercase tracking-wide">
                Cláusula de Pagos por Hitos de Avance Comprobado
              </h2>
              <div className="overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 print:bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">N°</th>
                      <th className="py-2.5 px-3">Hito / Condición de Desembolso</th>
                      <th className="py-2.5 px-3 text-center w-24">% Total</th>
                      <th className="py-2.5 px-3 text-right w-36">Monto (COP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {acuerdoVigente.hitos?.map((h, idx) => (
                      <tr key={h.id || idx}>
                        <td className="py-2 px-3 text-center font-bold text-slate-900">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium">{h.descripcion}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                          {h.porcentaje}%
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {formatearDinero(h.monto)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 print:bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
                      <td colSpan="2" className="py-2.5 px-3 text-right">TOTAL PACTADO:</td>
                      <td className="py-2.5 px-3 text-center">100%</td>
                      <td className="py-2.5 px-3 text-right">{formatearDinero(acuerdoVigente.precioTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Exclusiones Estipuladas */}
            <div className="p-3.5 bg-slate-50 print:bg-white print:border print:border-slate-300 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-900 block">Exclusiones Estipuladas:</span>
              <p className="text-slate-700 font-serif-schoolbook italic">{acuerdoVigente.exclusiones}</p>
            </div>

            {/* SECCIÓN DE FIRMAS FORMALES PARA IMPRESIÓN (ajustada para una sola hoja) */}
            <div className="pt-5 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs print:pt-4" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div className="space-y-1">
                <div className="border-b border-slate-900 pb-8"></div>
                <div className="font-bold text-slate-900 pt-1">Diana Cardona</div>
                <div className="text-[11px] text-slate-500">Coordinadora General · Obra Clara</div>
              </div>

              <div className="space-y-1">
                <div className="border-b border-slate-900 pb-8"></div>
                <div className="font-bold text-slate-900 pt-1">{acuerdoVigente.contratista}</div>
                <div className="text-[11px] text-slate-500">Contratista Responsable</div>
              </div>

              <div className="space-y-1">
                <div className="border-b border-slate-900 pb-8"></div>
                <div className="font-bold text-slate-900 pt-1">{acuerdoVigente.cliente}</div>
                <div className="text-[11px] text-slate-500">Cliente Propietario</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 2. VISTA COMPARATIVA MATRICIAL (US-03) */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
            <div>
              <h2 className="text-base font-bold text-slate-900">Comparativa Homogénea de Cotizaciones</h2>
              <p className="text-xs text-slate-500">
                Las cotizaciones recibidas se estructuran sobre las mismas categorías del alcance oficial (<strong>RF-04</strong>).
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
              {cotizaciones.length} propuestas recibidas
            </span>
          </div>

          {/* Tabla Matricial */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <th className="py-3.5 px-4 font-bold text-slate-500 uppercase tracking-wider w-44">
                      Rubro / Criterio
                    </th>
                    {cotizaciones.map((cotiz) => {
                      const esMenorCosto = cotiz.total === menorCosto
                      const esMenorTiempo = cotiz.tiempoDias === menorTiempo

                      return (
                        <th key={cotiz.id} className="py-3.5 px-4 min-w-[220px] align-top">
                          <div className="space-y-1.5">
                            <div className="font-bold text-sm text-slate-900">{cotiz.contratista}</div>
                            <div className="text-[11px] font-normal text-slate-500">{cotiz.empresa}</div>

                            <div className="flex flex-wrap gap-1 pt-1">
                              {esMenorCosto && (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                  <TrendingDown className="w-3 h-3 text-emerald-600" />
                                  Mejor Costo
                                </span>
                              )}
                              {esMenorTiempo && (
                                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                                  <Zap className="w-3 h-3 text-indigo-600" />
                                  Más Rápido
                                </span>
                              )}
                            </div>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr className="bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-900">Total Cotizado</td>
                    {cotizaciones.map((c) => (
                      <td key={c.id} className="py-3 px-4 font-bold text-slate-900 text-sm">
                        {formatearDinero(c.total)}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 text-slate-500">Materiales</td>
                    {cotizaciones.map((c) => (
                      <td key={c.id} className="py-2.5 px-4">
                        {formatearDinero(c.materiales)}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 text-slate-500">Mano de Obra</td>
                    {cotizaciones.map((c) => (
                      <td key={c.id} className="py-2.5 px-4">
                        {formatearDinero(c.manoObra)}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 text-slate-500">Imprevistos</td>
                    {cotizaciones.map((c) => (
                      <td key={c.id} className="py-2.5 px-4">
                        {formatearDinero(c.imprevistos)}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 text-slate-500">Tiempo de Entrega</td>
                    {cotizaciones.map((c) => (
                      <td key={c.id} className="py-2.5 px-4 font-semibold text-slate-800">
                        {c.tiempoDias} días hábiles
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 text-slate-500">Esquema de Pago</td>
                    {cotizaciones.map((c) => (
                      <td key={c.id} className="py-2.5 px-4 text-[11px] text-slate-600">
                        {c.formaPagoResumen}
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-amber-50/20">
                    <td className="py-2.5 px-4 font-semibold text-amber-950">Exclusiones declaradas</td>
                    {cotizaciones.map((c) => (
                      <td key={c.id} className="py-2.5 px-4 text-[11px] text-slate-600 italic">
                        {c.exclusiones}
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-white">
                    <td className="py-4 px-4 font-bold text-slate-800">Decisión</td>
                    {cotizaciones.map((c) => (
                      <td key={c.id} className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => handleAbrirAceptar(c)}
                          className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Aceptar Oferta</span>
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación Formal (US-04) */}
      {mostrarModalConfirmar && cotizacionSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto">
              <FileCheck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-serif-schoolbook text-xl font-bold text-slate-900">
                Confirmar y Formalizar Acuerdo
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Estás a punto de aceptar la cotización de <strong>{cotizacionSeleccionada.contratista}</strong> por un valor total de{' '}
                <strong className="text-slate-900">{formatearDinero(cotizacionSeleccionada.total)}</strong>.
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1">
                <div className="font-bold text-slate-800">Consecuencias formales:</div>
                <div className="text-[11px] text-slate-600 leading-tight">
                  • Se generará el Acuerdo Formal único y vinculante (RF-05).<br />
                  • El proyecto pasará al estado oficial <strong>EN EJECUCIÓN</strong>.<br />
                  • Se crearán los hitos de desembolso para el control de pagos (US-07).
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMostrarModalConfirmar(false)}
                className="w-1/2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarAcuerdo}
                className="w-1/2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Firmar y Formalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
