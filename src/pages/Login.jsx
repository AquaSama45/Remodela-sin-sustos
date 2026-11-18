import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { KeyRound, HardHat, UserCheck, ShieldAlert, Building2 } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginSimulado, isAuthenticated, rol } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Si ya tiene sesión activa, redirigir automáticamente
  if (isAuthenticated) {
    if (rol === 'contratista') navigate('/campo', { replace: true })
    else navigate('/', { replace: true })
  }

  const handleLoginSubmit = (e) => {
    e.preventDefault()
    // Si escribe un email, podemos inferir o asignar por defecto coordinador
    loginSimulado('coordinador')
    navigate('/')
  }

  const handleQuickLogin = (rolKey) => {
    loginSimulado(rolKey)
    if (rolKey === 'contratista') {
      navigate('/campo')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-3 shadow-lg shadow-indigo-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Remodela sin sustos</h1>
          <p className="text-sm text-slate-400 mt-1">
            Control de obras y cotizaciones · Obra Clara S.A.S.
          </p>
        </div>

        {/* Formulario tradicional */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu-correo@obraclara.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <KeyRound className="w-4 h-4" />
            Ingresar al sistema
          </button>
        </form>

        {/* Separador de Desarrollo / Pruebas rápidas */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Accesos rápidos por rol (Modo desarrollo)
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Inicia sesión con un solo clic con los usuarios del caso ancla:
          </p>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickLogin('coordinador')}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 hover:bg-slate-700 border border-slate-700/80 transition-all text-left text-xs"
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="font-semibold text-slate-200">Diana Cardona (Coordinación)</div>
                  <div className="text-slate-400 text-[11px]">diana.cardona@obraclara.com</div>
                </div>
              </div>
              <span className="bg-indigo-900/50 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-700">
                Coordinador
              </span>
            </button>

            <button
              onClick={() => handleQuickLogin('contratista')}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 hover:bg-slate-700 border border-slate-700/80 transition-all text-left text-xs"
            >
              <div className="flex items-center gap-2.5">
                <HardHat className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-slate-200">Carlos Pérez (Contratista de Obra)</div>
                  <div className="text-slate-400 text-[11px]">Acceso directo a Vista de Campo</div>
                </div>
              </div>
              <span className="bg-emerald-900/50 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-700">
                Campo
              </span>
            </button>

            <button
              onClick={() => handleQuickLogin('cliente')}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 hover:bg-slate-700 border border-slate-700/80 transition-all text-left text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-semibold text-slate-200">Familia Gómez (Cliente Propietario)</div>
                  <div className="text-slate-400 text-[11px]">Apt 402 Laureles (Solo lectura)</div>
                </div>
              </div>
              <span className="bg-cyan-900/50 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-700">
                Cliente
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
