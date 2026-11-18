import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PROYECTOS_INICIALES } from './Dashboard'
import AlcanceForm from '../features/proyectos/AlcanceForm'
import {
  Building2,
  ArrowLeft,
  Layers,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Lock,
} from 'lucide-react'

export default function ProyectoDetalle() {
  const { id } = useParams()
  const proyecto = PROYECTOS_INICIALES.find((p) => p.id === id) || PROYECTOS_INICIALES[0]

  const [tabActiva, setTabActiva] = useState('alcance')

  const formatearDinero = (monto) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Botón de regreso y encabezado */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Portafolio</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{proyecto.nombre}</h1>
              {proyecto.alerta && (
                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                  <AlertTriangle className="w-3 h-3" />
                  Desviación +{proyecto.desviacion}%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cliente: <strong>{proyecto.cliente}</strong> · Modalidad: {proyecto.contratista}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs text-slate-400">Presupuesto Asignado</div>
            <div className="text-lg font-bold text-slate-900">{formatearDinero(proyecto.presupuesto)}</div>
          </div>
        </div>
      </div>

      {/* Barra de pestañas */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setTabActiva('alcance')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${tabActiva === 'alcance'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Alcance Oficial (US-01)</span>
          </button>

          <button
            onClick={() => setTabActiva('cotizaciones')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${tabActiva === 'cotizaciones'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>2. Cotizaciones y Acuerdo (US-03/04)</span>
          </button>

          <button
            onClick={() => setTabActiva('avance')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${tabActiva === 'avance'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>3. Avance de Obra ({proyecto.avance}%)</span>
          </button>

          <button
            onClick={() => setTabActiva('pagos')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${tabActiva === 'pagos'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>4. Hitos y Pagos (US-07)</span>
          </button>
        </nav>
      </div>

      {/* Contenido de la pestaña activa */}
      <div>
        {tabActiva === 'alcance' && <AlcanceForm proyecto={proyecto} />}

        {tabActiva === 'cotizaciones' && (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
            <FileSpreadsheet className="w-10 h-10 text-indigo-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Módulo de Comparación de Cotizaciones</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Aquí se compararán lado a lado las propuestas recibidas de los contratistas sobre la base del alcance oficial
              (US-03) y se generará el Acuerdo Formal (US-04).
            </p>
          </div>
        )}

        {tabActiva === 'avance' && (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
            <TrendingUp className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Historial y Desviaciones de Avance</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Los reportes que envían los contratistas desde su celular en campo (US-05) se reflejan aquí en tiempo real
              con cálculo automático de desviación (US-06).
            </p>
          </div>
        )}

        {tabActiva === 'pagos' && (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
            <DollarSign className="w-10 h-10 text-cyan-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Control de Hitos y Desembolsos</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Libera pagos contra hitos completados y comprobados con el avance de obra (US-07), evitando pagos duplicados.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
