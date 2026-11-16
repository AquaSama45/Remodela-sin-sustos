import { NavLink, Outlet } from 'react-router-dom'
import './MainLayout.css'

export default function MainLayout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">Remodela sin Sustos</div>
        <nav>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/login">
            Iniciar Sesión
          </NavLink>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
