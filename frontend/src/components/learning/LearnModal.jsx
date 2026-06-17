import { useState } from 'react'
import api from '../../api/client'

const TYPE_ICON = { course: '🎓', book: '📚', docs: '📄', video: '▶️', practice: '🛠' }

export default function LearnModal({ skill, jobs, aiConfigured, onClose }) {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const { data } = await api.post('/learning/plan', { skill, jobs })
      setPlan(data)
    } finally {
      setLoading(false)
    }
  }

  async function copyPrompt() {
    const { data } = await api.post('/learning/copy-prompt', { skill, jobs })
    navigator.clipboard.writeText(data.prompt)
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2500)
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
        width: '100%', maxWidth: '720px',
        maxHeight: '88vh', overflowY: 'auto',
        padding: '2rem',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.15rem', margin: 0 }}>
              Learn <span style={{ color: '#818cf8' }}>{skill}</span>
            </h2>
            <p style={{ color: 'var(--text-faint)', fontSize: '0.78rem', marginTop: '0.25rem' }}>
              Identified in {jobs.length} job{jobs.length !== 1 ? 's' : ''} from your search results
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--btn-glass-bg)', border: '1px solid var(--btn-glass-border)',
            color: 'var(--text-secondary)', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer',
          }}>✕</button>
        </div>

        {/* Action buttons */}
        {!plan && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={generate}
              disabled={loading || !aiConfigured}
              title={!aiConfigured ? 'Add an API key in Settings to enable AI learning plans' : undefined}
              style={{
                background: loading ? 'rgba(99,102,241,0.2)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: loading ? 'var(--text-faint)' : '#fff',
                border: 'none', borderRadius: '8px',
                padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 600,
                cursor: (loading || !aiConfigured) ? 'not-allowed' : 'pointer',
                opacity: aiConfigured ? 1 : 0.5,
              }}
            >
              {loading ? 'Generating plan…' : '✦ Generate Learning Plan with AI'}
            </button>
            <button onClick={copyPrompt} style={{
              background: promptCopied ? 'rgba(34,197,94,0.12)' : 'var(--btn-glass-bg)',
              color: promptCopied ? '#4ade80' : 'var(--text-secondary)',
              border: `1px solid ${promptCopied ? 'rgba(34,197,94,0.3)' : 'var(--btn-glass-border)'}`,
              borderRadius: '8px', padding: '0.6rem 1.25rem',
              fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            }}>
              {promptCopied ? '✓ Prompt copied!' : '📋 Copy prompt for ChatGPT / Claude'}
            </button>
          </div>
        )}

        {/* Plan */}
        {plan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Why */}
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: '0.75rem', padding: '1rem' }}>
              <p style={{ color: '#a5b4fc', fontSize: '0.82rem', lineHeight: 1.7, margin: 0 }}>{plan.why}</p>
            </div>

            {/* Roadmap */}
            <div>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>Learning Roadmap</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(plan.roadmap || []).map((phase, i) => (
                  <div key={i} style={{ background: 'var(--bg-card-dim)', border: '1px solid var(--border-dim)', borderRadius: '0.625rem', padding: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: '999px', padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                        {phase.phase}
                      </span>
                      <span style={{ color: 'var(--text-faint)', fontSize: '0.72rem' }}>{phase.duration}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.4rem' }}>
                      {(phase.topics || []).map((t, j) => (
                        <span key={j} style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem' }}>{t}</span>
                      ))}
                    </div>
                    {phase.milestone && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>✓ {phase.milestone}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Resources */}
            {(plan.resources || []).length > 0 && (
              <div>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>Resources</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {plan.resources.map((r, i) => (
                    <div key={i} style={{ background: 'var(--bg-card-dim)', border: '1px solid var(--border-faint)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{TYPE_ICON[r.type] || '📌'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {r.url ? (
                            <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', fontWeight: 600, fontSize: '0.82rem' }}>{r.name}</a>
                          ) : (
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.82rem' }}>{r.name}</span>
                          )}
                          {r.free && <span style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', borderRadius: '999px', padding: '0 6px', fontSize: '0.65rem', fontWeight: 700 }}>FREE</span>}
                        </div>
                        {r.note && <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: '2px 0 0' }}>{r.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {(plan.projects || []).length > 0 && (
              <div>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>Practice Projects</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {plan.projects.map((p, i) => (
                    <div key={i} style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '0.5rem', padding: '0.5rem 0.875rem', color: '#c4b5fd', fontSize: '0.8rem', display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: '#8b5cf6', fontWeight: 700 }}>✦</span>{p}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connection */}
            {plan.connection && (
              <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '0.75rem', padding: '0.875rem' }}>
                <p style={{ color: '#6ee7b7', fontSize: '0.78rem', lineHeight: 1.65, margin: 0 }}>
                  <strong style={{ color: '#34d399' }}>How this connects to you: </strong>{plan.connection}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={copyPrompt} style={{
                background: promptCopied ? 'rgba(34,197,94,0.12)' : 'var(--btn-glass-bg)',
                color: promptCopied ? '#4ade80' : 'var(--text-secondary)',
                border: `1px solid ${promptCopied ? 'rgba(34,197,94,0.3)' : 'var(--btn-glass-border)'}`,
                borderRadius: '8px', padding: '0.5rem 1rem',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              }}>
                {promptCopied ? '✓ Copied!' : '📋 Copy prompt for external AI'}
              </button>
              <button onClick={() => setPlan(null)} style={{
                background: 'none', border: '1px solid var(--btn-glass-border)',
                color: 'var(--text-muted)', borderRadius: '8px', padding: '0.5rem 1rem',
                fontSize: '0.8rem', cursor: 'pointer',
              }}>Regenerate</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
