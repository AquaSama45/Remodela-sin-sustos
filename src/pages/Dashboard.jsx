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

      <div className="mt-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Accesos rápidos de prueba</h3>
        <p className="text-slate-600 text-sm mb-4">
          Prueba las pantallas desarrolladas hasta el momento:
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/campo"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <span>👷‍♂️</span>
            <span>Abrir Vista de Campo (/campo)</span>
          </Link>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <span>🔑</span>
            <span>Ir a Iniciar Sesión (/login)</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
