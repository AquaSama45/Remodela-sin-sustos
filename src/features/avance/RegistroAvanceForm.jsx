import { useState, useEffect } from 'react'

const PROYECTOS_MOCK = [
  { id: '1', nombre: 'Remodelación Cocina Apt 402 - Familia Gómez' },
  { id: '2', nombre: 'Baño Principal y Secundario - Casa Rosales' },
  { id: '3', nombre: 'Pisos y Pintura General - Edificio Altamira' }
]

const PARTIDAS_MOCK = [
  'Demolición y retiro de escombros',
  'Instalaciones hidrosanitarias y gas',
  'Instalaciones eléctricas e iluminación',
  'Enchape de pisos y paredes',
  'Carpintería y mobiliario',
  'Pintura y acabados finales'
]

export default function RegistroAvanceForm() {
  const [proyectoId, setProyectoId] = useState(PROYECTOS_MOCK[0].id)
  const DRAFT_KEY = `avance-campo-${proyectoId}`

  const initialForm = {
    partida: PARTIDAS_MOCK[0],
    porcentaje: 50,
    descripcion: '',
    tieneDesviacion: false,
    motivoDesviacion: '',
    fotoNombre: '',
    fecha: new Date().toISOString().slice(0, 10)
  }

  const [form, setForm] = useState(initialForm)
  const [ultimoGuardado, setUltimoGuardado] = useState(null)
  const [enviadoExitoso, setEnviadoExitoso] = useState(false)
  const [cargando, setCargando] = useState(false)

  // Patrón 3: Cargar borrador de localStorage al iniciar o cambiar de proyecto
  useEffect(() => {
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
      setForm(initialForm)
      setUltimoGuardado(null)
    }
    setEnviadoExitoso(false)
  }, [proyectoId])

  // Actualizar formulario y sincronizar en localStorage automáticamente
  const updateField = (field, value) => {
    setForm(prev => {
      const nuevo = { ...prev, [field]: value }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(nuevo))
      setUltimoGuardado(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      return nuevo
    })
  }

  const handleLimpiarBorrador = () => {
    if (window.confirm('¿Deseas descartar este borrador y empezar de cero?')) {
      localStorage.removeItem(DRAFT_KEY)
      setForm(initialForm)
      setUltimoGuardado(null)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setCargando(true)

    // Simulación de envío a Supabase (tabla registros_avance)
    setTimeout(() => {
      // Elimina el borrador local tras éxito (Patrón 3 del blueprint)
      localStorage.removeItem(DRAFT_KEY)
      setCargando(false)
      setEnviadoExitoso(true)
    }, 600)
  }

  if (enviadoExitoso) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-200 text-center animate-fade-in">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          ✓
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">¡Avance registrado!</h2>
        <p className="text-slate-600 text-sm mb-6">
          El reporte quedó guardado con éxito. El borrador local se ha limpiado.
        </p>

        {form.tieneDesviacion && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-lg text-left text-sm text-amber-900 mb-6">
            <span className="font-semibold block">⚠️ Alerta generada:</span>
            Se notificará al coordinador sobre el retraso/imprevisto reportado.
          </div>
        )}

        <button
          onClick={() => {
            setEnviadoExitoso(false)
            setForm(initialForm)
            setUltimoGuardado(null)
          }}
          className="w-full py-4 bg-primary text-white text-base font-semibold rounded-xl active:scale-[0.98] transition-transform shadow-md"
        >
          + Registrar otro avance
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Indicador de persistencia de borrador offline (RNF-01) */}
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-2.5 rounded-xl text-xs text-blue-800">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span>
            {ultimoGuardado
              ? `Borrador guardado en este móvil (${ultimoGuardado})`
              : 'Autoguardado local activo (no pierdes datos si se va la señal)'}
          </span>
        </div>
        {ultimoGuardado && (
          <button
            type="button"
            onClick={handleLimpiarBorrador}
            className="text-blue-600 hover:text-blue-800 font-medium underline ml-2"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* 1. Selector de Proyecto */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-2">
          Proyecto / Obra activa
        </label>
        <select
          value={proyectoId}
          onChange={(e) => setProyectoId(e.target.value)}
          className="w-full h-12 px-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
        >
          {PROYECTOS_MOCK.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>

      {/* 2. Partida / Trabajo ejecutado */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-2">
          Partida o tarea trabajada
        </label>
        <select
          value={form.partida}
          onChange={(e) => updateField('partida', e.target.value)}
          className="w-full h-12 px-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
        >
          {PARTIDAS_MOCK.map((partida, i) => (
            <option key={i} value={partida}>{partida}</option>
          ))}
        </select>
      </div>

      {/* 3. Porcentaje de avance: botones táctiles grandes para el pulgar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-semibold text-slate-800">
            Avance estimado de esta tarea
          </label>
          <span className="text-base font-bold text-primary">
            {form.porcentaje}%
          </span>
        </div>

        {/* Botones rápidos de un solo toque (25%, 50%, 75%, 100%) */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[25, 50, 75, 100].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => updateField('porcentaje', val)}
              className={`h-12 rounded-xl text-sm font-bold transition-all ${
                form.porcentaje === val
                  ? 'bg-primary text-white shadow-md scale-[1.02]'
                  : 'bg-white border border-slate-200 text-slate-700 active:bg-slate-100'
              }`}
            >
              {val}%
            </button>
          ))}
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={form.porcentaje}
          onChange={(e) => updateField('porcentaje', Number(e.target.value))}
          className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      {/* 4. Notas del día */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-2">
          ¿Qué se avanzó hoy? (Breve)
        </label>
        <textarea
          rows={3}
          value={form.descripcion}
          onChange={(e) => updateField('descripcion', e.target.value)}
          placeholder="Ej: Se instalaron tuberías de desagüe y quedó listo para sellar pared..."
          className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      {/* 5. Alerta de desviación / Imprevisto (Regla de negocio US-06) */}
      <div className={`p-4 rounded-xl border transition-colors ${
        form.tieneDesviacion ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'
      }`}>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.tieneDesviacion}
            onChange={(e) => updateField('tieneDesviacion', e.target.checked)}
            className="w-6 h-6 rounded-lg text-amber-600 focus:ring-amber-500 accent-amber-600"
          />
          <span className="text-sm font-bold text-slate-800">
            ⚠️ ¿Ocurrió algún imprevisto o retraso?
          </span>
        </label>

        {form.tieneDesviacion && (
          <div className="mt-3 pt-3 border-t border-amber-200">
            <label className="block text-xs font-semibold text-amber-900 mb-1">
              Describe el imprevisto (generará alerta al coordinador):
            </label>
            <input
              type="text"
              value={form.motivoDesviacion}
              onChange={(e) => updateField('motivoDesviacion', e.target.value)}
              placeholder="Ej: Fuga inesperada en montante o material roto"
              className="w-full h-11 px-3 rounded-lg border border-amber-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required={form.tieneDesviacion}
            />
          </div>
        )}
      </div>

      {/* 6. Evidencia fotográfica rápida */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-2">
          Foto de evidencia (Opcional)
        </label>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            id="foto-input"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                updateField('fotoNombre', file.name)
              }
            }}
            className="hidden"
          />
          <label
            htmlFor="foto-input"
            className="w-full h-14 border-2 border-dashed border-slate-300 hover:border-primary rounded-xl flex items-center justify-center gap-3 text-slate-600 cursor-pointer bg-white active:bg-slate-50"
          >
            <span className="text-xl">📷</span>
            <span className="text-sm font-medium">
              {form.fotoNombre ? `Foto seleccionada: ${form.fotoNombre}` : 'Tomar foto o subir de galería'}
            </span>
          </label>
        </div>
      </div>

      {/* Botón de envío grande según para el pulgar [min-h 52px] */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={cargando}
          className="w-full h-14 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-bold text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {cargando ? (
            <span>Guardando...</span>
          ) : (
            <>
              <span>Registrar Avance</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
