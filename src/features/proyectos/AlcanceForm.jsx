import { useState, useEffect } from 'react'
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Tag,
} from 'lucide-react'

// Sugerencias de la plantilla estándar basada en el caso ancla
const AMBIENTES_SUGERIDOS = ['Cocina', 'Baño Principal', 'Zona de Ropas', 'Habitación Principal', 'Sala Comedor']

const PARTIDAS_SUGERIDAS = {
  Cocina: [
    'Demolición de mesón y enchapes existentes',
    'Adecuación de red hidráulica y de gas',
    'Enchape de salpicadero y piso en porcelanato',
    'Mueble superior e inferior en melamina RH',
  ],
  'Baño Principal': [
    'Demolición de enchape y piso existente',
    'Instalación hidrosanitaria y desagües',
    'Enchape de paredes y piso antideslizante',
    'Instalación de sanitario, lavamanos y división en vidrio templado',
  ],
}

export default function AlcanceForm({ proyecto, onGuardarOficial }) {
  const DRAFT_KEY = `draft-alcance-${proyecto.id}`
  const OFFICIAL_KEY = `oficial-alcance-${proyecto.id}`

  // 1. Verificar si ya existe un alcance oficial sellado
  const [esOficial, setEsOficial] = useState(() => {
    return !!localStorage.getItem(OFFICIAL_KEY)
  })

  // 2. Estado de ambientes, partidas y materiales
  const [ambientes, setAmbientes] = useState(() => {
    const guardadoOficial = localStorage.getItem(OFFICIAL_KEY)
    if (guardadoOficial) {
      try {
        return JSON.parse(guardadoOficial)
      } catch (e) {
        console.error(e)
      }
    }
    const borradorLocal = localStorage.getItem(DRAFT_KEY)
    if (borradorLocal) {
      try {
        return JSON.parse(borradorLocal)
      } catch (e) {
        console.error(e)
      }
    }
    // Estado inicial por defecto para demostración
    return [
      {
        id: 'amb-1',
        nombre: 'Cocina',
        abierto: true,
        partidas: [
          {
            id: 'part-1',
            nombre: 'Demolición y adecuaciones hidrosanitarias',
            materiales: ['Tubería PVC 1/2 pulgada', 'Soldadura PVC', 'Cinta teflón'],
          },
          {
            id: 'part-2',
            nombre: 'Enchapes y acabados',
            materiales: ['Porcelanato 60x60 rectificado', 'Pegacor flexible gris', 'Boquilla impermeable'],
          },
        ],
      },
    ]
  })

  // Estado auxiliar de inputs
  const [nuevoAmbienteNombre, setNuevoAmbienteNombre] = useState('')
  const [nuevaPartidaNombre, setNuevaPartidaNombre] = useState({})
  const [nuevoMaterialNombre, setNuevoMaterialNombre] = useState({})
  const [ultimoGuardado, setUltimoGuardado] = useState(null)
  const [hayCambiosSinGuardar, setHayCambiosSinGuardar] = useState(false)

  // Modales
  const [mostrarModalSellar, setMostrarModalSellar] = useState(false)
  const [errorValidacion, setErrorValidacion] = useState('')

  // Advertir al usuario antes de salir si tiene cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hayCambiosSinGuardar && !esOficial) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hayCambiosSinGuardar, esOficial])

  // Guardar en borrador local
  const guardarBorrador = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(ambientes))
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setUltimoGuardado(hora)
    setHayCambiosSinGuardar(false)
  }

  // Modificaciones sobre el árbol
  const agregarAmbiente = (nombre) => {
    if (!nombre.trim() || esOficial) return
    const nuevo = {
      id: `amb-${Date.now()}`,
      nombre: nombre.trim(),
      abierto: true,
      partidas: [],
    }
    setAmbientes((prev) => [...prev, nuevo])
    setNuevoAmbienteNombre('')
    setHayCambiosSinGuardar(true)
  }

  const eliminarAmbiente = (ambId) => {
    if (esOficial) return
    setAmbientes((prev) => prev.filter((a) => a.id !== ambId))
    setHayCambiosSinGuardar(true)
  }

  const toggleAmbiente = (ambId) => {
    setAmbientes((prev) =>
      prev.map((a) => (a.id === ambId ? { ...a, abierto: !a.abierto } : a))
    )
  }

  const agregarPartida = (ambId, nombre) => {
    if (!nombre.trim() || esOficial) return
    const nueva = {
      id: `part-${Date.now()}`,
      nombre: nombre.trim(),
      materiales: [],
    }
    setAmbientes((prev) =>
      prev.map((a) =>
        a.id === ambId ? { ...a, partidas: [...a.partidas, nueva] } : a
      )
    )
    setNuevaPartidaNombre((prev) => ({ ...prev, [ambId]: '' }))
    setHayCambiosSinGuardar(true)
  }

  const eliminarPartida = (ambId, partId) => {
    if (esOficial) return
    setAmbientes((prev) =>
      prev.map((a) =>
        a.id === ambId
          ? { ...a, partidas: a.partidas.filter((p) => p.id !== partId) }
          : a
      )
    )
    setHayCambiosSinGuardar(true)
  }

  const agregarMaterial = (ambId, partId, nombre) => {
    if (!nombre.trim() || esOficial) return
    setAmbientes((prev) =>
      prev.map((a) => {
        if (a.id !== ambId) return a
        return {
          ...a,
          partidas: a.partidas.map((p) => {
            if (p.id !== partId) return p
            return { ...p, materiales: [...p.materiales, nombre.trim()] }
          }),
        }
      })
    )
    setNuevoMaterialNombre((prev) => ({ ...prev, [partId]: '' }))
    setHayCambiosSinGuardar(true)
  }

  const eliminarMaterial = (ambId, partId, matIndex) => {
    if (esOficial) return
    setAmbientes((prev) =>
      prev.map((a) => {
        if (a.id !== ambId) return a
        return {
          ...a,
          partidas: a.partidas.map((p) => {
            if (p.id !== partId) return p
            return {
              ...p,
              materiales: p.materiales.filter((_, idx) => idx !== matIndex),
            }
          }),
        }
      })
    )
    setHayCambiosSinGuardar(true)
  }

  // Validación y confirmación del sellado oficial (US-01)
  const handleIntentarSellar = () => {
    // Criterio de aceptación US-01: Debe tener al menos 1 ambiente, 1 partida y 1 material
    if (ambientes.length === 0) {
      setErrorValidacion('Debes definir al menos un ambiente para el alcance.')
      return
    }
    const tienePartida = ambientes.some((a) => a.partidas.length > 0)
    if (!tienePartida) {
      setErrorValidacion('Debes registrar al menos una partida de trabajo dentro de los ambientes.')
      return
    }
    const tieneMaterial = ambientes.some((a) =>
      a.partidas.some((p) => p.materiales.length > 0)
    )
    if (!tieneMaterial) {
      setErrorValidacion('Debes especificar al menos un material seleccionado para dar referencia a los contratistas.')
      return
    }

    setErrorValidacion('')
    setMostrarModalSellar(true)
  }

  const confirmarSelladoOficial = () => {
    localStorage.setItem(OFFICIAL_KEY, JSON.stringify(ambientes))
    localStorage.removeItem(DRAFT_KEY)
    setEsOficial(true)
    setHayCambiosSinGuardar(false)
    setMostrarModalSellar(false)
    if (onGuardarOficial) onGuardarOficial(ambientes)
  }

  return (
    <div className="space-y-6">
      {/* Banner de Estado Oficial o Borrador */}
      {esOficial ? (
        <div className="bg-emerald-50 border-2 border-emerald-500/60 p-4 rounded-xl flex items-start gap-3.5 shadow-sm">
          <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-950 text-base">Alcance Oficial Único Registrado</span>
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-300">
                <Lock className="w-3 h-3" /> SELLADO
              </span>
            </div>
            <p className="text-emerald-800 text-xs mt-1">
              Este alcance es la definición oficial única de la obra (<strong>RF-01</strong>). Todos los contratistas
              están cotizando sobre esta misma base. Los campos se encuentran en <strong>modo lectura</strong>; cualquier
              modificación debe tramitarse mediante la <em>Solicitud de Cambio de Alcance (US-10)</em>.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Save className="w-4 h-4 text-slate-400" />
            <span>
              {ultimoGuardado
                ? `Borrador guardado localmente a las ${ultimoGuardado}`
                : 'Modo edición de borrador'}
            </span>
            {hayCambiosSinGuardar && (
              <span className="text-amber-600 font-semibold text-[11px]">
                (Tienes cambios sin guardar)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={guardarBorrador}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar borrador</span>
            </button>

            <button
              type="button"
              onClick={handleIntentarSellar}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sellar como Oficial</span>
            </button>
          </div>
        </div>
      )}

      {errorValidacion && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorValidacion}</span>
        </div>
      )}

      {/* Árbol de Ambientes */}
      <div className="space-y-4">
        {ambientes.map((amb) => (
          <div
            key={amb.id}
            className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all"
          >
            {/* Cabecera del ambiente */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleAmbiente(amb.id)}
                className="flex items-center gap-2.5 text-left font-bold text-slate-800 text-sm hover:text-indigo-600 transition-colors"
              >
                {amb.abierto ? (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
                <span>Ambiente: {amb.nombre}</span>
                <span className="text-[11px] font-normal text-slate-500 font-mono">
                  ({amb.partidas.length} partidas)
                </span>
              </button>

              {!esOficial && (
                <button
                  type="button"
                  onClick={() => eliminarAmbiente(amb.id)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                  title="Eliminar ambiente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Contenido del ambiente (Partidas y Materiales) */}
            {amb.abierto && (
              <div className="p-4 space-y-4">
                {amb.partidas.length === 0 ? (
                  <div className="text-xs text-slate-400 italic text-center py-2">
                    No hay partidas registradas en este ambiente todavía.
                  </div>
                ) : (
                  amb.partidas.map((part) => (
                    <div
                      key={part.id}
                      className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          <span>Partida: {part.nombre}</span>
                        </div>
                        {!esOficial && (
                          <button
                            type="button"
                            onClick={() => eliminarPartida(amb.id, part.id)}
                            className="text-slate-400 hover:text-rose-600 text-[11px] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Lista de materiales */}
                      <div className="pl-4 space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span>Materiales de referencia:</span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {part.materiales.map((mat, matIdx) => (
                            <span
                              key={matIdx}
                              className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-lg shadow-2xs font-medium"
                            >
                              <span>{mat}</span>
                              {!esOficial && (
                                <button
                                  type="button"
                                  onClick={() => eliminarMaterial(amb.id, part.id, matIdx)}
                                  className="text-slate-400 hover:text-rose-600 font-bold ml-0.5"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                        </div>

                        {/* Input para agregar material a la partida */}
                        {!esOficial && (
                          <div className="flex items-center gap-2 pt-1 max-w-md">
                            <input
                              type="text"
                              placeholder="Ej: Pintura tipo 1 blanco Koraza..."
                              value={nuevoMaterialNombre[part.id] || ''}
                              onChange={(e) =>
                                setNuevoMaterialNombre((prev) => ({
                                  ...prev,
                                  [part.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  agregarMaterial(
                                    amb.id,
                                    part.id,
                                    nuevoMaterialNombre[part.id] || ''
                                  )
                                }
                              }}
                              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-1"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                agregarMaterial(
                                  amb.id,
                                  part.id,
                                  nuevoMaterialNombre[part.id] || ''
                                )
                              }
                              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Material</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {/* Agregar partida al ambiente */}
                {!esOficial && (
                  <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Nueva partida (ej: Enchape en cerámica, Red eléctrica)..."
                      value={nuevaPartidaNombre[amb.id] || ''}
                      onChange={(e) =>
                        setNuevaPartidaNombre((prev) => ({
                          ...prev,
                          [amb.id]: e.target.value,
                        }))
                      }
                      className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        agregarPartida(amb.id, nuevaPartidaNombre[amb.id] || '')
                      }
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 border border-indigo-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Partida</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Agregar nuevo ambiente */}
      {!esOficial && (
        <div className="bg-slate-50 border border-dashed border-slate-300 p-4 rounded-xl space-y-3">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Agregar nuevo ambiente al proyecto:</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Nombre del ambiente (ej: Terraza, Estudio, Balcón)..."
              value={nuevoAmbienteNombre}
              onChange={(e) => setNuevoAmbienteNombre(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-1"
            />
            <button
              type="button"
              onClick={() => agregarAmbiente(nuevoAmbienteNombre)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Ambiente</span>
            </button>
          </div>

          {/* Sugerencias rápidas */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400">Sugerencias:</span>
            {AMBIENTES_SUGERIDOS.filter(
              (sug) => !ambientes.some((a) => a.nombre.toLowerCase() === sug.toLowerCase())
            ).map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => agregarAmbiente(sug)}
                className="text-[11px] bg-white border border-slate-200 hover:border-indigo-400 text-slate-600 hover:text-indigo-600 px-2.5 py-0.5 rounded-full transition-colors"
              >
                + {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Sellado Oficial */}
      {mostrarModalSellar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                ¿Seguro de sellar este alcance como OFICIAL?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Después de esto, el alcance queda <strong>congelado</strong> para garantizar que todos los contratistas
                coticen sobre exactamente la misma base (<strong>RF-01</strong>).
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900 text-left font-medium">
                ⚠️ Para agregar o quitar cosas posteriormente, se deberá utilizar obligatoriamente el flujo de{' '}
                <strong>Cambio de Alcance formal (US-10)</strong>.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMostrarModalSellar(false)}
                className="w-1/2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Continuar editando
              </button>
              <button
                type="button"
                onClick={confirmarSelladoOficial}
                className="w-1/2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Sí, sellar oficial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
