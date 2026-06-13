import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-50 px-4 py-3"
      style={{
        background: 'rgba(6, 7, 15, 0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-base font-bold text-white tracking-tight">CareerForge</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/dashboard"
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition">
            Dashboard
          </Link>
          <Link to="/profile"
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition">
            Profile
          </Link>
          <Link to="/jobs"
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition">
            Jobs
          </Link>

          <div className="ml-3 pl-3 border-l border-white/10 flex items-center gap-3">
            <span className="text-xs text-zinc-600 hidden sm:block">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white transition"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
