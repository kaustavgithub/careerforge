import { useEffect, useRef, useState } from 'react'
import api from '../../api/client'
import AiConfirmModal from './AiConfirmModal'

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
      background: bg, border: `1px solid ${color}30`, borderRadius: '999px',
      padding: '2px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px',
    }}>
      <span style={{ color, fontWeight: 700, fontSize: '0.85rem' }}>{score}</span>
      <span style={{ color: color + 'aa', fontSize: '0.7rem' }}>/ 100</span>
    </div>
  )
}

export default function JobCard({ job, aiConfigured, onGenerate, onStatusChange, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [cvLoading, setCvLoading] = useState(null)
  const [translating, setTranslating] = useState(false)
  const [translatedDesc, setTranslatedDesc] = useState(null)
  const [detectedLang, setDetectedLang] = useState(null)
  const [tailorOpen, setTailorOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const tailorRef = useRef(null)

  useEffect(() => {
    if (!tailorOpen) return
    function onOutsideClick(e) {
      if (tailorRef.current && !tailorRef.current.contains(e.target)) setTailorOpen(false)
    }
    document.addEventListener('mousedown', onOutsideClick, true)
    return () => document.removeEventListener('mousedown', onOutsideClick, true)
  }, [tailorOpen])

  async function handleTranslate(e) {
    e.stopPropagation()
    if (translatedDesc) { setTranslatedDesc(null); return }
    setTranslating(true)
    try {
      const res = await api.post(`/jobs/${job.id}/translate`)
      if (res.data.already_english) {
        setDetectedLang('en')
      } else {
        setTranslatedDesc(res.data.translated)
        setDetectedLang(res.data.detected_language)
      }
    } catch { } finally { setTranslating(false) }
  }

  async function runGenerate() {
    setGenerating(true)
    try { await onGenerate(job.id) } finally { setGenerating(false) }
  }

  function openTailorConfirm(e, { title, run }) {
    e.stopPropagation()
    setTailorOpen(false)
    setPendingAction({ title, run })
  }

  async function downloadTailoredCV(format) {
    setCvLoading(format)
    try {
      const res = await api.post(`/jobs/${job.id}/tailored-cv?format=${format}`, {}, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      const safe = s => (s || '').replace(/\s+/g, '_').slice(0, 25)
      a.download = `CV_${safe(job.title)}_${safe(job.company)}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } finally { setCvLoading(null) }
  }

  function handleApply() {
    const url = job.apply_url || (job.apply_email ? `mailto:${job.apply_email}` : null)
    if (url) window.open(url, '_blank', 'noopener')
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--border)',
      borderRadius: '1rem',
      padding: '1.25rem',
      cursor: 'pointer',
      transition: 'border-color 0.2s, background 0.2s',
      position: 'relative',
      zIndex: tailorOpen ? 20 : 1,
    }} onClick={() => setExpanded(v => !v)}>

      {/* Header row */}
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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
          <select
            value={job.status}
            onClick={e => e.stopPropagation()}
            onChange={e => { e.stopPropagation(); onStatusChange(job.id, e.target.value) }}
            style={{
              background: STATUS_COLORS[job.status] || 'var(--bg-card)',
              color: STATUS_TEXT[job.status] || 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '6px', padding: '2px 6px',
              fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600,
            }}
          >
            <option value="saved">Saved</option>
            <option value="applied">Applied</option>
            <option value="rejected">Rejected</option>
          </select>
          <span style={{ color: 'var(--text-faint)', fontSize: '0.7rem' }}>
            {expanded ? '▲ collapse' : '▼ expand'}
          </span>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ marginTop: '1rem' }} onClick={e => e.stopPropagation()}>
          {job.description && (
            <div style={{
              background: 'var(--bg-card-dim)',
              border: '1px solid var(--border-faint)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              maxHeight: '160px',
              overflowY: 'auto',
              marginBottom: '0.5rem',
            }}>
              {translatedDesc && (
                <p style={{ color: 'var(--text-faint)', fontSize: '0.7rem', marginBottom: '0.4rem' }}>
                  🌐 Translated from <strong>{detectedLang?.toUpperCase()}</strong>
                </p>
              )}
              {detectedLang === 'en' && !translatedDesc && (
                <p style={{ color: 'var(--text-faint)', fontSize: '0.7rem', marginBottom: '0.4rem' }}>
                  ✓ Already in English
                </p>
              )}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                {(translatedDesc || job.description).slice(0, 1200)}
                {(translatedDesc || job.description).length > 1200 ? '…' : ''}
              </p>
            </div>
          )}

          {job.description && (
            <div style={{ marginBottom: '0.75rem' }}>
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
            </div>
          )}

          {job.match_score >= 90 && (
            <p style={{ color: 'var(--text-faint)', fontSize: '0.72rem', marginBottom: '0.5rem' }}>
              💡 Already a strong match ({job.match_score}/100) — tailoring may add limited value. Your existing CV is probably fine.
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(job.apply_url || job.apply_email) && (
              <button onClick={handleApply} style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', border: 'none', borderRadius: '7px',
                padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              }}>
                Apply →
              </button>
            )}
            <div ref={tailorRef} style={{ position: 'relative' }}>
              <button
                onClick={e => { e.stopPropagation(); if (aiConfigured) setTailorOpen(v => !v) }}
                disabled={!aiConfigured || generating || !!cvLoading}
                title={!aiConfigured ? 'Add an API key in Settings to enable AI tailoring' : undefined}
                style={{
                  background: tailorOpen ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.15)',
                  color: '#818cf8',
                  border: `1px dashed ${tailorOpen ? '#818cf8' : 'rgba(99,102,241,0.45)'}`,
                  borderRadius: '7px', padding: '0.45rem 0.5rem 0.45rem 1rem',
                  fontSize: '0.8rem', fontWeight: 600,
                  cursor: (!aiConfigured || generating || cvLoading) ? 'not-allowed' : 'pointer',
                  opacity: aiConfigured ? 1 : 0.5,
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                <span>{generating ? 'Generating…' : cvLoading ? 'Building…' : '✦ Tailor'}</span>
                <span style={{
                  display: 'inline-block', transform: tailorOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s', fontSize: '0.7rem',
                }}>▾</span>
              </button>

              {tailorOpen && aiConfigured && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
                  background: 'var(--modal-bg, var(--bg-card))',
                  border: '1px solid var(--modal-border, var(--border))',
                  borderRadius: '0.625rem', padding: '0.35rem',
                  display: 'flex', flexDirection: 'column', gap: '0.2rem',
                  minWidth: '180px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}>
                  <button
                    onClick={e => openTailorConfirm(e, {
                      title: job.cover_letter ? 'Regenerate cover letter?' : 'Generate cover letter?',
                      run: runGenerate,
                    })}
                    style={{
                      background: 'transparent', border: 'none', textAlign: 'left',
                      color: '#818cf8', padding: '0.45rem 0.6rem', borderRadius: '0.4rem',
                      fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {job.cover_letter ? '↻ Cover Letter' : '✦ Cover Letter'}
                  </button>
                  <button
                    onClick={e => openTailorConfirm(e, {
                      title: 'Generate ATS CV (PDF)?',
                      run: () => downloadTailoredCV('pdf'),
                    })}
                    style={{
                      background: 'transparent', border: 'none', textAlign: 'left',
                      color: '#34d399', padding: '0.45rem 0.6rem', borderRadius: '0.4rem',
                      fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    ↓ ATS CV (PDF)
                  </button>
                  <button
                    onClick={e => openTailorConfirm(e, {
                      title: 'Generate ATS CV (DOCX)?',
                      run: () => downloadTailoredCV('docx'),
                    })}
                    style={{
                      background: 'transparent', border: 'none', textAlign: 'left',
                      color: '#34d399', padding: '0.45rem 0.6rem', borderRadius: '0.4rem',
                      fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    ↓ ATS CV (DOCX)
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => onDelete(job.id)} style={{
              background: 'rgba(239,68,68,0.08)', color: '#f87171',
              border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px',
              padding: '0.45rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer',
            }}>
              Remove
            </button>
          </div>
        </div>
      )}

      {pendingAction && (
        <AiConfirmModal
          title={pendingAction.title}
          description="This will call your configured AI provider and consume API tokens from your account."
          onConfirm={pendingAction.run}
          onClose={() => setPendingAction(null)}
        />
      )}
    </div>
  )
}
