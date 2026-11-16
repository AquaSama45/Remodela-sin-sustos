import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Campo from './pages/Campo'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Fuera del layout de escritorio: pantalla completa ...*/}
      <Route path="/login" element={<Login />} />
      <Route path="/campo" element={<Campo />} />
      <Route path="/campo/*" element={<Campo />} />

      {/* Dentro del layout principal (Coordinación / Escritorio) */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}