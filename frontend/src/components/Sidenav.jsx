import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

// ── Icons ──────────────────────────────────────────────────────────────────

function DashboardIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function JobsIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9}
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function LearningIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" strokeWidth={1.9} />
      <path strokeWidth={1.9} strokeLinecap="round"
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth={1.9} strokeLinecap="round"
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// ── Nav items config ───────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { to: '/profile',   label: 'Profile',   Icon: ProfileIcon },
  { to: '/jobs',      label: 'Jobs',      Icon: JobsIcon },
  { to: '/learning',  label: 'Learning',  Icon: LearningIcon },
]

// ── Shared styles ──────────────────────────────────────────────────────────

function navItemStyle(active) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.7rem',
    padding: '0.55rem 0.875rem',
    margin: '0.1rem 0.5rem',
    borderRadius: '0.6rem',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    background: active ? 'var(--sidenav-active-bg)' : 'transparent',
    borderLeft: `2.5px solid ${active ? 'var(--sidenav-active-bar)' : 'transparent'}`,
    transition: 'all 0.15s',
  }
}

function navIconStyle(active) {
  return {
    color: active ? '#818cf8' : 'currentColor',
    transition: 'color 0.15s',
  }
}

// ── Main component ─────────────────────────────────────────────────────────

export default function Sidenav() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerRef = useRef(null)

  function isActive(path) {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  function handleLogout() {
    setDrawerOpen(false)
    logout()
    navigate('/login')
  }

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  // Close drawer on outside click
  useEffect(() => {
    if (!drawerOpen) return
    function handleClick(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [drawerOpen])

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const userInitial = (user?.full_name || user?.email || 'U')[0].toUpperCase()

  // ── Nav links (shared between desktop sidebar and mobile drawer) ───────

  function NavLinks({ onClose }) {
    return (
      <nav style={{ flex: 1, paddingTop: '0.5rem' }}>
        {NAV_ITEMS.map(({ to, label, Icon }) => {
          const active = isActive(to)
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              style={navItemStyle(active)}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.color = 'var(--text-primary)'
                  e.currentTarget.style.background = 'var(--bg-card)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span style={navIconStyle(active)}>
                <Icon />
              </span>
              {label}
            </Link>
          )
        })}
      </nav>
    )
  }

  // ── Bottom user section ──────────────────────────────────────────────

  function BottomSection({ onClose }) {
    return (
      <div style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 0.5rem 0.875rem' }}>
        {/* Settings */}
        <Link
          to="/settings"
          onClick={onClose}
          style={{
            ...navItemStyle(isActive('/settings')),
            marginBottom: '0.1rem',
          }}
          onMouseEnter={e => {
            if (!isActive('/settings')) {
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.background = 'var(--bg-card)'
            }
          }}
          onMouseLeave={e => {
            if (!isActive('/settings')) {
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          <span style={navIconStyle(isActive('/settings'))}><SettingsIcon /></span>
          Settings
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.7rem',
            width: '100%', padding: '0.55rem 0.875rem',
            margin: '0.1rem 0',
            borderRadius: '0.6rem',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.875rem', fontWeight: 400,
            color: 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-card)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none' }}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border-faint)', margin: '0.5rem 0.375rem' }} />

        {/* User row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.4rem 0.875rem',
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 700, color: '#fff',
          }}>
            {userInitial}
          </div>
          <span style={{
            flex: 1, fontSize: '0.78rem', color: 'var(--text-muted)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-faint)', padding: '4px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'none' }}
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className="sidenav-desktop"
        style={{
          position: 'fixed', left: 0, top: 0, bottom: 0,
          width: 'var(--sidenav-width)',
          flexDirection: 'column',
          background: 'var(--sidenav-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid var(--border)',
          zIndex: 50,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '1.25rem 1rem 0.75rem' }}>
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <img src="/logo_trans.png" alt="CareerForge" style={{ height: '30px', width: 'auto' }} />
          </Link>
        </div>

        <NavLinks onClose={() => {}} />
        <BottomSection onClose={() => {}} />
      </aside>

      {/* ── Mobile top header ────────────────────────────────────────────── */}
      <header
        className="sidenav-mob-header"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: '52px', zIndex: 50,
          alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1rem',
          background: 'var(--sidenav-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link to="/dashboard">
          <img src="/logo_trans.png" alt="CareerForge" style={{ height: '26px', width: 'auto' }} />
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            background: 'var(--btn-glass-bg)', border: '1px solid var(--btn-glass-border)',
            color: 'var(--text-secondary)', borderRadius: '8px',
            padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}
        >
          <HamburgerIcon />
        </button>
      </header>

      {/* ── Mobile drawer overlay + panel ───────────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            ref={drawerRef}
            className="sidenav-drawer-animate"
            style={{
              position: 'fixed', left: 0, top: 0, bottom: 0,
              width: '260px', zIndex: 70,
              display: 'flex', flexDirection: 'column',
              background: 'var(--sidenav-bg)',
              borderRight: '1px solid var(--border)',
              overflowY: 'auto',
            }}
          >
            {/* Drawer header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1rem 0.5rem',
            }}>
              <img src="/logo_trans.png" alt="CareerForge" style={{ height: '28px', width: 'auto' }} />
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: '4px', borderRadius: '6px',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <CloseIcon />
              </button>
            </div>

            <NavLinks onClose={() => setDrawerOpen(false)} />
            <BottomSection onClose={() => setDrawerOpen(false)} />
          </aside>
        </>
      )}

      {/* ── Mobile bottom navigation ─────────────────────────────────────── */}
      <nav
        className="sidenav-mob-nav"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '62px', zIndex: 50,
          alignItems: 'center', justifyContent: 'space-around',
          background: 'var(--sidenav-bg)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {NAV_ITEMS.map(({ to, label, Icon }) => {
          const active = isActive(to)
          return (
            <Link
              key={to}
              to={to}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                padding: '6px 12px', borderRadius: '10px',
                textDecoration: 'none',
                color: active ? '#818cf8' : 'var(--text-faint)',
                background: active ? 'var(--sidenav-active-bg)' : 'transparent',
                transition: 'all 0.15s',
                minWidth: '56px',
              }}
            >
              <Icon />
              <span style={{ fontSize: '0.62rem', fontWeight: active ? 600 : 400, letterSpacing: '0.01em' }}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
