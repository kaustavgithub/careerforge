import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function OidcCallback() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const params = new URLSearchParams(window.location.search)
    const access_token = params.get('access_token')
    const user_id = params.get('user_id')
    const full_name = params.get('full_name')
    const email = params.get('email')

    if (access_token && user_id) {
      login({ access_token, user_id, full_name, email })
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/login?error=sso_failed', { replace: true })
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#06070f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <div style={{
        width: '40px', height: '40px',
        border: '3px solid rgba(99,102,241,0.2)',
        borderTop: '3px solid #6366f1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Completing sign-in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
