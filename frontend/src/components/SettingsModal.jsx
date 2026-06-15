import { useEffect, useRef, useState } from 'react'
import api from '../api/client'

export default function SettingsModal({ onClose }) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [useLocalAi, setUseLocalAi] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const overlayRef = useRef(null)

  useEffect(() => {
    api.get('/settings').then(r => {
      setApiKey(r.data.anthropic_api_key || '')
      setUseLocalAi(r.data.use_local_ai !== false)
    }).finally(() => setLoading(false))
  }, [])

  function handleOverlay(e) {
    if (e.target === overlayRef.current) onClose()
  }

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      await api.put('/settings', {
        anthropic_api_key: apiKey.trim() || null,
        use_local_ai: useLocalAi,
      })
      setMsg({ ok: true, text: 'Settings saved.' })
      setTimeout(onClose, 800)
    } catch {
      setMsg({ ok: false, text: 'Failed to save settings.' })
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.85rem',
    borderRadius: '0.6rem',
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    color: 'var(--input-color)',
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: 'monospace',
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '480px',
        background: 'var(--modal-bg)',
        border: '1px solid var(--modal-border)',
        borderRadius: '1.25rem',
        padding: '1.75rem',
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '1.25rem', lineHeight: 1,
              padding: '0.25rem 0.4rem', borderRadius: '0.4rem',
            }}
          >✕</button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-faint)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
            Loading…
          </div>
        ) : (
          <>
            {/* API Key Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Anthropic API Key
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-faint)', margin: '0 0 0.6rem' }}>
                Your personal key is used for all AI features (cover letter, learning plan, tailored CV).
                Falls back to the server default if left blank.
              </p>
              <div style={{ position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-ant-api03-…"
                  style={{ ...inputStyle, paddingRight: '3rem' }}
                />
                <button
                  onClick={() => setShowKey(v => !v)}
                  style={{
                    position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0.2rem 0.4rem',
                  }}
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* AI Mode Section */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{
                display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Intelligence Mode
              </label>

              {[
                {
                  value: true,
                  title: 'Local where possible',
                  desc: 'Skill gap analysis and job ranking use fast local algorithms (free, no API calls). Only cover letters, tailored CVs, and learning plans use the API.',
                },
                {
                  value: false,
                  title: 'Use AI everywhere',
                  desc: 'Skill gap analysis uses Claude Haiku for smarter results. All features use your API key — requires a valid key.',
                },
              ].map(opt => (
                <div
                  key={String(opt.value)}
                  onClick={() => setUseLocalAi(opt.value)}
                  style={{
                    cursor: 'pointer',
                    border: `1px solid ${useLocalAi === opt.value ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
                    background: useLocalAi === opt.value ? 'rgba(99,102,241,0.08)' : 'var(--bg-card-dim)',
                    borderRadius: '0.75rem',
                    padding: '0.85rem 1rem',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                    border: `2px solid ${useLocalAi === opt.value ? '#818cf8' : 'var(--border)'}`,
                    background: useLocalAi === opt.value ? '#818cf8' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {useLocalAi === opt.value && (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {opt.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)', lineHeight: 1.5 }}>
                      {opt.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            {msg && (
              <div style={{
                padding: '0.6rem 0.85rem', borderRadius: '0.6rem', fontSize: '0.82rem',
                marginBottom: '1rem',
                background: msg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${msg.ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                color: msg.ok ? '#4ade80' : '#f87171',
              }}>
                {msg.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '0.55rem 1.1rem', borderRadius: '0.6rem', fontSize: '0.875rem',
                  background: 'var(--btn-glass-bg)', border: '1px solid var(--btn-glass-border)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                style={{
                  padding: '0.55rem 1.25rem', borderRadius: '0.6rem', fontSize: '0.875rem',
                  background: saving ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.85)',
                  border: '1px solid rgba(99,102,241,0.5)',
                  color: '#fff', cursor: saving ? 'default' : 'pointer', fontWeight: 600,
                }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
