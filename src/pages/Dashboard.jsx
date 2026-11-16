import { Link } from 'react-router-dom'

export default function Dashboard() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ color: '#0f172a', marginBottom: '8px' }}>
        Dashboard (en construcción :p)
      </h1>
      <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.5' }}>
        ¡Holi! Bienvenido al panel principal de <strong>Remodela sin Sustos</strong>.
      </p>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        margin: '12px 0'
      }}>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0, flex: 1 }}>
          Esta es la mini beta navegable para probar las rutas y componentes base c:
        </p>
        <img
          src="https://i.pinimg.com/170x/2d/98/58/2d98584cfb4113bc3d2428dd07e281fd.jpg"
          alt="Avatar o Logo"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '12px',
            objectFit: 'cover',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
          }}
        />
      </div>

      <div style={{
        marginTop: '24px',
        background: '#ffffff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ marginTop: 0, color: '#1e293b' }}>Accesos rápidos</h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
          Puedes probar la navegación al login desde aquí o desde el menú lateral:
        </p>
        <Link
          to="/login"
          style={{
            display: 'inline-block',
            background: '#2563eb',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          Ir a Iniciar Sesión
        </Link>
      </div>
    </div>
  )
}
