import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const glassInput = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#f1f5f9',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [ssoEnabled, setSsoEnabled] = useState(false)
  const [localLoginEnabled, setLocalLoginEnabled] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm()

  useEffect(() => {
    api.get('/auth/oidc/available').then(r => {
      setSsoEnabled(r.data.enabled)
      setLocalLoginEnabled(r.data.local_login_enabled !== false)
    }).catch(() => {}).finally(() => setAuthChecked(true))
    if (searchParams.get('error') === 'sso_failed') {
      // surface the error after a failed SSO attempt (handled by form error below)
    }
  }, [])

  async function onSubmit(data) {
    try {
      const res = await api.post('/auth/login', data)
      login(res.data)
      navigate('/dashboard')
    } catch (err) {
      setError('root', { message: err.response?.data?.detail || 'Login failed' })
    }
  }

  function handleSso() {
    window.location.href = `${API_BASE}/auth/oidc/login`
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#06070f' }}>
      {/* Ambient orbs */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md mx-4 rounded-2xl p-8"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4 w-full">
            <img src="/logo_trans.png" alt="CareerForge" className="w-full h-auto" />
          </div>
          <p className="text-zinc-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* SSO button */}
        {ssoEnabled && (
          <>
            <button
              onClick={handleSso}
              className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2.5 transition mb-5"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 116 0v3H9z"
                  fill="currentColor" />
              </svg>
              Sign in with Single Sign-On
            </button>

            {localLoginEnabled && (
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs text-zinc-600">or</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>
            )}
          </>
        )}

        {searchParams.get('error') === 'sso_failed' && (
          <div className="rounded-xl px-4 py-3 text-sm text-red-300 mb-4"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            SSO sign-in failed. Please try again{localLoginEnabled ? ' or use email and password.' : '.'}
          </div>
        )}

        {authChecked && !ssoEnabled && !localLoginEnabled && (
          <div className="rounded-xl px-4 py-3 text-sm text-red-300 mb-4"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            No sign-in method is currently available. Please contact your administrator.
          </div>
        )}

        {localLoginEnabled && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition"
              style={glassInput}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition"
              style={glassInput}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
          </div>

          {errors.root && (
            <div className="rounded-xl px-4 py-3 text-sm text-red-300"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {errors.root.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition disabled:opacity-50 mt-2"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        )}

        {localLoginEnabled && (
          <p className="text-center text-sm text-zinc-600 mt-6">
            No account?{' '}
            <Link to="/register" className="text-indigo-400 font-semibold hover:text-indigo-300 transition">
              Create one
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
