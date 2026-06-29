import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import JobCard from '../components/jobs/JobCard'
import GenerateModal from '../components/jobs/GenerateModal'
import TrackerPanel from '../components/jobs/TrackerPanel'
import { useAISettings } from '../context/AISettingsContext'

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
  { value: 'score', label: 'Best match' },
  { value: 'newest_post', label: 'Newest posting' },
  { value: 'oldest_post', label: 'Oldest posting' },
]

export default function SavedJobs() {
  const { aiConfigured } = useAISettings()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('recently_saved')
  const [modalJob, setModalJob] = useState(null)

  useEffect(() => {
    api.get('/jobs')
      .then(r => { setJobs(r.data); setLoading(false) })
      .catch(() => { setError('Failed to load saved jobs.'); setLoading(false) })
  }, [])

  const sorted = useMemo(() => {
    const list = [...jobs]
    switch (sortBy) {
      case 'score':        return list.sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
      case 'newest_post':  return list.sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
      case 'oldest_post':  return list.sort((a, b) => new Date(a.published_at || 0) - new Date(b.published_at || 0))
      default:             return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
  }, [jobs, sortBy])

  const handleGenerate = useCallback(async (jobId) => {
    const { data } = await api.post(`/jobs/${jobId}/generate`)
    setJobs(prev => prev.map(j => j.id === jobId ? data : j))
    setModalJob(data)
  }, [])

  const handleStatusChange = useCallback(async (jobId, status) => {
    const { data } = await api.patch(`/jobs/${jobId}/status`, { status })
    setJobs(prev => prev.map(j => j.id === jobId ? data : j))
  }, [])

  const handleDelete = useCallback(async (jobId) => {
    await api.delete(`/jobs/${jobId}`)
    setJobs(prev => prev.filter(j => j.id !== jobId))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: '800px', height: '800px', top: '-200px', left: '-200px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', borderRadius: '50%',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Saved Jobs
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {jobs.length} saved · track applications, generate CVs and cover letters
              </p>
            </div>

            {/* Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>Sort:</span>
              <div style={{
                display: 'inline-flex', background: 'var(--bg-card)',
                border: '1px solid var(--border)', borderRadius: '0.625rem', padding: '0.2rem', gap: '0.15rem',
              }}>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
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

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: 'var(--bg-card-dim)', borderRadius: '1rem', height: '100px' }} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.75rem', padding: '1rem', color: '#f87171', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {!loading && !error && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
              <div>
                {jobs.length === 0 ? (
                  <div style={{
                    background: 'var(--bg-card-dim)', border: '1px solid var(--border-dim)',
                    borderRadius: '1.25rem', padding: '4rem 2rem', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>★</div>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.5rem' }}>No saved jobs yet</p>
                    <p style={{ color: 'var(--text-faint)', fontSize: '0.82rem' }}>
                      Search for jobs and click Save on the ones you want to track.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {sorted.map(job => (
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
                )}
              </div>

              <TrackerPanel jobs={jobs} onStatusChange={handleStatusChange} />
            </div>
          )}
        </div>
      </div>

      {modalJob && <GenerateModal job={modalJob} onClose={() => setModalJob(null)} />}
    </div>
  )
}
