import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { KeyRound, HardHat, UserCheck, ShieldAlert, Building2 } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { loginSimulado, isAuthenticated, rol } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Si ya tiene sesión activa, redirigir según su rol
  if (isAuthenticated) {
    if (rol === 'contratista') navigate('/campo', { replace: true })
    else navigate('/', { replace: true })
  }

  const handleLoginSubmit = (e) => {
    e.preventDefault()
    loginSimulado('coordinador')
    navigate('/')
  }

  const handleQuickLogin = (usuarioKey) => {
    loginSimulado(usuarioKey)
    if (usuarioKey.startsWith('contratista')) {
      navigate('/campo')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 p-6 sm:p-8 rounded-2xl w-full max-w-lg shadow-2xl">
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
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Accesos rápidos por rol (Modo desarrollo)
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Prueba cómo cada contratista solo ve las obras que tiene asignadas:
          </p>

          <div className="space-y-2">
            {/* Coordinador */}
            <button
              onClick={() => handleQuickLogin('coordinador')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-900/80 hover:bg-slate-700 border border-slate-700/80 transition-all text-left text-xs"
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-200">Diana Cardona</div>
                  <div className="text-slate-400 text-[11px]">Coordinación General · Ve las 3 obras</div>
                </div>
              </div>
              <span className="bg-indigo-900/50 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-700">
                Coordinador
              </span>
            </button>

            {/* Subtítulo contratistas */}
            <div className="text-[11px] font-semibold text-slate-400 pt-2 pb-1 flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contratistas de Campo (3 tipos según caso ancla):</span>
            </div>

            {/* Contratista 1: Carlos */}
            <button
              onClick={() => handleQuickLogin('contratista_carlos')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-700 border border-emerald-900/40 hover:border-emerald-700 transition-all text-left text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <div>
                  <div className="font-semibold text-slate-200">Carlos Pérez (Integral - Llave en mano)</div>
                  <div className="text-emerald-400/90 text-[11px]">Obra: Apt 78 m² Laureles</div>
                </div>
              </div>
              <span className="bg-emerald-950 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-800">
                Campo
              </span>
            </button>

            {/* Contratista 2: Gustavo */}
            <button
              onClick={() => handleQuickLogin('contratista_gustavo')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-700 border border-amber-900/40 hover:border-amber-700 transition-all text-left text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                <div>
                  <div className="font-semibold text-slate-200">Gustavo Osorio (Maestro - Administración)</div>
                  <div className="text-amber-400/90 text-[11px]">Obra: Casa 120 m² Sabaneta</div>
                </div>
              </div>
              <span className="bg-amber-950 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-800">
                Campo
              </span>
            </button>

            {/* Contratista 3: Mateo */}
            <button
              onClick={() => handleQuickLogin('contratista_mateo')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-700 border border-cyan-900/40 hover:border-cyan-700 transition-all text-left text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0"></span>
                <div>
                  <div className="font-semibold text-slate-200">Mateo Henao (Taller de Acabados)</div>
                  <div className="text-cyan-400/90 text-[11px]">Obra: Apt 63 m² Belén</div>
                </div>
              </div>
              <span className="bg-cyan-950 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-800">
                Campo
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
