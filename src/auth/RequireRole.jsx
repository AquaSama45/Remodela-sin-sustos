import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

/**
 * Guard de rutas por rol.
 * @param {Array<string>} rolesPermitidos - Lista de roles con permiso (ej: ['coordinador', 'gerencia'])
 */
export default function RequireRole({ rolesPermitidos, children }) {
  const { isAuthenticated, rol, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-sm">Verificando permisos...</span>
      </div>
    )
  }

  // 1. Si no ha iniciado sesión, fuera -> a /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 2. Si su rol no está en la lista de permitidos, redirigir a su vista adecuada
  if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
    if (rol === 'contratista') {
      return <Navigate to="/campo" replace />
    }
    if (rol === 'cliente') {
      return <Navigate to="/cliente" replace />
    }
    return <Navigate to="/" replace />
  }

  return children
}
