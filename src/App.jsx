import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Fuera del layout: sin menú */}
      <Route path="/login" element={<Login />} />

      {/* Dentro del layout: con menú */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}