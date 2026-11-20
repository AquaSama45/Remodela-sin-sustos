import { useState, useEffect } from 'react'
import {
  DollarSign,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Receipt,
  Building2,
  Lock,
  ArrowUpRight,
  CreditCard,
} from 'lucide-react'

// Hitos de pago por defecto derivados del acuerdo formal o del caso ancla
const HITOS_BASE = [
  {
    id: 'hito-1',
    numero: 1,
    descripcion: 'Anticipo inicial para materiales y acopio en obra',
    porcentaje: 40,
    avanceRequerido: 0, // Se puede pagar de inmediato para iniciar
    monto: 8760000,
    estado: 'PAGADO',
    comprobante: {
      fecha: '2026-11-10',
      medio: 'Transferencia Bancolombia',
      referencia: 'TR-83920194',
      observaciones: 'Desembolso inicial según acta de acuerdo formal',
    },
  },
  {
    id: 'hito-2',
    numero: 2,
    descripcion: 'Finalización de demoliciones, redes hidrosanitarias y enchapes',
    porcentaje: 30,
    avanceRequerido: 50, // Requiere al menos 50% de avance acumulado
    monto: 6570000,
    estado: 'PENDIENTE',
    comprobante: null,
  },
  {
    id: 'hito-3',
    numero: 3,
    descripcion: 'Instalación de aparatos sanitarios, acabados y entrega final',
    porcentaje: 30,
    avanceRequerido: 95, // Requiere entrega (≥95%)
    monto: 6570000,
    estado: 'PENDIENTE',
    comprobante: null,
  },
]

export default function HitosPagoPanel({ proyecto }) {
  const proyId = proyecto?.id || 'proy-laureles'
  const HITOS_KEY = `hitos-pagos-${proyId}`
  const ACUERDO_KEY = `acuerdo-vigente-${proyId}`

  // 1. Cargar acuerdo formal si existe, para alinear los montos e hitos pactados
  const [acuerdo] = useState(() => {
    try {
      const guardado = localStorage.getItem(ACUERDO_KEY)
      return guardado ? JSON.parse(guardado) : null
    } catch {
      return null
    }
  })

  // 2. Cargar hitos (de localStorage o de la base)
  const [hitos, setHitos] = useState(() => {
    try {
      const guardado = localStorage.getItem(HITOS_KEY)
      if (guardado) return JSON.parse(guardado)

      if (acuerdo && acuerdo.hitos && acuerdo.hitos.length > 0) {
        return acuerdo.hitos.map((h, i) => ({
          id: h.id || `hito-${i + 1}`,
          numero: i + 1,
          descripcion: h.descripcion,
          porcentaje: h.porcentaje,
          monto: h.monto,
          avanceRequerido: i === 0 ? 0 : i === 1 ? 50 : 95,
          estado: h.estado || 'PENDIENTE',
          comprobante: h.comprobante || null,
        }))
      }
      return HITOS_BASE
    } catch {
      return HITOS_BASE
    }
  })

  const avanceActual = Number(proyecto?.avance || 60)

  // Modales
  const [hitoSeleccionado, setHitoSeleccionado] = useState(null)
  const [mostrarModalPago, setMostrarModalPago] = useState(false)

  // Formulario del modal de comprobante
  const [formPago, setFormPago] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    medio: 'Transferencia Bancolombia',
    referencia: '',
    observaciones: '',
  })
  const [errorModal, setErrorModal] = useState('')

  const formatearDinero = (monto) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto || 0)

  // Cálculos financieros consolidados
  const totalPresupuesto = hitos.reduce((acc, h) => acc + (Number(h.monto) || 0), 0)
  const totalPagado = hitos
    .filter((h) => h.estado === 'PAGADO')
    .reduce((acc, h) => acc + (Number(h.monto) || 0), 0)
  const totalPendiente = totalPresupuesto - totalPagado
  const porcentajePagado = totalPresupuesto > 0 ? Math.round((totalPagado / totalPresupuesto) * 100) : 0

  const handleAbrirPago = (hito) => {
    // Regla de Negocio US-07 / RF-08: El avance debe sustentar el cumplimiento del hito
    if (avanceActual < hito.avanceRequerido) {
      alert(
        `Regla de negocio (US-07): Este hito requiere un avance de obra mínimo de ${hito.avanceRequerido}%. El avance reportado actualmente es de ${avanceActual}%. El pago permanece retenido.`
      )
      return
    }

    setHitoSeleccionado(hito)
    setFormPago({
      fecha: new Date().toISOString().slice(0, 10),
      medio: 'Transferencia Bancolombia',
      referencia: `TR-${Math.floor(10000000 + Math.random() * 90000000)}`,
      observaciones: `Desembolso correspondiente al hito #${hito.numero}`,
    })
    setErrorModal('')
    setMostrarModalPago(true)
  }

  const handleConfirmarPago = (e) => {
    e.preventDefault()

    if (!formPago.referencia.trim()) {
      setErrorModal('Debes ingresar la referencia bancaria del comprobante para auditoría.')
      return
    }

    // Regla de inmutabilidad: el hito pasa a PAGADO y nunca puede revertirse
    const nuevosHitos = hitos.map((h) => {
      if (h.id === hitoSeleccionado.id) {
        return {
          ...h,
          estado: 'PAGADO',
          comprobante: {
            ...formPago,
            horaRegistro: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        }
      }
      return h
    })

    try {
      localStorage.setItem(HITOS_KEY, JSON.stringify(nuevosHitos))
    } catch (err) {
      console.error(err)
    }

    setHitos(nuevosHitos)
    setMostrarModalPago(false)
    setHitoSeleccionado(null)
  }

  return (
    <div className="space-y-6">
      {/* 1. RESUMEN FINANCIERO Y CONTRASTE CON AVANCE FÍSICO (RF-08 / RF-09) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-serif-schoolbook text-lg font-bold text-slate-900 tracking-tight">
              Control Financiero de Desembolsos
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisión de pagos condicionados al avance físico sustentado (<strong>RF-08</strong>).
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-500">Avance de Obra:</span>
            <span className="inline-flex items-center gap-1 bg-slate-900 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              {avanceActual}% reportado
            </span>
          </div>
        </div>

        {/* Tarjetas de Métricas Ejecutivas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Presupuesto Total
            </span>
            <span className="font-serif-schoolbook text-xl font-bold text-slate-900 block mt-1">
              {formatearDinero(totalPresupuesto)}
            </span>
            <span className="text-[11px] text-slate-500">100% comprometido en acuerdo</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
              Total Desembolsado
            </span>
            <span className="font-serif-schoolbook text-xl font-bold text-emerald-950 block mt-1">
              {formatearDinero(totalPagado)}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              {porcentajePagado}% del presupuesto liquidado
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Saldo Pendiente por Liberar
            </span>
            <span className="font-serif-schoolbook text-xl font-bold text-slate-700 block mt-1">
              {formatearDinero(totalPendiente)}
            </span>
            <span className="text-[11px] text-slate-500">Custodiado hasta verificar avance</span>
          </div>
        </div>

        {/* Barra comparativa Avance Físico vs Desembolso Financiero */}
        <div className="pt-1">
          <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
            <span>Contraste: Obra ejecutada ({avanceActual}%) vs Dinero desembolsado ({porcentajePagado}%)</span>
            <span className={avanceActual >= porcentajePagado ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
              {avanceActual >= porcentajePagado ? '✓ Operación sana y respaldada' : '⚠️ Desfase detectado'}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
            <div
              className="bg-emerald-600 h-full transition-all duration-500"
              style={{ width: `${porcentajePagado}%` }}
              title={`Pagado: ${porcentajePagado}%`}
            ></div>
          </div>
        </div>
      </div>

      {/* 2. LISTADO DE HITOS CON SEMÁFORO DE SUSTENTO */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif-schoolbook text-base font-bold text-slate-900">
            Hitos de Pago Estipulados en el Acuerdo
          </h3>
          <span className="text-xs text-slate-400">
            Regla: Prohibido doble pago (`BEFORE UPDATE` trigger en Postgres)
          </span>
        </div>

        <div className="space-y-3">
          {hitos.map((hito) => {
            const esPagado = hito.estado === 'PAGADO'
            const puedePagar = !esPagado && avanceActual >= hito.avanceRequerido
            const estaRetenido = !esPagado && avanceActual < hito.avanceRequerido

            return (
              <div
                key={hito.id}
                className={`p-5 rounded-2xl border transition-all ${
                  esPagado
                    ? 'bg-white border-slate-200/90 shadow-2xs'
                    : puedePagar
                    ? 'bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-500/10'
                    : 'bg-slate-50/60 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Información del hito */}
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        HITO #{hito.numero}
                      </span>
                      <span className="font-serif-schoolbook text-base font-bold text-slate-900">
                        {hito.descripcion}
                      </span>

                      {/* Semáforos Formales */}
                      {esPagado && (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          PAGADO
                        </span>
                      )}
                      {puedePagar && (
                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          Listo para desembolso
                        </span>
                      )}
                      {estaRetenido && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          Retenido (Falta avance)
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Equivale al <strong>{hito.porcentaje}%</strong> del total</span>
                      <span>•</span>
                      <span>Condición: Avance acumulado ≥ <strong>{hito.avanceRequerido}%</strong></span>
                    </div>

                    {/* Detalle del comprobante si ya fue pagado */}
                    {esPagado && hito.comprobante && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Comprobante: {hito.comprobante.referencia}</span>
                          <span className="text-slate-400 font-normal">({hito.comprobante.medio})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex gap-3">
                          <span>Fecha: {hito.comprobante.fecha}</span>
                          {hito.comprobante.observaciones && <span>Obs: {hito.comprobante.observaciones}</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Monto y Botón de Acción */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                        Monto del hito
                      </span>
                      <span className="font-serif-schoolbook text-lg font-bold text-slate-900">
                        {formatearDinero(hito.monto)}
                      </span>
                    </div>

                    {/* Botones según regla US-07 */}
                    {esPagado ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-not-allowed">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Pago bloqueado</span>
                      </span>
                    ) : puedePagar ? (
                      <button
                        type="button"
                        onClick={() => handleAbrirPago(hito)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Registrar Pago</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-200/80 text-slate-400 text-xs font-semibold rounded-xl cursor-not-allowed"
                        title={`Requiere avance de obra del ${hito.avanceRequerido}%`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Requiere {hito.avanceRequerido}%</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. MODAL RÁPIDO DE REGISTRO BANCARIO (US-07 / RF-08) */}
      {mostrarModalPago && hitoSeleccionado && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-schoolbook text-lg font-bold text-slate-900">
                  Registrar Pago de Hito #{hitoSeleccionado.numero}
                </h3>
                <p className="text-xs text-slate-500">Monto: {formatearDinero(hitoSeleccionado.monto)}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmarPago} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fecha de Desembolso *</label>
                <input
                  type="date"
                  value={formPago.fecha}
                  onChange={(e) => setFormPago({ ...formPago, fecha: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Medio de Pago Utilizado *</label>
                <select
                  value={formPago.medio}
                  onChange={(e) => setFormPago({ ...formPago, medio: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Transferencia Bancolombia">Transferencia Bancolombia</option>
                  <option value="Nequi / Daviplata">Nequi / Daviplata</option>
                  <option value="Consignación Bancaria">Consignación Bancaria</option>
                  <option value="Cheque de Gerencia">Cheque de Gerencia</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Número de Comprobante / Referencia *</label>
                <input
                  type="text"
                  placeholder="Ej: TR-94810294"
                  value={formPago.referencia}
                  onChange={(e) => setFormPago({ ...formPago, referencia: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observación o Nota (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Pago realizado previa aprobación de Diana Cardona"
                  value={formPago.observaciones}
                  onChange={(e) => setFormPago({ ...formPago, observaciones: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {errorModal && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{errorModal}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalPago(false)}
                  className="w-1/2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Registrar Pago Oficial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
