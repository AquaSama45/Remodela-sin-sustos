import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import RegistroAvanceForm from '../features/avance/RegistroAvanceForm'
import { HardHat, LogOut, ArrowLeft } from 'lucide-react'

export default function Campo() {
  const { user, rol, logout } = useAuth()
  const navigate = useNavigate()

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
      {/* Barra superior de obra / Modo Campo (Mobile-first) */}
      <header className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-20 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-600 rounded-lg text-white">
              <HardHat className="w-5 h-5" />
            </span>
            <div>
              <h1 className="font-bold text-sm leading-tight">{user?.nombre || 'Vista de Campo'}</h1>
              <p className="text-[11px] text-slate-400">Rol activo: {rol} (US-05 / US-06)</p>
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

      {/* Contenedor mobile-first (máximo 480px, centrado) */}
      <main className="max-w-md mx-auto p-4 pt-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="mb-5 pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Registro de Jornada</h2>
            <p className="text-xs text-slate-500 mt-1">
              Completa el avance diario. El sistema guarda tus cambios mientras escribes (soporta conexión intermitente).
            </p>
          </div>

          <RegistroAvanceForm />
        </div>
      </main>
    </div>
  )
}
