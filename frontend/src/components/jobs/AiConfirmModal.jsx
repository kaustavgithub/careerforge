import { useState } from 'react'

export default function AiConfirmModal({ title, description, confirmLabel = 'Continue', onConfirm, onClose }) {
  const [phase, setPhase] = useState('confirm') // confirm | loading | error
  const [errorMsg, setErrorMsg] = useState('')

  async function handleConfirm() {
    setPhase('loading')
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || 'Something went wrong. Please try again.')
      setPhase('error')
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
      onClick={e => { e.stopPropagation(); if (phase !== 'loading') onClose() }}
    >
      <div style={{
        background: 'var(--modal-bg)',
        border: '1px solid var(--modal-border)',
        borderRadius: '1.25rem',
        width: '100%', maxWidth: '380px',
        padding: '1.75rem',
        textAlign: 'center',
      }} onClick={e => e.stopPropagation()}>

        {phase === 'loading' ? (
          <div style={{ padding: '0.5rem 0' }}>
            <div style={{
              width: '38px', height: '38px', margin: '0 auto 1rem',
              border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#8b5cf6',
              borderRadius: '50%', animation: 'ai-modal-spin 0.8s linear infinite',
            }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, margin: 0 }}>
              Working with AI…
            </p>
            <p style={{ color: 'var(--text-faint)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
              This can take a few seconds
            </p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>✦</div>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.05rem', margin: '0 0 0.5rem' }}>
              {title}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
              {description}
            </p>
            {phase === 'error' && (
              <p style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem' }}>{errorMsg}</p>
            )}
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
              <button onClick={onClose} style={{
                background: 'var(--btn-glass-bg)', border: '1px solid var(--btn-glass-border)',
                color: 'var(--text-secondary)', borderRadius: '0.625rem', padding: '0.55rem 1.25rem',
                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button onClick={handleConfirm} style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
                color: '#fff', borderRadius: '0.625rem', padding: '0.55rem 1.25rem',
                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              }}>
                {phase === 'error' ? 'Retry' : confirmLabel}
              </button>
            </div>
          </>
        )}
      </div>
      <style>{'@keyframes ai-modal-spin { to { transform: rotate(360deg) } }'}</style>
    </div>
  )
}
