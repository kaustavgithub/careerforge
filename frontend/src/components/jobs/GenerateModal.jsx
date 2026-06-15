import { useState } from 'react'

export default function GenerateModal({ job, onClose }) {
  const [copied, setCopied] = useState(false)
  const tweaks = (() => {
    try { return JSON.parse(job.cv_tweaks || '[]') } catch { return [] }
  })()

  function copyLetter() {
    navigator.clipboard.writeText(job.cover_letter || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--modal-bg)',
        border: '1px solid var(--modal-border)',
        borderRadius: '1.25rem',
        width: '100%', maxWidth: '680px',
        maxHeight: '85vh', overflowY: 'auto',
        padding: '2rem',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>Cover Letter</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              {job.title}{job.company ? ` · ${job.company}` : ''}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--btn-glass-bg)', border: '1px solid var(--btn-glass-border)',
            color: 'var(--text-secondary)', borderRadius: '8px', padding: '4px 10px',
            cursor: 'pointer', fontSize: '1rem',
          }}>✕</button>
        </div>

        <div style={{
          background: 'var(--bg-card-dim)',
          border: '1px solid var(--border-dim)',
          borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.25rem',
        }}>
          <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
            {job.cover_letter}
          </p>
        </div>

        <button onClick={copyLetter} style={{
          background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
          color: copied ? '#4ade80' : '#818cf8',
          border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.3)'}`,
          borderRadius: '8px', padding: '0.5rem 1.25rem',
          fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
          marginBottom: '1.5rem', transition: 'all 0.2s',
        }}>
          {copied ? '✓ Copied!' : 'Copy Letter'}
        </button>

        {tweaks.length > 0 && (
          <>
            <h3 style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              CV Tweaks
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tweaks.map((tweak, i) => (
                <li key={i} style={{
                  background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)',
                  borderRadius: '0.625rem', padding: '0.625rem 0.875rem',
                  color: '#c4b5fd', fontSize: '0.82rem',
                  display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                }}>
                  <span style={{ color: '#8b5cf6', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✦</span>
                  {tweak}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
