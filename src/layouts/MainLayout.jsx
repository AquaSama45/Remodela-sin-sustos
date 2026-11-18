import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { LogOut, LayoutDashboard, HardHat, Building2, User } from 'lucide-react'
import './MainLayout.css'

export default function MainLayout() {
  const { user, rol, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar flex flex-col justify-between">
        <div>
          <div className="logo flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <span>Remodela sin Sustos</span>
          </div>

          <nav className="mt-4">
            <NavLink to="/" end className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span>Portafolio de Obras</span>
            </NavLink>

            {/* Acceso a campo para coordinación/supervisión */}
            <NavLink to="/campo" className="flex items-center gap-2">
              <HardHat className="w-4 h-4 text-emerald-400" />
              <span>Simular Vista de Campo</span>
            </NavLink>
          </nav>
        </div>

        {/* Tarjeta de usuario logueado y botón de logout */}
        <div className="pt-4 border-t border-slate-700/60 mt-auto">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-900/80 border border-indigo-700 flex items-center justify-center text-indigo-300 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.nombre || 'Usuario'}</div>
              <div className="text-[10px] text-indigo-400 uppercase font-mono">{rol}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors border border-rose-900/40"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
