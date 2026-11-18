import { Link } from 'react-router-dom'

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#0f172a',
            padding: '20px'
        }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🚧</div>
            <h1 style={{ marginBottom: '8px' }}>404 - No se encontró la página (en construcción)</h1>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
                Parece que te perdiste en medio de la remodelación :o
            </p>
            <Link
                to="/"
                style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '500'
                }}
            >
                ← Volver al inicio
            </Link>
        </div>
    )
}
