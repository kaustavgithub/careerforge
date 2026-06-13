import { useState } from 'react'

const STATUS_COLORS = {
  new: 'rgba(99,102,241,0.15)',
  saved: 'rgba(234,179,8,0.15)',
  applied: 'rgba(34,197,94,0.15)',
  rejected: 'rgba(239,68,68,0.15)',
}
const STATUS_TEXT = {
  new: '#818cf8',
  saved: '#fde047',
  applied: '#4ade80',
  rejected: '#f87171',
}

function ScoreBadge({ score }) {
  if (score == null) return null
  const color = score >= 80 ? '#4ade80' : score >= 60 ? '#fde047' : '#f87171'
  const bg = score >= 80 ? 'rgba(34,197,94,0.12)' : score >= 60 ? 'rgba(234,179,8,0.12)' : 'rgba(239,68,68,0.12)'
  return (
    <div style={{
      background: bg,
      border: `1px solid ${color}30`,
      borderRadius: '999px',
      padding: '2px 10px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    }}>
      <span style={{ color, fontWeight: 700, fontSize: '0.85rem' }}>{score}</span>
      <span style={{ color: color + 'aa', fontSize: '0.7rem' }}>/ 100</span>
    </div>
  )
}

export default function JobCard({ job, onGenerate, onStatusChange, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [generating, setGenerating] = useState(false)

  async function handleGenerate(e) {
    e.stopPropagation()
    setGenerating(true)
    try {
      await onGenerate(job.id)
    } finally {
      setGenerating(false)
    }
  }

  function handleApply() {
    const url = job.apply_url || (job.apply_email ? `mailto:${job.apply_email}` : null)
    if (url) {
      window.open(url, '_blank', 'noopener')
      if (job.status !== 'applied') onStatusChange(job.id, 'applied')
    }
  }

  const cardStyle = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '1rem',
    padding: '1.25rem',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
  }

  return (
    <div style={cardStyle} onClick={() => setExpanded(v => !v)}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h3 style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>{job.title}</h3>
            <ScoreBadge score={job.match_score} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            {job.company && <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{job.company}</span>}
            {job.location && <span style={{ color: '#64748b', fontSize: '0.8rem' }}>📍 {job.location}</span>}
          </div>
          {job.match_summary && (
            <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.4rem', lineHeight: 1.4 }}>
              {job.match_summary}
            </p>
          )}
        </div>

        {/* Status pill + chevron */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
          <select
            value={job.status}
            onClick={e => e.stopPropagation()}
            onChange={e => { e.stopPropagation(); onStatusChange(job.id, e.target.value) }}
            style={{
              background: STATUS_COLORS[job.status] || 'rgba(255,255,255,0.06)',
              color: STATUS_TEXT[job.status] || '#94a3b8',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '2px 6px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <option value="new">New</option>
            <option value="saved">Saved</option>
            <option value="applied">Applied</option>
            <option value="rejected">Rejected</option>
          </select>
          <span style={{ color: '#475569', fontSize: '0.7rem' }}>
            {expanded ? '▲ collapse' : '▼ expand'}
          </span>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ marginTop: '1rem' }} onClick={e => e.stopPropagation()}>
          {job.description && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              maxHeight: '160px',
              overflowY: 'auto',
              marginBottom: '0.75rem',
            }}>
              <p style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                {job.description.slice(0, 1200)}{job.description.length > 1200 ? '…' : ''}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(job.apply_url || job.apply_email) && (
              <button onClick={handleApply} style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                border: 'none',
                borderRadius: '7px',
                padding: '0.45rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}>
                Apply →
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                background: generating ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.15)',
                color: generating ? '#475569' : '#818cf8',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: '7px',
                padding: '0.45rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: generating ? 'not-allowed' : 'pointer',
              }}
            >
              {generating ? 'Generating…' : job.cover_letter ? '↻ Regenerate' : '✦ Generate Cover Letter'}
            </button>
            <button
              onClick={() => onDelete(job.id)}
              style={{
                background: 'rgba(239,68,68,0.08)',
                color: '#f87171',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '7px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
