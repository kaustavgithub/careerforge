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
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm()

  useEffect(() => {
    api.get('/auth/oidc/available').then(r => setSsoEnabled(r.data.enabled)).catch(() => {})
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-900/50">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">CareerForge</h1>
          <p className="text-zinc-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* SSO button */}
        {ssoEnabled && (
          <>
            <button
              onClick={handleSso}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition mb-5"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#e2e8f0',
              }}
            >
              {/* Authentik logo mark */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#fd4b2d" strokeWidth="2"/>
                <path d="M8 12h8M12 8v8" stroke="#fd4b2d" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Continue with Authentik
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-xs text-zinc-600">or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>
          </>
        )}

        {searchParams.get('error') === 'sso_failed' && (
          <div className="rounded-xl px-4 py-3 text-sm text-red-300 mb-4"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            SSO sign-in failed. Please try again or use email and password.
          </div>
        )}

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

        <p className="text-center text-sm text-zinc-600 mt-6">
          No account?{' '}
          <Link to="/register" className="text-indigo-400 font-semibold hover:text-indigo-300 transition">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
