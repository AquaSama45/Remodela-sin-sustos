import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { HardHat, AlertTriangle, CheckCircle2, Clock, Building, Camera, RotateCcw } from 'lucide-react'

// Obras del caso ancla de Obra Clara S.A.S.
const PROYECTOS_DISPONIBLES = [
  {
    id: 'proy-laureles',
    nombre: 'Apt 78 m² Laureles (Cocina y Baño)',
    presupuestoHitoActual: 5000000,
    avancePrevio: 60,
  },
  {
    id: 'proy-sabaneta',
    nombre: 'Casa 120 m² Sabaneta (Por Etapas)',
    presupuestoHitoActual: 8000000,
    avancePrevio: 50,
  },
  {
    id: 'proy-belen',
    nombre: 'Apt 63 m² Belén (Cocina integral)',
    presupuestoHitoActual: 3500000,
    avancePrevio: 30,
  },
]

const PARTIDAS_MOCK = [
  'Demolición y retiro de escombros',
  'Instalaciones hidrosanitarias y gas',
  'Instalaciones eléctricas e iluminación',
  'Enchape de pisos y paredes',
  'Carpintería y mobiliario',
  'Pintura y acabados finales',
]

export default function RegistroAvanceForm() {
  const { user, rol, proyectosAsignados } = useAuth()

  // Filtro de seguridad (US-11 / RNF-03): Solo proyectos asignados al contratista
  const misProyectos = rol === 'coordinador'
    ? PROYECTOS_DISPONIBLES
    : PROYECTOS_DISPONIBLES.filter((p) => proyectosAsignados.includes(p.id))

  const [proyectoId, setProyectoId] = useState(() => misProyectos[0]?.id || '')

  useEffect(() => {
    if (misProyectos.length > 0 && (!proyectoId || !misProyectos.some((p) => p.id === proyectoId))) {
      setProyectoId(misProyectos[0].id)
    }
  }, [misProyectos, proyectoId])

  const proyectoActual = misProyectos.find((p) => p.id === proyectoId) || misProyectos[0]
  const DRAFT_KEY = `avance-campo-${proyectoId || 'default'}`

  const initialForm = {
    partida: PARTIDAS_MOCK[0],
    porcentaje: proyectoActual?.avancePrevio || 50,
    costoIncurrido: '',
    descripcion: '',
    tieneDesviacion: false,
    motivoDesviacion: '',
    fotoNombre: '',
    fecha: new Date().toISOString().slice(0, 10),
  }

  const [form, setForm] = useState(initialForm)
  const [ultimoGuardado, setUltimoGuardado] = useState(null)
  const [enviadoExitoso, setEnviadoExitoso] = useState(false)
  const [errorValidacion, setErrorValidacion] = useState('')
  const [cargando, setCargando] = useState(false)

  // Restaurar borrador de localStorage
  useEffect(() => {
    if (!proyectoId) return
    const guardado = localStorage.getItem(DRAFT_KEY)
    if (guardado) {
      try {
        const datos = JSON.parse(guardado)
        setForm(datos)
        setUltimoGuardado(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      } catch (e) {
        console.error('Error al leer borrador local:', e)
      }
    } else {
      setForm({
        ...initialForm,
        porcentaje: proyectoActual?.avancePrevio || 50,
      })
      setUltimoGuardado(null)
    }
    setEnviadoExitoso(false)
    setErrorValidacion('')
  }, [proyectoId])

  // Actualizar campo y persistir automáticamente en localStorage
  const updateField = (field, value) => {
    setForm((prev) => {
      const nuevo = { ...prev, [field]: value }
      if (proyectoId) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(nuevo))
        setUltimoGuardado(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      }
      return nuevo
    })
    if (errorValidacion) setErrorValidacion('')
  }

  const handleLimpiarBorrador = () => {
    if (window.confirm('¿Deseas descartar este borrador local y empezar de nuevo?')) {
      localStorage.removeItem(DRAFT_KEY)
      setForm({
        ...initialForm,
        porcentaje: proyectoActual?.avancePrevio || 50,
      })
      setUltimoGuardado(null)
      setErrorValidacion('')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Regla de Negocio US-05: El avance acumulado no puede ser menor al reporte previo
    const nuevoPorcentaje = Number(form.porcentaje)
    const previo = proyectoActual?.avancePrevio || 0
    if (nuevoPorcentaje < previo) {
      setErrorValidacion(
        `Regla de negocio (US-05): El avance reportado (${nuevoPorcentaje}%) no puede ser menor al avance previamente registrado (${previo}%).`
      )
      return
    }

    setCargando(true)

    // Simulación de envío a Supabase
    setTimeout(() => {
      localStorage.removeItem(DRAFT_KEY)
      setCargando(false)
      setEnviadoExitoso(true)
    }, 500)
  }

  if (misProyectos.length === 0) {
    return (
      <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 text-center text-sm text-amber-800">
        <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
        <p className="font-bold">No tienes obras asignadas</p>
        <p className="text-xs text-amber-700 mt-1">
          Comunícate con la coordinación de Obra Clara para ser vinculado a un proyecto.
        </p>
      </div>
    )
  }

  if (enviadoExitoso) {
    return (
      <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 text-center animate-fade-in">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">¡Avance registrado con éxito!</h3>
        <p className="text-slate-600 text-xs mt-1 mb-4">
          El reporte para <strong>{proyectoActual?.nombre}</strong> quedó guardado. El borrador local se ha limpiado.
        </p>

        {form.tieneDesviacion && (
          <div className="bg-amber-100/70 border border-amber-300 p-3 rounded-xl text-left text-xs text-amber-900 mb-5">
            <span className="font-bold block">⚠️ Alerta generada (US-06):</span>
            Se notificó a la coordinación sobre la desviación de costo/tiempo reportada.
          </div>
        )}

        <button
          onClick={() => {
            setEnviadoExitoso(false)
            setForm({
              ...initialForm,
              porcentaje: form.porcentaje,
            })
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          Registrar otro reporte
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Selector o indicador de obra asignada */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
          <span>Obra asignada:</span>
          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
            {misProyectos.length === 1 ? '1 obra asignada' : `${misProyectos.length} obras asignadas`}
          </span>
        </label>

        {misProyectos.length > 1 ? (
          <select
            value={proyectoId}
            onChange={(e) => setProyectoId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {misProyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
            <Building className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-slate-900">{proyectoActual?.nombre}</div>
              <div className="text-slate-500 text-[11px]">Avance oficial previo: {proyectoActual?.avancePrevio}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Partida de trabajo */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Partida o rubro reportado</label>
        <select
          value={form.partida}
          onChange={(e) => updateField('partida', e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {PARTIDAS_MOCK.map((partida) => (
            <option key={partida} value={partida}>
              {partida}
            </option>
          ))}
        </select>
      </div>

      {/* Porcentaje de avance acumulado */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-bold text-slate-700">Porcentaje de avance total</label>
          <span className="text-sm font-black text-emerald-600">{form.porcentaje}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={form.porcentaje}
          onChange={(e) => updateField('porcentaje', e.target.value)}
          className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>0% (Inicio)</span>
          <span>Último registrado: {proyectoActual?.avancePrevio}%</span>
          <span>100% (Final)</span>
        </div>
      </div>

      {/* Costo real de materiales incurrido */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Costo real de materiales en esta jornada (COP)
        </label>
        <input
          type="number"
          inputMode="decimal"
          placeholder="Ej: 1250000"
          value={form.costoIncurrido}
          onChange={(e) => updateField('costoIncurrido', e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <p className="text-[11px] text-slate-500 mt-0.5">
          Registrar el costo el mismo día evita sobrecostos tardíos (RF-09).
        </p>
      </div>

      {/* Descripción del avance */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Descripción del trabajo ejecutado</label>
        <textarea
          rows="3"
          placeholder="Describe brevemente qué se instaló, demolió o terminó hoy..."
          value={form.descripcion}
          onChange={(e) => updateField('descripcion', e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Checkbox de desviación de costo o tiempo */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
          <input
            type="checkbox"
            checked={form.tieneDesviacion}
            onChange={(e) => updateField('tieneDesviacion', e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded accent-emerald-600"
          />
          <span>¿Hubo algún sobrecosto o retraso imprevisto?</span>
        </label>

        {form.tieneDesviacion && (
          <div className="pt-2 animate-fade-in">
            <label className="block text-[11px] font-bold text-amber-800 mb-1">
              Motivo de la desviación (Alerta inmediata US-06)
            </label>
            <input
              type="text"
              placeholder="Ej: Fuga oculta en tubería antigua de gas"
              value={form.motivoDesviacion}
              onChange={(e) => updateField('motivoDesviacion', e.target.value)}
              className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
        )}
      </div>

      {/* Mensaje de error de regla de negocio */}
      {errorValidacion && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorValidacion}</span>
        </div>
      )}

      {/* Estado del guardado automático en local */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{ultimoGuardado ? `Borrador guardado: ${ultimoGuardado}` : 'Sin cambios pendientes'}</span>
        </div>
        {ultimoGuardado && (
          <button
            type="button"
            onClick={handleLimpiarBorrador}
            className="text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            Descartar borrador
          </button>
        )}
      </div>

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={cargando}
        className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 min-h-[44px]"
      >
        <HardHat className="w-4 h-4" />
        <span>{cargando ? 'Enviando avance...' : 'Guardar y Reportar Avance'}</span>
      </button>
    </form>
  )
}
