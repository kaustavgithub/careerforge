import { useState } from 'react'
import api from '../../api/client'

const STATUS_OPTIONS = [
  { value: 'saved',    label: 'Save',     activeColor: '#fde047', activeBg: 'rgba(234,179,8,0.2)',   activeBorder: 'rgba(234,179,8,0.5)'   },
  { value: 'applied',  label: 'Applied',  activeColor: '#4ade80', activeBg: 'rgba(34,197,94,0.2)',  activeBorder: 'rgba(34,197,94,0.5)'  },
  { value: 'rejected', label: 'Rejected', activeColor: '#f87171', activeBg: 'rgba(239,68,68,0.2)',  activeBorder: 'rgba(239,68,68,0.5)'  },
]

function ScoreBadge({ score }) {
  if (score == null) return null
  const color = score >= 80 ? '#4ade80' : score >= 60 ? '#fde047' : '#f87171'
  const bg = score >= 80 ? 'rgba(34,197,94,0.12)' : score >= 60 ? 'rgba(234,179,8,0.12)' : 'rgba(239,68,68,0.12)'
  return (
    <div style={{
      background: bg, border: `1px solid ${color}30`, borderRadius: '999px',
      padding: '2px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px',
    }}>
      <span style={{ color, fontWeight: 700, fontSize: '0.85rem' }}>{score}</span>
      <span style={{ color: color + 'aa', fontSize: '0.7rem' }}>/ 100</span>
    </div>
  )
}

export default function SearchResultCard({ job, onSaved }) {
  const [expanded, setExpanded] = useState(false)
  const [savedId, setSavedId] = useState(null)
  const [status, setStatus] = useState(null)   // null = not yet saved
  const [busy, setBusy] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translatedDesc, setTranslatedDesc] = useState(null)
  const [detectedLang, setDetectedLang] = useState(null)
  const [error, setError] = useState(null)

  async function handleStatus(e, next) {
    e.stopPropagation()
    if (busy || status === next) return
    setBusy(true)
    setError(null)
    try {
      if (!savedId) {
        // First interaction — save the job then set status
        const { data } = await api.post('/jobs/save', job)
        setSavedId(data.id)
        onSaved?.(data)
        if (next !== 'saved') {
          await api.patch(`/jobs/${data.id}/status`, { status: next })
        }
      } else {
        await api.patch(`/jobs/${savedId}/status`, { status: next })
      }
      setStatus(next)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed.')
    } finally {
      setBusy(false)
    }
  }

  async function handleTranslate(e) {
    e.stopPropagation()
    if (translatedDesc) { setTranslatedDesc(null); return }
    setTranslating(true)
    try {
      const { data } = await api.post('/jobs/translate-text', { text: job.description || '' })
      if (data.already_english) setDetectedLang('en')
      else { setTranslatedDesc(data.translated); setDetectedLang(data.detected_language) }
    } catch { } finally { setTranslating(false) }
  }

  function handleApply(e) {
    e.stopPropagation()
    const url = job.apply_url || (job.apply_email ? `mailto:${job.apply_email}` : null)
    if (url) window.open(url, '_blank', 'noopener')
  }

  const activeOpt = STATUS_OPTIONS.find(o => o.value === status)
  const cardBorder = activeOpt ? activeOpt.activeBorder : 'var(--border)'

  return (
    <div
      onClick={() => setExpanded(v => !v)}
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${cardBorder}`,
        borderRadius: '1rem', padding: '1.25rem',
        cursor: 'pointer', transition: 'border-color 0.2s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>{job.title}</h3>
            <ScoreBadge score={job.match_score} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            {job.company && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{job.company}</span>}
            {job.location && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>📍 {job.location}</span>}
          </div>
          {job.match_summary && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.4rem', lineHeight: 1.4 }}>
              {job.match_summary}
            </p>
          )}
        </div>

        {/* Status button group — always visible */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex', flexShrink: 0,
            background: 'var(--input-bg)', border: '1px solid var(--input-border)',
            borderRadius: '7px', padding: '2px', gap: '2px',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {STATUS_OPTIONS.map(opt => {
            const isActive = status === opt.value
            return (
              <button
                key={opt.value}
                onClick={e => handleStatus(e, opt.value)}
                disabled={busy}
                style={{
                  background: isActive ? opt.activeBg : 'transparent',
                  color: isActive ? opt.activeColor : 'var(--text-faint)',
                  border: isActive ? `1px solid ${opt.activeBorder}` : '1px solid transparent',
                  borderRadius: '5px', padding: '3px 9px',
                  fontSize: '0.72rem', fontWeight: 600,
                  cursor: busy ? 'default' : 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
        {error
          ? <p style={{ color: '#f87171', fontSize: '0.72rem', margin: 0 }}>{error}</p>
          : <span />
        }
        <span style={{ color: 'var(--text-faint)', fontSize: '0.7rem' }}>
          {expanded ? '▲ collapse' : '▼ expand'}
        </span>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ marginTop: '0.75rem' }} onClick={e => e.stopPropagation()}>
          {job.description && (
            <div style={{
              background: 'var(--bg-card-dim)', border: '1px solid var(--border-faint)',
              borderRadius: '0.5rem', padding: '0.75rem',
              maxHeight: '160px', overflowY: 'auto', marginBottom: '0.5rem',
            }}>
              {translatedDesc && (
                <p style={{ color: 'var(--text-faint)', fontSize: '0.7rem', marginBottom: '0.4rem' }}>
                  🌐 Translated from <strong>{detectedLang?.toUpperCase()}</strong>
                </p>
              )}
              {detectedLang === 'en' && !translatedDesc && (
                <p style={{ color: 'var(--text-faint)', fontSize: '0.7rem', marginBottom: '0.4rem' }}>✓ Already in English</p>
              )}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                {(translatedDesc || job.description).slice(0, 1200)}
                {(translatedDesc || job.description).length > 1200 ? '…' : ''}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {job.description && (
              <button
                onClick={handleTranslate}
                disabled={translating}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: translating ? 'var(--text-faint)' : '#6366f1',
                  fontSize: '0.75rem', cursor: translating ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline', textUnderlineOffset: '2px',
                }}
              >
                {translating ? 'Translating…' : translatedDesc ? 'Show original' : '🌐 Translate to English'}
              </button>
            )}
            {(job.apply_url || job.apply_email) && (
              <button onClick={handleApply} style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', border: 'none', borderRadius: '7px',
                padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              }}>
                Apply →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
