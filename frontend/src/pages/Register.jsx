import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const glassInput = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#f1f5f9',
}

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [localLoginEnabled, setLocalLoginEnabled] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setError } = useForm()

  useEffect(() => {
    api.get('/auth/oidc/available').then(r => {
      setLocalLoginEnabled(r.data.local_login_enabled !== false)
    }).catch(() => {}).finally(() => setAuthChecked(true))
  }, [])

  async function onSubmit(data) {
    try {
      const res = await api.post('/auth/register', {
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      })
      login(res.data)
      navigate('/dashboard')
    } catch (err) {
      setError('root', { message: err.response?.data?.detail || 'Registration failed' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8" style={{ background: '#06070f' }}>
      {/* Ambient orbs */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md mx-4 rounded-2xl p-8"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}>

        <div className="text-center mb-8">
          <img src="/favicon.svg" alt="CareerForge" className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg shadow-indigo-900/50" />
          <h1 className="text-2xl font-bold text-white">CareerForge</h1>
          <p className="text-zinc-500 text-sm mt-1">Create your free account</p>
        </div>

        {authChecked && !localLoginEnabled && (
          <div className="rounded-xl px-4 py-3 text-sm text-red-300 mb-4"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            Local registration is disabled. Please sign in with SSO from the{' '}
            <Link to="/login" className="font-semibold underline">login page</Link>.
          </div>
        )}

        {localLoginEnabled && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Full Name</label>
            <input
              {...register('full_name', { required: 'Full name is required' })}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition"
              style={glassInput}
              placeholder="Jane Smith"
            />
            {errors.full_name && <p className="text-red-400 text-xs mt-1.5">{errors.full_name.message}</p>}
          </div>
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
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition"
              style={glassInput}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Confirm Password</label>
            <input
              type="password"
              {...register('confirm', {
                required: 'Please confirm your password',
                validate: (v) => v === watch('password') || 'Passwords do not match',
              })}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition"
              style={glassInput}
              placeholder="••••••••"
            />
            {errors.confirm && <p className="text-red-400 text-xs mt-1.5">{errors.confirm.message}</p>}
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
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        )}

        <p className="text-center text-sm text-zinc-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
