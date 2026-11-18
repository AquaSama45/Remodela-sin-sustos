import { createContext, useContext, useState } from 'react'

// Usuarios de prueba preconfigurados basados en el caso ancla (Obra Clara S.A.S.)
export const USUARIOS_MOCK = {
  coordinador: {
    id: 'usr-coord-01',
    email: 'diana.cardona@obraclara.com',
    nombre: 'Diana Cardona',
    cargo: 'Coordinadora General',
    rol: 'coordinador',
  },
  // Contratista 1: Laureles
  contratista_carlos: {
    id: 'usr-contra-carlos',
    email: 'carlos.integral@obrasmedellin.com',
    nombre: 'Carlos Pérez',
    cargo: 'Contratista Integral (Llave en mano)',
    rol: 'contratista',
    proyectosAsignados: ['proy-laureles'],
  },
  // Contratista 2: Sabaneta
  contratista_gustavo: {
    id: 'usr-contra-gustavo',
    email: 'gustavo.maestro@obras.com',
    nombre: 'Gustavo Osorio',
    cargo: 'Maestro de Obra (Por administración)',
    rol: 'contratista',
    proyectosAsignados: ['proy-sabaneta'],
  },
  // Contratista 3: Belén
  contratista_mateo: {
    id: 'usr-contra-mateo',
    email: 'mateo.taller@acabadosbelen.com',
    nombre: 'Mateo Henao',
    cargo: 'Taller de Acabados',
    rol: 'contratista',
    proyectosAsignados: ['proy-belen'],
  },
  cliente: {
    id: 'usr-cli-01',
    email: 'familia.gomez@gmail.com',
    nombre: 'Familia Gómez',
    cargo: 'Cliente Propietario (Apt Laureles)',
    rol: 'cliente',
    proyectosAsignados: ['proy-laureles'],
  },
  gerencia: {
    id: 'usr-ger-01',
    email: 'gerencia@obraclara.com',
    nombre: 'Gerencia General',
    cargo: 'Dirección de Operaciones',
    rol: 'gerencia',
  },
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const sesionGuardada = localStorage.getItem('sesion_activa')
    return sesionGuardada ? JSON.parse(sesionGuardada) : null
  })
  const [loading] = useState(false)

  const loginSimulado = (usuarioKey) => {
    const usuarioSeleccionado = USUARIOS_MOCK[usuarioKey]
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
        proyectosAsignados: user?.proyectosAsignados || [],
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
