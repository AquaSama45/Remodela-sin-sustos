import { createContext, useContext, useState, useEffect } from 'react'

// Usuarios de prueba preconfigurados para desarrollo
export const USUARIOS_MOCK = {
  coordinador: {
    id: 'usr-coord-01',
    email: 'diana.cardona@obraclara.com',
    nombre: 'Diana Cardona (Coordinadora)',
    rol: 'coordinador',
  },
  contratista: {
    id: 'usr-contra-01',
    email: 'carlos.obras@tallermedellin.com',
    nombre: 'Carlos Pérez (Contratista Campo)',
    rol: 'contratista',
  },
  cliente: {
    id: 'usr-cli-01',
    email: 'familia.gomez@gmail.com',
    nombre: 'Familia Gómez (Cliente Laureles)',
    rol: 'cliente',
  },
  gerencia: {
    id: 'usr-ger-01',
    email: 'gerencia@obraclara.com',
    nombre: 'Gerencia General',
    rol: 'gerencia',
  },
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Inicializamos leyendo de localStorage para no perder la sesión al recargar la página (F5)
  const [user, setUser] = useState(() => {
    const sesionGuardada = localStorage.getItem('sesion_activa')
    return sesionGuardada ? JSON.parse(sesionGuardada) : null
  })
  const [loading, setLoading] = useState(false)

  // Iniciar sesión con rol simulado o con credenciales
  const loginSimulado = (rolKey) => {
    const usuarioSeleccionado = USUARIOS_MOCK[rolKey]
    if (usuarioSeleccionado) {
      setUser(usuarioSeleccionado)
      localStorage.setItem('sesion_activa', JSON.stringify(usuarioSeleccionado))
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('sesion_activa')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        rol: user?.rol || null,
        isAuthenticated: !!user,
        loading,
        loginSimulado,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
