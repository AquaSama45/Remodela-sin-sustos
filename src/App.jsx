import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import RequireRole from './auth/RequireRole'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProyectoDetalle from './pages/ProyectoDetalle'
import Campo from './pages/Campo'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Ruta protegida: Vista de Campo (Contratistas y Coordinación) */}
        <Route
          path="/campo"
          element={
            <RequireRole rolesPermitidos={['contratista', 'coordinador']}>
              <Campo />
            </RequireRole>
          }
        />
        <Route
          path="/campo/*"
          element={
            <RequireRole rolesPermitidos={['contratista', 'coordinador']}>
              <Campo />
            </RequireRole>
          }
        />

        {/* Rutas protegidas: Escritorio / Coordinación y Gerencia */}
        <Route
          element={
            <RequireRole rolesPermitidos={['coordinador', 'auxiliar', 'gerencia']}>
              <MainLayout />
            </RequireRole>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
