import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
  PlusCircle,
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  ChevronRight,
  HardHat,
} from 'lucide-react'

// Datos del caso ancla (Obra Clara S.A.S.)
export const PROYECTOS_INICIALES = [
  {
    id: 'proy-laureles',
    nombre: 'Apt 78 m² Laureles (Cocina y Baño)',
    cliente: 'Familia Gómez',
    contratista: 'Contratista Integral (Llave en mano)',
    presupuesto: 21900000,
    costoReal: 13140000,
    avance: 60,
    estado: 'EN_EJECUCION',
    desviacion: 0,
    alerta: false,
  },
  {
    id: 'proy-sabaneta',
    nombre: 'Casa 120 m² Sabaneta (Por Etapas)',
    cliente: 'Dra. Patricia Arango',
    contratista: 'Maestro de obra (Administración)',
    presupuesto: 38500000,
    costoReal: 27100000,
    avance: 50,
    estado: 'EN_EJECUCION',
    desviacion: 18, // 18% de sobrecosto (caso ancla del problema)
    alerta: true,
    motivoAlerta: 'Sobrecosto acumulado en materiales (+18%) detectado en solicitud de desembolso.',
  },
  {
    id: 'proy-belen',
    nombre: 'Apt 63 m² Belén (Cocina integral)',
    cliente: 'Andrés Felipe Morales',
    contratista: 'Taller de Acabados',
    presupuesto: 14700000,
    costoReal: 4410000,
    avance: 30,
    estado: 'EN_EJECUCION',
    desviacion: 0,
    alerta: false,
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [proyectos] = useState(PROYECTOS_INICIALES)

  const formatearDinero = (monto) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Encabezado de bienvenida */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portafolio de Remodelaciones</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bienvenida, <strong>{user?.nombre}</strong> · Supervisión activa de obras
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/campo"
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <HardHat className="w-4 h-4 text-emerald-400" />
            <span>Simulador de Campo</span>
          </Link>
        </div>
      </div>

      {/* Alerta Destacada US-06 (Caso Sabaneta) */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-sm flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-bold text-amber-900">Alerta de sobrecosto detectada (US-06 / RF-09)</div>
          <p className="text-amber-800 text-xs mt-0.5">
            La obra <strong>Casa 120 m² Sabaneta</strong> presenta una desviación del <strong>+18% en materiales</strong>.
            La regla de Postgres notificó esta alerta en el momento del registro.
          </p>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Obras Activas</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{proyectos.length} proyectos</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Presupuesto Comprometido</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {formatearDinero(proyectos.reduce((acc, p) => acc + p.presupuesto, 0))}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Costo Real Incurrido</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {formatearDinero(proyectos.reduce((acc, p) => acc + p.costoReal, 0))}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Lista de Proyectos Activos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-base">Obras en Supervisión</h2>
          <span className="text-xs text-slate-400 font-medium">Actualizado al último reporte</span>
        </div>

        <div className="divide-y divide-slate-100">
          {proyectos.map((p) => (
            <div key={p.id} className="p-5 hover:bg-slate-50/70 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{p.nombre}</span>
                    {p.alerta && (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                        <AlertTriangle className="w-3 h-3" />
                        Desviación +{p.desviacion}%
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Cliente: <strong>{p.cliente}</strong> · Contratista: {p.contratista}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Barra de avance */}
                  <div className="w-32">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Avance</span>
                      <span>{p.avance}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${p.alerta ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${p.avance}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Costos */}
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Presupuesto / Real</div>
                    <div className="text-xs font-bold text-slate-800">
                      {formatearDinero(p.costoReal)} / {formatearDinero(p.presupuesto)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
