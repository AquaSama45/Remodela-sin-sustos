import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import RegistroAvanceForm from '../features/avance/RegistroAvanceForm'
import CotizacionForm from '../features/cotizaciones/CotizacionForm'
import { HardHat, LogOut, ArrowLeft, FileText, TrendingUp, Building } from 'lucide-react'

// Obras del caso ancla
const PROYECTOS_CAMPO = [
  { id: 'proy-laureles', nombre: 'Apt 78 m² Laureles (Cocina y Baño)' },
  { id: 'proy-sabaneta', nombre: 'Casa 120 m² Sabaneta (Por Etapas)' },
  { id: 'proy-belen', nombre: 'Apt 63 m² Belén (Cocina integral)' },
]

export default function Campo() {
  const { user, rol, proyectosAsignados, logout } = useAuth()
  const navigate = useNavigate()

  // Filtro de proyectos según asignación del contratista (US-11 / RNF-03)
  const misProyectos = rol === 'coordinador'
    ? PROYECTOS_CAMPO
    : PROYECTOS_CAMPO.filter((p) => proyectosAsignados?.includes(p.id))

  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(() => misProyectos[0] || PROYECTOS_CAMPO[0])
  const [pestanaActiva, setPestanaActiva] = useState('cotizar') // 'cotizar' (US-02) o 'avance' (US-05)

  const handleSalir = () => {
    if (rol === 'contratista') {
      logout()
      navigate('/login')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      {/* Barra superior de obra (Mobile-first) */}
      <header className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-20 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-emerald-600 rounded-lg text-white">
              <HardHat className="w-5 h-5" />
            </span>
            <div>
              <h1 className="font-bold text-sm leading-tight">{user?.nombre || 'Vista de Campo'}</h1>
              <p className="text-[11px] text-slate-400">
                {proyectoSeleccionado?.nombre || 'Obra asignada'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSalir}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            {rol === 'contratista' ? (
              <>
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Salir</span>
              </>
            ) : (
              <>
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Contenedor phone-first (máximo 480px, centrado) */}
      <main className="max-w-md mx-auto p-4 pt-3 space-y-3">
        {/* Selector de modo para el contratista: Cotizar vs Reportar Avance */}
        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setPestanaActiva('cotizar')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              pestanaActiva === 'cotizar'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Cotizar Obra (US-02)</span>
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('avance')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              pestanaActiva === 'avance'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>2. Reportar Avance (US-05)</span>
          </button>
        </div>

        {/* Formulario según pestaña seleccionada */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
          {pestanaActiva === 'cotizar' ? (
            <div>
              <div className="mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Cotización de Remodelación</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Estructura fija en 5 categorías obligatorias y cláusula de exclusiones (<strong>RF-03</strong>).
                </p>
              </div>

              <CotizacionForm proyecto={proyectoSeleccionado} />
            </div>
          ) : (
            <div>
              <div className="mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Registro de Jornada en Obra</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reporte de avance y costos reales con guardado local automático (<strong>RF-07, RF-09</strong>).
                </p>
              </div>

              <RegistroAvanceForm />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
