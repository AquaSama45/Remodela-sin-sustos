import { Link } from 'react-router-dom'
import RegistroAvanceForm from '../features/avance/RegistroAvanceForm'

export default function Campo() {
  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      {/* Barra superior de obra / Modo Campo (Mobile-first) */}
      <header className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-20 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👷‍♂️</span>
            <div>
              <h1 className="font-bold text-base leading-tight">Vista de Campo</h1>
              <p className="text-xs text-slate-400">Rol: Contratista en obra (US-06)</p>
            </div>
          </div>
          <Link
            to="/"
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            ← Salir
          </Link>
        </div>
      </header>

      {/* Contenedor mobile-first (máximo 480px, centrado) */}
      <main className="max-w-md mx-auto p-4 pt-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="mb-5 pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Registro de Jornada</h2>
            <p className="text-xs text-slate-500 mt-1">
              Completa el avance diario. El sistema guarda tus cambios mientras escribes.
            </p>
          </div>

          <RegistroAvanceForm />
        </div>
      </main>
    </div>
  )
}
