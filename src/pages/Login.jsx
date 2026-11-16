import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    // Mini beta simulada 
    alert(`¡Sesión iniciada con éxito! Bienvenido ${email || 'usuario'} (Modo beta)`)
    navigate('/')
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: '#1e293b',
        padding: '32px',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
        <h2 style={{ marginTop: 0, marginBottom: '6px' }}>Login (en construcción)</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
          Remodela sin Sustos ~ Mini Beta
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: '#cbd5e1' }}>
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="tu-correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#fff',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: '#cbd5e1' }}>
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#fff',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: '10px',
              padding: '12px',
              borderRadius: '6px',
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            Entrar
          </button>
        </form>

        <div style={{ marginTop: '24px' }}>
          <Link to="/" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '14px' }}>
            ← Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
