import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from '../api/client'
import api from '../api/client'
import AiConfirmModal from '../components/jobs/AiConfirmModal'
import GenerateModal from '../components/jobs/GenerateModal'
import JobCard from '../components/jobs/JobCard'
import SearchResultCard from '../components/jobs/SearchResultCard'
import { useAISettings } from '../context/AISettingsContext'

// ── Helpers ────────────────────────────────────────────────────────────────

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
      <div onClick={onChange} style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0, position: 'relative',
        background: on ? '#6366f1' : '#475569', transition: 'background 0.2s', cursor: 'pointer',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: on ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%', background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.35)', transition: 'left 0.18s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
    </label>
  )
}

const inputStyle = {
  background: 'var(--input-bg)', border: '1px solid var(--input-border)',
  color: 'var(--input-color)', borderRadius: '0.75rem',
  padding: '0.6rem 0.875rem', fontSize: '0.875rem', width: '100%', outline: 'none',
}

function timeAgo(dateStr) {
  if (!dateStr) return null
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

const SORT_OPTIONS = [
  { value: 'recently_saved', label: 'Recently saved' },
  { value: 'score',          label: 'Best match' },
  { value: 'newest_post',    label: 'Newest posting' },
  { value: 'oldest_post',    label: 'Oldest posting' },
]

// ── Main component ─────────────────────────────────────────────────────────

export default function Jobs() {
  const { settings: aiSettings, aiConfigured } = useAISettings()
  const [tab, setTab] = useState('search')

  // ── Search tab ────────────────────────────────────────────────────────────
  const [query, setQuery] = useState(() => sessionStorage.getItem('jb_query') || '')
  const [location, setLocation] = useState(() => sessionStorage.getItem('jb_location') || '')
  const [useAi, setUseAi] = useState(false)
  const [results, setResults] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('jb_results') || '[]') } catch { return [] }
  })
  const [savedIds, setSavedIds] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const searchInput = useRef(null)

  useEffect(() => {
    if (aiSettings) setUseAi(aiSettings.use_local_ai === false && aiConfigured)
  }, [aiSettings, aiConfigured])

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearchError('')
    try {
      const { data } = await axios.post('/jobs/search', {
        query: query.trim(), location: location.trim() || null, limit: 20, use_ai: useAi,
      })
      setResults(data)
      setSavedIds(new Set())
      sessionStorage.setItem('jb_query', query.trim())
      sessionStorage.setItem('jb_location', location.trim())
      sessionStorage.setItem('jb_results', JSON.stringify(data))
    } catch (err) {
      setSearchError(err.response?.data?.detail || 'Search failed. Please try again.')
    } finally { setLoading(false) }
  }

  function handleSaved(savedJob) {
    setSavedIds(prev => new Set([...prev, savedJob.external_id]))
  }

  // ── Saved / Applied / Rejected tab (DB-backed) ────────────────────────────
  const [dbJobs, setDbJobs] = useState([])
  const [dbLoaded, setDbLoaded] = useState(false)
  const [dbLoading, setDbLoading] = useState(false)
  const [dbError, setDbError] = useState(null)
  const [sortBy, setSortBy] = useState('recently_saved')
  const [modalJob, setModalJob] = useState(null)

  useEffect(() => {
    setDbLoading(true)
    api.get('/jobs')
      .then(r => { setDbJobs(r.data); setDbLoaded(true) })
      .catch(() => setDbError('Failed to load jobs.'))
      .finally(() => setDbLoading(false))
  }, [])

  const handleGenerate = useCallback(async (jobId) => {
    const { data } = await api.post(`/jobs/${jobId}/generate`)
    setDbJobs(prev => prev.map(j => j.id === jobId ? data : j))
    setModalJob(data)
  }, [])

  const handleStatusChange = useCallback(async (jobId, status) => {
    const { data } = await api.patch(`/jobs/${jobId}/status`, { status })
    setDbJobs(prev => prev.map(j => j.id === jobId ? data : j))
  }, [])

  const handleDelete = useCallback(async (jobId) => {
    await api.delete(`/jobs/${jobId}`)
    setDbJobs(prev => prev.filter(j => j.id !== jobId))
  }, [])

  const sortedDbJobs = useMemo(() => {
    const list = [...dbJobs]
    switch (sortBy) {
      case 'score':       return list.sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
      case 'newest_post': return list.sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
      case 'oldest_post': return list.sort((a, b) => new Date(a.published_at || 0) - new Date(b.published_at || 0))
      default:            return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
  }, [dbJobs, sortBy])

  const savedJobs   = sortedDbJobs.filter(j => j.status === 'saved')
  const appliedJobs = sortedDbJobs.filter(j => j.status === 'applied')
  const rejectedJobs = sortedDbJobs.filter(j => j.status === 'rejected')

  // ── JD Analyser tab ───────────────────────────────────────────────────────
  const [jd, setJd] = useState('')
  const [jdTitle, setJdTitle] = useState('')
  const [jdCompany, setJdCompany] = useState('')
  const [jdLocation, setJdLocation] = useState('')
  const [jdApplyUrl, setJdApplyUrl] = useState('')
  const [jdTitleError, setJdTitleError] = useState(false)
  const [translateChecked, setTranslateChecked] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translatedFrom, setTranslatedFrom] = useState(null)
  const [useAiJD, setUseAiJD] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [scoreResult, setScoreResult] = useState(null)
  const [scoreError, setScoreError] = useState(null)
  const [tailorOpen, setTailorOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const tailorRef = useRef(null)
  const [generating, setGenerating] = useState(false)
  const [savedJDJob, setSavedJDJob] = useState(null)
  const [jdSavedStatus, setJdSavedStatus] = useState(null)
  const [jdSaving, setJdSaving] = useState(false)
  const [jdSaveError, setJdSaveError] = useState(null)
  const [genError, setGenError] = useState(null)
  const [cvLoading, setCvLoading] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!tailorOpen) return
    function handleOutside(e) {
      if (tailorRef.current && !tailorRef.current.contains(e.target)) setTailorOpen(false)
    }
    document.addEventListener('mousedown', handleOutside, true)
    return () => document.removeEventListener('mousedown', handleOutside, true)
  }, [tailorOpen])

  const tweaks = (() => {
    try { return JSON.parse(savedJDJob?.cv_tweaks || '[]') } catch { return [] }
  })()

  async function handleScore() {
    if (!jd.trim()) return
    if (!jdTitle.trim()) { setJdTitleError(true); return }
    setJdTitleError(false)
    setScoring(true); setScoreError(null); setScoreResult(null)
    setSavedJDJob(null); setJdSavedStatus(null); setJdSaveError(null)
    setGenError(null); setTranslatedFrom(null)
    let textToScore = jd.trim()
    if (translateChecked) {
      setTranslating(true)
      try {
        const { data } = await api.post('/jobs/translate-text', { text: textToScore })
        if (!data.already_english) { textToScore = data.translated; setJd(data.translated); setTranslatedFrom(data.detected_language) }
      } catch { } finally { setTranslating(false) }
    }
    try {
      const { data } = await api.post('/jobs/analyse-jd', {
        description: textToScore, title: jdTitle.trim(),
        company: jdCompany.trim() || null, location: jdLocation.trim() || null,
        use_ai: useAiJD && aiConfigured,
      })
      setScoreResult(data)
    } catch (err) {
      setScoreError(err.response?.data?.detail || 'Scoring failed. Please try again.')
    } finally { setScoring(false) }
  }

  async function handleJdStatus(nextStatus) {
    if (jdSaving || jdSavedStatus === nextStatus) return
    setJdSaving(true); setJdSaveError(null)
    try {
      if (!savedJDJob) {
        const { data } = await api.post('/jobs/save-jd', {
          title: jdTitle.trim(),
          company: jdCompany.trim() || null,
          location: jdLocation.trim() || null,
          apply_url: jdApplyUrl.trim() || null,
          description: jd.trim(),
          status: nextStatus,
          match_score: scoreResult?.score ?? null,
          match_summary: scoreResult?.summary ?? null,
        })
        setSavedJDJob(data)
      } else {
        await api.patch(`/jobs/${savedJDJob.id}/status`, { status: nextStatus })
      }
      setJdSavedStatus(nextStatus)
    } catch (err) {
      setJdSaveError(err?.response?.data?.detail || 'Failed to save.')
    } finally { setJdSaving(false) }
  }

  async function ensureSaved() {
    if (savedJDJob) return savedJDJob
    const { data } = await api.post('/jobs/save-jd', {
      title: jdTitle.trim() || 'Untitled Position',
      company: jdCompany.trim() || null,
      location: jdLocation.trim() || null,
      apply_url: jdApplyUrl.trim() || null,
      description: jd.trim(),
      status: jdSavedStatus || 'saved',
      match_score: scoreResult?.score ?? null,
      match_summary: scoreResult?.summary ?? null,
    })
    setSavedJDJob(data)
    if (!jdSavedStatus) setJdSavedStatus('saved')
    return data
  }

  async function runCoverLetter() {
    setGenerating(true); setGenError(null)
    try { await ensureSaved() } catch (err) { setGenError(err.response?.data?.detail || 'Generation failed.') }
    finally { setGenerating(false) }
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
    } catch (err) { setGenError(err.response?.data?.detail || 'Download failed.') }
    finally { setCvLoading(null) }
  }

  function openConfirm(actionTitle, run) { setTailorOpen(false); setPendingAction({ title: actionTitle, run }) }

  function copyLetter() {
    navigator.clipboard.writeText(savedJDJob?.cover_letter || '')
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const jdBusy = generating || !!cvLoading

  // ── Tab config ────────────────────────────────────────────────────────────

  const TABS = [
    { key: 'search',   label: 'Search Jobs' },
    { key: 'analyse',  label: 'JD Analyser' },
    { key: 'saved',    label: 'Saved',    count: dbLoaded ? savedJobs.length    : null },
    { key: 'applied',  label: 'Applied',  count: dbLoaded ? appliedJobs.length  : null },
    { key: 'rejected', label: 'Rejected', count: dbLoaded ? rejectedJobs.length : null },
  ]

  const COUNT_COLOR = {
    saved:    { bg: 'rgba(234,179,8,0.2)',  text: '#fde047' },
    applied:  { bg: 'rgba(34,197,94,0.2)',  text: '#4ade80' },
    rejected: { bg: 'rgba(239,68,68,0.2)',  text: '#f87171' },
  }

  // ── Shared DB tab renderer ────────────────────────────────────────────────

  function DbJobList({ list, emptyIcon, emptyTitle, emptyBody }) {
    if (dbLoading) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[1, 2, 3].map(i => <div key={i} style={{ background: 'var(--bg-card-dim)', borderRadius: '1rem', height: '90px' }} />)}
      </div>
    )
    if (dbError) return (
      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.75rem', padding: '1rem', color: '#f87171', fontSize: '0.85rem' }}>
        {dbError}
      </div>
    )
    if (list.length === 0) return (
      <div style={{ background: 'var(--bg-card-dim)', border: '1px solid var(--border-dim)', borderRadius: '1.25rem', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{emptyIcon}</div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.5rem' }}>{emptyTitle}</p>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.82rem' }}>{emptyBody}</p>
      </div>
    )
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {list.map(job => (
          <div key={job.id}>
            {job.published_at && (
              <p style={{ color: 'var(--text-faint)', fontSize: '0.7rem', marginBottom: '0.3rem', paddingLeft: '0.25rem' }}>
                Posted {timeAgo(job.published_at)}
              </p>
            )}
            <JobCard
              job={job}
              aiConfigured={aiConfigured}
              onGenerate={handleGenerate}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          </div>
        ))}
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: '800px', height: '800px', top: '-200px', left: '-200px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', borderRadius: '50%',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Tab bar */}
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: 0 }}>
            {TABS.map(t => {
              const isActive = tab === t.key
              const cc = COUNT_COLOR[t.key]
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    background: 'none', border: 'none',
                    borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
                    color: isActive ? '#818cf8' : 'var(--text-muted)',
                    padding: '1rem 1.1rem',
                    fontSize: '0.875rem', fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer', marginBottom: '-1px',
                    transition: 'color 0.15s, border-color 0.15s',
                    display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap',
                  }}
                >
                  {t.label}
                  {cc && t.count != null && (
                    <span style={{
                      background: cc.bg, color: cc.text,
                      borderRadius: '999px', padding: '1px 7px',
                      fontSize: '0.68rem', fontWeight: 700,
                    }}>
                      {t.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Search Jobs ─────────────────────────────────────────────────── */}
        {tab === 'search' && (
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1.5rem 2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Job Search</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Ranked matches from Sweden's JobTech API · Save the ones you like to track and tailor
              </p>
            </div>

            <form onSubmit={handleSearch} style={{
              background: 'var(--bg-card)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.25rem', marginBottom: '2rem',
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  ref={searchInput} type="text" placeholder="Job title, skills, keywords…"
                  value={query} onChange={e => setQuery(e.target.value)}
                  style={{ flex: '1 1 240px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '0.625rem', padding: '0.6rem 0.875rem', color: 'var(--input-color)', fontSize: '0.875rem', outline: 'none' }}
                />
                <input
                  type="text" placeholder="Location (optional)"
                  value={location} onChange={e => setLocation(e.target.value)}
                  style={{ flex: '0 1 180px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '0.625rem', padding: '0.6rem 0.875rem', color: 'var(--input-color)', fontSize: '0.875rem', outline: 'none' }}
                />
                <button type="submit" disabled={loading || !query.trim()} style={{
                  background: loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', border: 'none', borderRadius: '0.625rem',
                  padding: '0.6rem 1.5rem', fontWeight: 600, fontSize: '0.875rem',
                  cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                }}>
                  {loading ? 'Searching…' : 'Search + Rank'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border-dim, var(--border))' }}>
                <span style={{ color: 'var(--text-faint)', fontSize: '0.78rem' }}>Rank using:</span>
                <div style={{ display: 'flex', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '0.625rem', padding: '0.2rem', gap: '0.2rem' }}>
                  {[{ value: false, label: 'Local matching' }, { value: true, label: 'AI matching' }].map(opt => {
                    const isDisabled = opt.value && !aiConfigured
                    return (
                      <button key={String(opt.value)} type="button" disabled={isDisabled}
                        onClick={() => !isDisabled && setUseAi(opt.value)}
                        title={isDisabled ? 'Add an API key in Settings to enable AI matching' : undefined}
                        style={{
                          background: useAi === opt.value ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                          color: isDisabled ? 'var(--text-faint)' : (useAi === opt.value ? '#fff' : 'var(--text-muted)'),
                          border: 'none', borderRadius: '0.5rem', padding: '0.4rem 0.75rem',
                          fontWeight: 600, fontSize: '0.78rem',
                          cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.5 : 1,
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </form>

            {searchError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                {searchError}
              </div>
            )}

            {!loading && results.length === 0 && (
              <div style={{ background: 'var(--bg-card-dim)', border: '1px solid var(--border-dim)', borderRadius: '1.25rem', padding: '4rem 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
                <p style={{ color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.5rem' }}>Search for your next role</p>
                <p style={{ color: 'var(--text-faint)', fontSize: '0.82rem' }}>
                  Enter a job title or skills above — we'll fetch live listings and rank them against your profile.
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {results.length} results · {savedIds.size} saved this session
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {results.map(job => (
                    <SearchResultCard key={job.external_id} job={job} onSaved={handleSaved} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── JD Analyser ─────────────────────────────────────────────────── */}
        {tab === 'analyse' && (
          <div style={{ maxWidth: '672px', margin: '0 auto', padding: '1.5rem 1.5rem 2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#818cf8', marginBottom: '0.5rem' }}>JD Analyser</p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Analyse a Job</h2>
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Paste any job description to see how well it matches your profile, then tailor your CV and cover letter.
              </p>
            </div>

            <div style={{ background: 'var(--bg-card-dim)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}>

              {/* Required fields row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-faint)', marginBottom: '0.35rem' }}>
                    Role Title
                    <span style={{ color: '#f87171', fontWeight: 700 }}>*</span>
                  </label>
                  <input
                    value={jdTitle}
                    onChange={e => { setJdTitle(e.target.value); if (e.target.value.trim()) setJdTitleError(false) }}
                    placeholder="e.g. Senior Engineer"
                    style={{
                      ...inputStyle, borderRadius: '0.625rem',
                      border: jdTitleError ? '1px solid #f87171' : '1px solid var(--input-border)',
                    }}
                  />
                  {jdTitleError && <p style={{ color: '#f87171', fontSize: '0.7rem', marginTop: '3px' }}>Role title is required</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-faint)', marginBottom: '0.35rem' }}>Company</label>
                  <input value={jdCompany} onChange={e => setJdCompany(e.target.value)} placeholder="e.g. Acme Corp"
                    style={{ ...inputStyle, borderRadius: '0.625rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-faint)', marginBottom: '0.35rem' }}>Location</label>
                  <input value={jdLocation} onChange={e => setJdLocation(e.target.value)} placeholder="e.g. Stockholm"
                    style={{ ...inputStyle, borderRadius: '0.625rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-faint)', marginBottom: '0.35rem' }}>Apply URL</label>
                  <input value={jdApplyUrl} onChange={e => setJdApplyUrl(e.target.value)} placeholder="https://…"
                    style={{ ...inputStyle, borderRadius: '0.625rem' }} />
                </div>
              </div>

              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-faint)', marginBottom: '0.35rem' }}>
                Job Description <span style={{ color: '#f87171', fontWeight: 700 }}>*</span>
              </label>
              <textarea
                value={jd} onChange={e => { setJd(e.target.value); setTranslatedFrom(null) }}
                placeholder="Paste the full job description here…" rows={8}
                style={{ ...inputStyle, borderRadius: '0.875rem', resize: 'vertical', minHeight: 150, lineHeight: 1.6 }}
              />

              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                <ToggleSwitch on={translateChecked} onChange={() => setTranslateChecked(v => !v)} label="Translate to English" />
                {aiConfigured && <ToggleSwitch on={useAiJD} onChange={() => setUseAiJD(v => !v)} label="Use AI scoring" />}
                <button onClick={handleScore} disabled={!jd.trim() || scoring || translating}
                  style={{
                    marginLeft: 'auto', padding: '0.625rem 1.25rem', borderRadius: '0.75rem',
                    fontSize: '0.875rem', fontWeight: 700, color: '#fff',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 4px 24px rgba(99,102,241,0.30)', border: 'none',
                    cursor: !jd.trim() || scoring || translating ? 'not-allowed' : 'pointer',
                    opacity: !jd.trim() || scoring || translating ? 0.4 : 1,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}
                >
                  {translating ? <><Spinner />Translating…</> : scoring ? <><Spinner />Scoring…</> : 'Score JD'}
                </button>
              </div>
            </div>

            {translatedFrom && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', color: 'var(--text-muted)' }}>
                🌐 Translated from <strong style={{ color: 'var(--text-secondary)' }}>{translatedFrom.toUpperCase()}</strong> — textarea updated with English text
              </div>
            )}

            {scoreError && (
              <div style={{ marginTop: '1rem', borderRadius: '0.75rem', padding: '0.75rem 1rem', fontSize: '0.875rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}>
                {scoreError}
              </div>
            )}

            {scoreResult && (
              <div style={{ marginTop: '1.5rem', borderRadius: '1rem', padding: '1.5rem', background: 'var(--bg-card-dim)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                  <ScoreRing score={scoreResult.score} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-faint)', marginBottom: '0.375rem' }}>Match Score</p>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                      {scoreResult.summary || 'No summary available.'}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-faint)' }}>

                  {/* Status buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-faint)', fontSize: '0.75rem', marginRight: '0.25rem' }}>Track as:</span>
                    {[
                      { value: 'saved',    label: 'Saved',    activeColor: '#fde047', activeBg: 'rgba(234,179,8,0.2)',  activeBorder: 'rgba(234,179,8,0.5)'  },
                      { value: 'applied',  label: 'Applied',  activeColor: '#4ade80', activeBg: 'rgba(34,197,94,0.2)',  activeBorder: 'rgba(34,197,94,0.5)'  },
                      { value: 'rejected', label: 'Rejected', activeColor: '#f87171', activeBg: 'rgba(239,68,68,0.2)',  activeBorder: 'rgba(239,68,68,0.5)'  },
                    ].map(opt => {
                      const isActive = jdSavedStatus === opt.value
                      return (
                        <button key={opt.value} onClick={() => handleJdStatus(opt.value)} disabled={jdSaving}
                          style={{
                            background: isActive ? opt.activeBg : 'var(--bg-card)',
                            color: isActive ? opt.activeColor : 'var(--text-muted)',
                            border: isActive ? `1px solid ${opt.activeBorder}` : '1px solid var(--border)',
                            borderRadius: '7px', padding: '0.4rem 0.875rem',
                            fontSize: '0.8rem', fontWeight: 600,
                            cursor: jdSaving ? 'not-allowed' : 'pointer',
                            opacity: jdSaving ? 0.6 : 1,
                            transition: 'all 0.15s',
                          }}
                        >
                          {isActive && jdSaving ? '…' : opt.label}
                        </button>
                      )
                    })}

                    {jdSaveError && <p style={{ color: '#f87171', fontSize: '0.72rem', margin: 0 }}>{jdSaveError}</p>}
                    {jdSavedStatus && !jdSaving && (
                      <span style={{ color: 'var(--text-faint)', fontSize: '0.72rem', marginLeft: '0.25rem' }}>
                        ✓ Saved — visible in the {jdSavedStatus.charAt(0).toUpperCase() + jdSavedStatus.slice(1)} tab
                      </span>
                    )}
                  </div>

                  {/* Tailor */}
                  {aiConfigured && (
                    <div ref={tailorRef} style={{ position: 'relative', marginTop: '0.75rem' }}>
                      <button onClick={() => setTailorOpen(v => !v)} disabled={jdBusy}
                        style={{
                          background: tailorOpen ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.15)', color: '#818cf8',
                          border: `1px dashed ${tailorOpen ? '#818cf8' : 'rgba(99,102,241,0.45)'}`,
                          borderRadius: '7px', padding: '0.45rem 0.5rem 0.45rem 1rem',
                          fontSize: '0.85rem', fontWeight: 600, cursor: jdBusy ? 'not-allowed' : 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem', opacity: jdBusy ? 0.5 : 1,
                        }}
                      >
                        <span>{jdBusy ? (generating ? 'Generating…' : 'Building…') : '✦ Tailor CV / Cover Letter'}</span>
                        <span style={{ display: 'inline-block', transform: tailorOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', fontSize: '0.7rem' }}>▾</span>
                      </button>

                      {tailorOpen && (
                        <div style={{
                          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
                          background: 'var(--modal-bg, var(--bg-card))', border: '1px solid var(--modal-border, var(--border))',
                          borderRadius: '0.625rem', padding: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem',
                          minWidth: '200px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        }}>
                          <button onClick={() => openConfirm(savedJDJob?.cover_letter ? 'Cover letter already generated. View it below.' : 'Generate cover letter?', runCoverLetter)}
                            style={{ background: 'transparent', border: 'none', textAlign: 'left', color: '#818cf8', padding: '0.45rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                            {savedJDJob?.cover_letter ? '↻ Cover Letter' : '✦ Cover Letter'}
                          </button>
                          <button onClick={() => openConfirm('Generate ATS CV (PDF)?', () => runDownloadCV('pdf'))}
                            style={{ background: 'transparent', border: 'none', textAlign: 'left', color: '#34d399', padding: '0.45rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                            ↓ ATS CV (PDF)
                          </button>
                          <button onClick={() => openConfirm('Generate ATS CV (DOCX)?', () => runDownloadCV('docx'))}
                            style={{ background: 'transparent', border: 'none', textAlign: 'left', color: '#34d399', padding: '0.45rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                            ↓ ATS CV (DOCX)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {genError && <p style={{ fontSize: '0.75rem', color: '#f87171', margin: '0.5rem 0 0' }}>{genError}</p>}
                </div>
              </div>
            )}

            {savedJDJob?.cover_letter && (
              <div style={{ marginTop: '1.5rem', borderRadius: '1rem', padding: '1.5rem', background: 'var(--bg-card-dim)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Cover Letter</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                      {savedJDJob.title}{savedJDJob.company ? ` · ${savedJDJob.company}` : ''}
                    </p>
                  </div>
                  <button onClick={copyLetter}
                    style={{
                      background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                      color: copied ? '#4ade80' : '#818cf8',
                      border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.3)'}`,
                      borderRadius: '8px', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {copied ? '✓ Copied!' : 'Copy Letter'}
                  </button>
                </div>
                <div style={{ background: 'var(--bg-card-dim)', border: '1px solid var(--border-dim)', borderRadius: '0.75rem', padding: '1.25rem' }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {savedJDJob.cover_letter}
                  </p>
                </div>
              </div>
            )}

            {tweaks.length > 0 && (
              <div style={{ marginTop: '1rem', borderRadius: '1rem', padding: '1.5rem', background: 'var(--bg-card-dim)', border: '1px solid var(--border)' }}>
                <h3 style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem 0' }}>CV Tweaks</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tweaks.map((tweak, i) => (
                    <li key={i} style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '0.625rem', padding: '0.625rem 0.875rem', color: '#c4b5fd', fontSize: '0.82rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <span style={{ color: '#8b5cf6', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✦</span>
                      {tweak}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Saved / Applied / Rejected tabs ─────────────────────────────── */}
        {(tab === 'saved' || tab === 'applied' || tab === 'rejected') && (
          <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1.5rem 2rem' }}>

            {/* Sort bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {tab === 'saved' ? 'Saved Jobs' : tab === 'applied' ? 'Applied Jobs' : 'Rejected Jobs'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {tab === 'saved'    && 'Jobs you saved to apply later · generate CVs and cover letters'}
                  {tab === 'applied'  && 'Applications you have submitted'}
                  {tab === 'rejected' && 'Jobs you declined or were not selected for'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>Sort:</span>
                <div style={{ display: 'inline-flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.625rem', padding: '0.2rem', gap: '0.15rem' }}>
                  {SORT_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setSortBy(opt.value)}
                      style={{
                        padding: '0.3rem 0.7rem', borderRadius: '0.45rem', border: 'none',
                        fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                        background: sortBy === opt.value ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                        color: sortBy === opt.value ? '#fff' : 'var(--text-muted)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {tab === 'saved' && (
              <DbJobList
                list={savedJobs}
                emptyIcon="★"
                emptyTitle="No saved jobs yet"
                emptyBody="Search for jobs and click Save on the ones you want to track."
              />
            )}
            {tab === 'applied' && (
              <DbJobList
                list={appliedJobs}
                emptyIcon="📬"
                emptyTitle="No applications yet"
                emptyBody="Mark a saved job as Applied to track it here."
              />
            )}
            {tab === 'rejected' && (
              <DbJobList
                list={rejectedJobs}
                emptyIcon="📭"
                emptyTitle="Nothing here"
                emptyBody="Jobs you mark as Rejected will appear here."
              />
            )}
          </div>
        )}
      </div>

      {pendingAction && (
        <AiConfirmModal
          title={pendingAction.title}
          description="This will call your configured AI provider and consume API tokens from your account."
          onConfirm={pendingAction.run}
          onClose={() => setPendingAction(null)}
        />
      )}

      {modalJob && <GenerateModal job={modalJob} onClose={() => setModalJob(null)} />}
    </div>
  )
}
