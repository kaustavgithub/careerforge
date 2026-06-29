import { useEffect, useRef, useState } from 'react'
import api from '../api/client'
import AiConfirmModal from '../components/jobs/AiConfirmModal'
import { useAISettings } from '../context/AISettingsContext'

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

function ScoreRing({ score }) {
  const radius = 36
  const circ = 2 * Math.PI * radius
  const filled = score != null ? (score / 100) * circ : 0
  const color = score == null ? '#475569' : score >= 70 ? '#4ade80' : score >= 45 ? '#facc15' : '#f87171'
  return (
    <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
      <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
        <circle cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={circ - filled}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.375rem', fontWeight: 800, color, lineHeight: 1 }}>{score ?? '—'}</span>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-faint)', letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 3 }}>Match</span>
      </div>
    </div>
  )
}


function ToggleSwitch({ on, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={onChange}
        style={{
          width: 36, height: 20, borderRadius: 10, flexShrink: 0, position: 'relative',
          background: on ? '#6366f1' : '#475569',
          transition: 'background 0.2s',
          cursor: 'pointer',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 2, left: on ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
          transition: 'left 0.18s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
    </label>
  )
}

export default function JDAnalyser() {
  const { aiConfigured } = useAISettings()

  const [jd, setJd] = useState('')
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  const [translateChecked, setTranslateChecked] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translatedFrom, setTranslatedFrom] = useState(null)

  const [useAi, setUseAi] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [scoreResult, setScoreResult] = useState(null)
  const [scoreError, setScoreError] = useState(null)

  const [tailorOpen, setTailorOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const tailorRef = useRef(null)

  useEffect(() => {
    if (!tailorOpen) return
    function handleOutside(e) {
      if (tailorRef.current && !tailorRef.current.contains(e.target)) setTailorOpen(false)
    }
    document.addEventListener('mousedown', handleOutside, true)
    return () => document.removeEventListener('mousedown', handleOutside, true)
  }, [tailorOpen])

  const [generating, setGenerating] = useState(false)
  const [savedJob, setSavedJob] = useState(null)
  const [genError, setGenError] = useState(null)
  const [cvLoading, setCvLoading] = useState(null)
  const [copied, setCopied] = useState(false)

  const tweaks = (() => {
    try { return JSON.parse(savedJob?.cv_tweaks || '[]') } catch { return [] }
  })()

  async function handleScore() {
    if (!jd.trim()) return
    setScoring(true)
    setScoreError(null)
    setScoreResult(null)
    setSavedJob(null)
    setGenError(null)
    setTranslatedFrom(null)

    let textToScore = jd.trim()

    if (translateChecked) {
      setTranslating(true)
      try {
        const { data } = await api.post('/jobs/translate-text', { text: textToScore })
        if (!data.already_english) {
          textToScore = data.translated
          setJd(data.translated)
          setTranslatedFrom(data.detected_language)
        }
      } catch {
        // translation failed — score with original text
      } finally {
        setTranslating(false)
      }
    }

    try {
      const { data } = await api.post('/jobs/analyse-jd', {
        description: textToScore,
        title: title.trim() || null,
        company: company.trim() || null,
        location: location.trim() || null,
        use_ai: useAi && aiConfigured,
      })
      setScoreResult(data)
    } catch (err) {
      setScoreError(err.response?.data?.detail || 'Scoring failed. Please try again.')
    } finally {
      setScoring(false)
    }
  }

  async function ensureSaved() {
    if (savedJob) return savedJob
    const { data } = await api.post('/jobs/manual', {
      description: jd.trim(),
      title: title.trim() || 'Untitled Position',
      company: company.trim() || null,
      location: location.trim() || null,
    })
    setSavedJob(data)
    return data
  }

  async function runCoverLetter() {
    setGenerating(true)
    setGenError(null)
    try {
      const job = await ensureSaved()
      if (job.cover_letter) return
      // already generated by /manual
    } catch (err) {
      setGenError(err.response?.data?.detail || 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  async function runDownloadCV(format) {
    setCvLoading(format)
    try {
      const job = await ensureSaved()
      const res = await api.post(`/jobs/${job.id}/tailored-cv?format=${format}`, {}, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      const safe = s => (s || '').replace(/\s+/g, '_').slice(0, 25)
      a.download = `CV_${safe(job.title)}_${safe(job.company)}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setGenError(err.response?.data?.detail || 'Download failed.')
    } finally {
      setCvLoading(null)
    }
  }

  function openConfirm(actionTitle, run) {
    setTailorOpen(false)
    setPendingAction({ title: actionTitle, run })
  }

  function copyLetter() {
    navigator.clipboard.writeText(savedJob?.cover_letter || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const busy = generating || !!cvLoading

  const inputStyle = {
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    color: 'var(--input-color)',
    borderRadius: '0.75rem',
    padding: '0.6rem 0.875rem',
    fontSize: '0.875rem',
    width: '100%',
    outline: 'none',
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-page)' }}>
      <div className="absolute top-0 left-1/4 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 65%)' }} />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)' }} />

      <main className="relative max-w-2xl mx-auto px-4 py-14">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-400 mb-2">JD Analyser</p>
          <h2 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Analyse a Job</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Paste any job description to see how well it matches your profile, then tailor your CV and cover letter.
          </p>
        </div>

        {/* Input card */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card-dim)', border: '1px solid var(--border)' }}>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
            Job Description
          </label>
          <textarea
            value={jd}
            onChange={e => { setJd(e.target.value); setTranslatedFrom(null) }}
            placeholder="Paste the full job description here…"
            rows={9}
            style={{ ...inputStyle, borderRadius: '0.875rem', resize: 'vertical', minHeight: 170, lineHeight: 1.6 }}
          />

          {/* Optional detail fields */}
          <button
            onClick={() => setShowDetails(v => !v)}
            className="mt-3 text-xs font-semibold flex items-center gap-1.5 transition"
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <svg className="w-3.5 h-3.5" style={{ transform: showDetails ? 'rotate(90deg)' : 'none' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showDetails ? 'Hide details' : 'Add role & company (optional)'}
          </button>

          {showDetails && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { label: 'Role Title', value: title, set: setTitle, placeholder: 'e.g. Senior Engineer' },
                { label: 'Company', value: company, set: setCompany, placeholder: 'e.g. Acme Corp' },
                { label: 'Location', value: location, set: setLocation, placeholder: 'e.g. Stockholm' },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-faint)' }}>{label}</label>
                  <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                    style={{ ...inputStyle, borderRadius: '0.625rem' }} />
                </div>
              ))}
            </div>
          )}

          {/* Controls row */}
          <div className="mt-4 flex items-center gap-5 flex-wrap">
            <ToggleSwitch
              on={translateChecked}
              onChange={() => setTranslateChecked(v => !v)}
              label="Translate to English"
            />
            {aiConfigured && (
              <ToggleSwitch
                on={useAi}
                onChange={() => setUseAi(v => !v)}
                label="Use AI scoring"
              />
            )}

            <button
              onClick={handleScore}
              disabled={!jd.trim() || scoring || translating}
              className="ml-auto px-5 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-40 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 24px rgba(99,102,241,0.30)' }}
            >
              {translating ? <><Spinner />Translating…</> : scoring ? <><Spinner />Scoring…</> : 'Score JD'}
            </button>
          </div>
        </div>

        {/* Translation notice */}
        {translatedFrom && (
          <div className="mt-3 px-4 py-2 rounded-xl text-xs flex items-center gap-2"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', color: 'var(--text-muted)' }}>
            🌐 Translated from <strong style={{ color: 'var(--text-secondary)' }}>{translatedFrom.toUpperCase()}</strong> — textarea updated with English text
          </div>
        )}

        {scoreError && (
          <div className="mt-4 rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}>
            {scoreError}
          </div>
        )}

        {/* Score result */}
        {scoreResult && (
          <div className="mt-6 rounded-2xl p-6" style={{ background: 'var(--bg-card-dim)', border: '1px solid var(--border)' }}>
            <div className="flex items-start gap-5">
              <ScoreRing score={scoreResult.score} />
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-faint)' }}>Match Score</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {scoreResult.summary || 'No summary available.'}
                </p>
              </div>
            </div>

            {/* Tailor dropdown */}
            <div className="mt-5 pt-4 flex items-center gap-3" style={{ borderTop: '1px solid var(--border-faint)' }}>
              {!aiConfigured ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Add an API key in Settings to tailor your CV and generate a cover letter.
                </p>
              ) : (
                <div ref={tailorRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setTailorOpen(v => !v)}
                    disabled={busy}
                    style={{
                      background: tailorOpen ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.15)',
                      color: '#818cf8',
                      border: `1px dashed ${tailorOpen ? '#818cf8' : 'rgba(99,102,241,0.45)'}`,
                      borderRadius: '7px', padding: '0.45rem 0.5rem 0.45rem 1rem',
                      fontSize: '0.85rem', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      opacity: busy ? 0.5 : 1,
                    }}
                  >
                    <span>{busy ? (generating ? 'Generating…' : 'Building…') : '✦ Tailor'}</span>
                    <span style={{ display: 'inline-block', transform: tailorOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', fontSize: '0.7rem' }}>▾</span>
                  </button>

                  {tailorOpen && (
                    <div style={{
                      position: 'absolute', bottom: 'calc(100% + 4px)', left: 0, zIndex: 50,
                      background: 'var(--modal-bg, var(--bg-card))',
                      border: '1px solid var(--modal-border, var(--border))',
                      borderRadius: '0.625rem', padding: '0.35rem',
                      display: 'flex', flexDirection: 'column', gap: '0.2rem',
                      minWidth: '180px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}>
                      <button
                        onClick={() => openConfirm(
                          savedJob?.cover_letter ? 'Cover letter already generated. View it below.' : 'Generate cover letter?',
                          runCoverLetter
                        )}
                        style={{
                          background: 'transparent', border: 'none', textAlign: 'left',
                          color: '#818cf8', padding: '0.45rem 0.6rem', borderRadius: '0.4rem',
                          fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        {savedJob?.cover_letter ? '↻ Cover Letter' : '✦ Cover Letter'}
                      </button>
                      <button
                        onClick={() => openConfirm('Generate ATS CV (PDF)?', () => runDownloadCV('pdf'))}
                        style={{
                          background: 'transparent', border: 'none', textAlign: 'left',
                          color: '#34d399', padding: '0.45rem 0.6rem', borderRadius: '0.4rem',
                          fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        ↓ ATS CV (PDF)
                      </button>
                      <button
                        onClick={() => openConfirm('Generate ATS CV (DOCX)?', () => runDownloadCV('docx'))}
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
              )}

              {genError && (
                <p className="text-xs" style={{ color: '#f87171' }}>{genError}</p>
              )}
            </div>
          </div>
        )}

        {/* Cover letter */}
        {savedJob?.cover_letter && (
          <div className="mt-6 rounded-2xl p-6" style={{ background: 'var(--bg-card-dim)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Cover Letter</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                  {savedJob.title}{savedJob.company ? ` · ${savedJob.company}` : ''}
                </p>
              </div>
              <button
                onClick={copyLetter}
                style={{
                  background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                  color: copied ? '#4ade80' : '#818cf8',
                  border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.3)'}`,
                  borderRadius: '8px', padding: '0.4rem 1rem',
                  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {copied ? '✓ Copied!' : 'Copy Letter'}
              </button>
            </div>
            <div style={{
              background: 'var(--bg-card-dim)', border: '1px solid var(--border-dim)',
              borderRadius: '0.75rem', padding: '1.25rem',
            }}>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
                {savedJob.cover_letter}
              </p>
            </div>
          </div>
        )}

        {/* CV tweaks */}
        {tweaks.length > 0 && (
          <div className="mt-4 rounded-2xl p-6" style={{ background: 'var(--bg-card-dim)', border: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 0.75rem 0' }}>
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
          </div>
        )}
      </main>

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
