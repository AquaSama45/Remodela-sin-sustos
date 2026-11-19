import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthContext'
import {
  DollarSign,
  Clock,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Save,
  Send,
  Lock,
  ShieldCheck,
  RotateCcw,
  Plus,
  Trash2,
  Percent,
} from 'lucide-react'

// Plantilla inicial de hitos basada en tu ejemplo
const HITOS_INICIALES = [
  { id: 'h-1', descripcion: 'Anticipo inicial para materiales', porcentaje: 40 },
  { id: 'h-2', descripcion: 'Avance al 50% de partidas de obra', porcentaje: 30 },
  { id: 'h-3', descripcion: 'Liquidación final y entrega a satisfacción', porcentaje: 30 },
]

export default function CotizacionForm({ proyecto }) {
  const { user } = useAuth()
  const DRAFT_KEY = `draft-cotizacion-${proyecto?.id || 'laureles'}-${user?.id || 'contra'}`
  const SENT_KEY = `sent-cotizacion-${proyecto?.id || 'laureles'}-${user?.id || 'contra'}`

  const [esEnviada, setEsEnviada] = useState(() => {
    return !!localStorage.getItem(SENT_KEY)
  })

  // Cargar alcance oficial del proyecto (US-01)
  const [alcanceOficial] = useState(() => {
    const guardado = localStorage.getItem(`oficial-alcance-${proyecto?.id}`)
    if (guardado) {
      try {
        return JSON.parse(guardado)
      } catch (e) {
        console.error(e)
      }
    }
    return [
      {
        id: 'amb-1',
        nombre: 'Cocina Integral',
        partidas: [
          {
            id: 'p-1',
            nombre: 'Demolición y red hidrosanitaria',
            materiales: ['Tubería PVC 1/2', 'Soldadura líquida', 'Pegante'],
          },
          {
            id: 'p-2',
            nombre: 'Enchapes y acabados',
            materiales: ['Porcelanato 60x60', 'Pegacor flexible gris'],
          },
        ],
      },
    ]
  })

  const [mostrarAlcance, setMostrarAlcance] = useState(false)

  const initialForm = {
    costoMateriales: '',
    costoManoObra: '',
    imprevistos: '',
    tiempoDias: '',
    hitos: HITOS_INICIALES,
    exclusiones: '',
    declaraSinExclusiones: false,
  }

  const [form, setForm] = useState(() => {
    const enviada = localStorage.getItem(SENT_KEY)
    if (enviada) {
      try {
        return JSON.parse(enviada)
      } catch (e) {
        console.error(e)
      }
    }
    const borrador = localStorage.getItem(DRAFT_KEY)
    if (borrador) {
      try {
        const parsed = JSON.parse(borrador)
        // Asegurar estructura de hitos si viene de borrador previo
        if (!parsed.hitos || !Array.isArray(parsed.hitos)) {
          parsed.hitos = HITOS_INICIALES
        }
        return parsed
      } catch (e) {
        console.error(e)
      }
    }
    return initialForm
  })

  const [ultimoGuardado, setUltimoGuardado] = useState(null)
  const [errorValidacion, setErrorValidacion] = useState('')
  const [cargando, setCargando] = useState(false)

  // Cálculos en tiempo real
  const mat = Math.max(0, Number(form.costoMateriales) || 0)
  const mo = Math.max(0, Number(form.costoManoObra) || 0)
  const imp = Math.max(0, Number(form.imprevistos) || 0)
  const totalCotizado = mat + mo + imp

  // Suma de porcentajes de hitos
  const sumaPorcentajes = form.hitos.reduce((acc, h) => acc + (Number(h.porcentaje) || 0), 0)
  const porcentajesValidos = Math.round(sumaPorcentajes) === 100

  const formatearDinero = (monto) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto)

  // Función para sanitizar números no negativos
  const sanitizarPositivo = (val) => {
    if (val === '') return ''
    const num = Number(val)
    return isNaN(num) || num < 0 ? 0 : num
  }

  const updateField = (field, value) => {
    if (esEnviada) return
    setForm((prev) => {
      const nuevo = { ...prev, [field]: value }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(nuevo))
      setUltimoGuardado(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      return nuevo
    })
    if (errorValidacion) setErrorValidacion('')
  }

  // Manejo de hitos dinámicos
  const actualizarHito = (index, campo, valor) => {
    if (esEnviada) return
    const nuevosHitos = [...form.hitos]
    if (campo === 'porcentaje') {
      nuevosHitos[index][campo] = sanitizarPositivo(valor)
    } else {
      nuevosHitos[index][campo] = valor
    }
    updateField('hitos', nuevosHitos)
  }

  const agregarHito = () => {
    if (esEnviada) return
    const restante = Math.max(0, 100 - sumaPorcentajes)
    const nuevo = {
      id: `h-${Date.now()}`,
      descripcion: `Hito ${form.hitos.length + 1}`,
      porcentaje: restante > 0 ? restante : 10,
    }
    updateField('hitos', [...form.hitos, nuevo])
  }

  const eliminarHito = (index) => {
    if (esEnviada || form.hitos.length <= 1) return
    const nuevos = form.hitos.filter((_, i) => i !== index)
    updateField('hitos', nuevos)
  }

  const handleLimpiarBorrador = () => {
    if (window.confirm('¿Deseas descartar este borrador y empezar de nuevo?')) {
      localStorage.removeItem(DRAFT_KEY)
      setForm(initialForm)
      setUltimoGuardado(null)
      setErrorValidacion('')
    }
  }

  // Validación estricta y envío de cotización
  const handleSubmit = (e) => {
    e.preventDefault()

    // 1. Prohibir valores negativos o vacíos
    if (!form.costoMateriales || Number(form.costoMateriales) < 0) {
      setErrorValidacion('El costo de materiales no puede ser negativo ni estar vacío.')
      return
    }
    if (!form.costoManoObra || Number(form.costoManoObra) < 0) {
      setErrorValidacion('El costo de mano de obra no puede ser negativo ni estar vacío.')
      return
    }
    if (form.imprevistos && Number(form.imprevistos) < 0) {
      setErrorValidacion('El monto de imprevistos no puede ser negativo.')
      return
    }
    if (!form.tiempoDias || Number(form.tiempoDias) <= 0) {
      setErrorValidacion('El tiempo de ejecución debe ser mayor a 0 días.')
      return
    }

    // 2. Validación de suma exacta de 100% en hitos de pago
    if (!porcentajesValidos) {
      setErrorValidacion(
        `La suma de los porcentajes de hitos de pago es ${sumaPorcentajes}%. Debe sumar exactamente 100%.`
      )
      return
    }

    // 3. Regla estricta de exclusiones (US-02)
    const tieneTextoExclusiones = form.exclusiones && form.exclusiones.trim().length > 0
    if (!tieneTextoExclusiones && !form.declaraSinExclusiones) {
      setErrorValidacion(
        'Regla de negocio (US-02): Para evitar sobrecostos sorpresa, si no especificas exclusiones debes marcar la casilla "Declaro que NO hay exclusiones".'
      )
      return
    }

    setCargando(true)

    setTimeout(() => {
      const datosFinales = {
        ...form,
        costoMateriales: mat,
        costoManoObra: mo,
        imprevistos: imp,
        tiempoDias: Math.max(1, Number(form.tiempoDias)),
        total: totalCotizado,
        estado: 'ENVIADA',
        fechaEnvio: new Date().toISOString(),
        contratistaNombre: user?.nombre || 'Contratista',
      }
      localStorage.setItem(SENT_KEY, JSON.stringify(datosFinales))
      localStorage.removeItem(DRAFT_KEY)
      setEsEnviada(true)
      setCargando(false)
    }, 600)
  }

  return (
    <div className="space-y-4">
      {/* 1. Panel Colapsable de Alcance Oficial */}
      <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setMostrarAlcance(!mostrarAlcance)}
          className="w-full p-3.5 flex items-center justify-between text-left text-xs font-bold text-indigo-950 hover:bg-indigo-100/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Ver Alcance Oficial a cotizar (US-01)</span>
          </div>
          {mostrarAlcance ? (
            <ChevronUp className="w-4 h-4 text-indigo-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {mostrarAlcance && (
          <div className="p-4 pt-1 border-t border-indigo-100 bg-white/70 space-y-3 text-xs">
            <p className="text-slate-600 text-[11px]">
              Tu cotización debe cubrir con precisión las siguientes partidas y materiales requeridos por la coordinación:
            </p>
            {alcanceOficial.map((amb) => (
              <div key={amb.id} className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>Ambiente: {amb.nombre}</span>
                </div>
                <div className="pl-3.5 space-y-1.5">
                  {amb.partidas?.map((part) => (
                    <div key={part.id} className="text-[11px] text-slate-700">
                      <span className="font-medium">• {part.nombre}</span>
                      {part.materiales?.length > 0 && (
                        <div className="text-[10px] text-slate-500 pl-2">
                          Materiales: {part.materiales.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estado: Cotización ya enviada */}
      {esEnviada && (
        <div className="bg-emerald-50 border-2 border-emerald-500/60 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-950 text-sm">Cotización ENVIADA</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                <Lock className="w-3 h-3 inline mr-1" />
                BLOQUEADA
              </span>
            </div>
            <p className="text-emerald-800 text-[11px] mt-1">
              Tu cotización fue enviada a la coordinación de Obra Clara por un total de{' '}
              <strong>{formatearDinero(totalCotizado)}</strong>. Cumpliendo la regla <strong>US-02</strong>, la cotización
              enviada no es editable directamente para garantizar la transparencia de la comparación (<strong>US-03</strong>).
            </p>
          </div>
        </div>
      )}

      {/* Formulario Phone-First */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Totalizador flotante */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            Total Propuesta Económica
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-0.5 tracking-tight">
            {formatearDinero(totalCotizado)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
            <span>Mat: {formatearDinero(mat)}</span>
            <span>MO: {formatearDinero(mo)}</span>
            <span>Imprev: {formatearDinero(imp)}</span>
          </div>
        </div>

        {/* 1. Costo Materiales */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            1. Costo estimado de materiales (COP) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="0"
              disabled={esEnviada}
              value={form.costoMateriales}
              onChange={(e) => updateField('costoMateriales', sanitizarPositivo(e.target.value))}
              className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* 2. Costo Mano de Obra */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            2. Costo mano de obra calificada (COP) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="0"
              disabled={esEnviada}
              value={form.costoManoObra}
              onChange={(e) => updateField('costoManoObra', sanitizarPositivo(e.target.value))}
              className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* 3. Imprevistos */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            3. Fondo de imprevistos sugerido (COP)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="0"
              disabled={esEnviada}
              value={form.imprevistos}
              onChange={(e) => updateField('imprevistos', sanitizarPositivo(e.target.value))}
              className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* 4. Tiempo de ejecución */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            4. Tiempo de ejecución estimado (días hábiles) *
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="Ej: 30"
              disabled={esEnviada}
              value={form.tiempoDias}
              onChange={(e) => updateField('tiempoDias', sanitizarPositivo(e.target.value))}
              className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
        </div>

        {/* 5. Forma de Pago por Hitos (100% Personalizable y con suma exacta de 100%) */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold text-slate-800">
                5. Forma de pago propuesta por hitos *
              </label>
              <p className="text-[11px] text-slate-500">
                Personaliza la descripción y porcentaje (%) de cada hito.
              </p>
            </div>

            {/* Indicador de suma total de porcentajes */}
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${porcentajesValidos
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                }`}
            >
              Total: {sumaPorcentajes}% {porcentajesValidos ? '✓' : '(debe ser 100%)'}
            </span>
          </div>

          <div className="space-y-2.5">
            {form.hitos.map((hito, idx) => {
              const valorHito = (totalCotizado * (Number(hito.porcentaje) || 0)) / 100
              return (
                <div
                  key={hito.id || idx}
                  className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 w-5 shrink-0">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      disabled={esEnviada}
                      placeholder="Descripción del hito (ej: Anticipo, Avance 50%)..."
                      value={hito.descripcion}
                      onChange={(e) => actualizarHito(idx, 'descripcion', e.target.value)}
                      className="flex-1 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    {!esEnviada && form.hitos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarHito(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Eliminar hito"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between pl-7 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">Porcentaje:</span>
                      <div className="relative w-20">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          inputMode="decimal"
                          disabled={esEnviada}
                          value={hito.porcentaje}
                          onChange={(e) => actualizarHito(idx, 'porcentaje', e.target.value)}
                          className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 text-right pr-6 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="absolute right-2 top-1 text-slate-400 text-xs font-bold">%</span>
                      </div>
                    </div>

                    <div className="text-[11px] font-bold text-emerald-700">
                      Equivale a: {formatearDinero(valorHito)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {!esEnviada && (
            <button
              type="button"
              onClick={agregarHito}
              className="w-full py-2 bg-white hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Agregar otro hito de pago</span>
            </button>
          )}
        </div>

        {/* 6. Cláusula de Exclusiones */}
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
          <div>
            <label className="block text-xs font-bold text-amber-950 mb-0.5">
              6. Exclusiones de la cotización
            </label>
            <p className="text-[11px] text-amber-800 leading-tight">
              Especifica qué <strong>NO</strong> incluye tu precio (ej: retiro de escombros, accesorios de lujo, iluminación).
            </p>
          </div>

          <textarea
            rows="2"
            disabled={esEnviada}
            placeholder="Escribe aquí las exclusiones específicas..."
            value={form.exclusiones}
            onChange={(e) => {
              updateField('exclusiones', e.target.value)
              if (e.target.value.trim().length > 0) {
                updateField('declaraSinExclusiones', false)
              }
            }}
            className="w-full bg-white disabled:bg-slate-100 border border-amber-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          {(!form.exclusiones || form.exclusiones.trim().length === 0) && (
            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                disabled={esEnviada}
                checked={form.declaraSinExclusiones}
                onChange={(e) => updateField('declaraSinExclusiones', e.target.checked)}
                className="accent-amber-600 w-4 h-4 mt-0.5"
              />
              <span className="text-[11px] font-bold text-amber-950">
                Declaro expresamente que NO hay exclusiones y este precio cubre el 100% de la obra.
              </span>
            </label>
          )}
        </div>

        {/* Mensaje de error de validación */}
        {errorValidacion && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorValidacion}</span>
          </div>
        )}

        {/* Botones de acción */}
        {!esEnviada && (
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={cargando || !porcentajesValidos}
              className={`w-full min-h-[46px] text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 ${porcentajesValidos
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]'
                  : 'bg-slate-400 cursor-not-allowed'
                }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {cargando
                  ? 'Enviando cotización...'
                  : !porcentajesValidos
                    ? `Ajusta los hitos para sumar 100% (actual: ${sumaPorcentajes}%)`
                    : 'Enviar Cotización Oficial'}
              </span>
            </button>

            {ultimoGuardado && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                <span>Borrador guardado: {ultimoGuardado}</span>
                <button
                  type="button"
                  onClick={handleLimpiarBorrador}
                  className="text-rose-600 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Descartar
                </button>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
