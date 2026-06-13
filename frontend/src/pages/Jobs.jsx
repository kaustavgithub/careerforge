import { useCallback, useEffect, useRef, useState } from 'react'
import axios from '../api/client'
import JobCard from '../components/jobs/JobCard'
import GenerateModal from '../components/jobs/GenerateModal'
import TrackerPanel from '../components/jobs/TrackerPanel'
import Navbar from '../components/Navbar'

export default function Jobs() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')
  const [modalJob, setModalJob] = useState(null)
  const searchInput = useRef(null)

  useEffect(() => {
    axios.get('/jobs').then(r => {
      setJobs(r.data)
      setInitialLoad(false)
    }).catch(() => setInitialLoad(false))
  }, [])

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.post('/jobs/search', {
        query: query.trim(),
        location: location.trim() || null,
        limit: 20,
      })
      // Merge: keep existing tracked jobs that aren't in new results
      setJobs(prev => {
        const newIds = new Set(data.map(j => j.id))
        const kept = prev.filter(j => !newIds.has(j.id) && j.status !== 'new')
        return [...data, ...kept]
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = useCallback(async (jobId) => {
    const { data } = await axios.post(`/jobs/${jobId}/generate`)
    setJobs(prev => prev.map(j => j.id === jobId ? data : j))
    setModalJob(data)
  }, [])

  const handleStatusChange = useCallback(async (jobId, status) => {
    const { data } = await axios.patch(`/jobs/${jobId}/status`, { status })
    setJobs(prev => prev.map(j => j.id === jobId ? data : j))
  }, [])

  const handleDelete = useCallback(async (jobId) => {
    await axios.delete(`/jobs/${jobId}`)
    setJobs(prev => prev.filter(j => j.id !== jobId))
  }, [])

  // Split into search results (new) vs tracked
  const searchResults = jobs.filter(j => j.status === 'new' || j.cover_letter)
  // All jobs for tracker
  const trackedJobs = jobs

  return (
    <div style={{ minHeight: '100vh', background: '#06070f', color: '#e2e8f0' }}>
      {/* Ambient background orbs */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', width: '800px', height: '800px',
          top: '-200px', left: '-200px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', width: '600px', height: '600px',
          bottom: '-100px', right: '-100px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Page header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.25rem' }}>
              Job Search
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              AI-ranked matches from Sweden's JobTech API · Cover letters generated in seconds
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1rem',
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <input
              ref={searchInput}
              type="text"
              placeholder="Job title, skills, keywords…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                flex: '1 1 240px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.625rem',
                padding: '0.6rem 0.875rem',
                color: '#e2e8f0',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Location (optional)"
              value={location}
              onChange={e => setLocation(e.target.value)}
              style={{
                flex: '0 1 180px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.625rem',
                padding: '0.6rem 0.875rem',
                color: '#e2e8f0',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{
                background: loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.625rem',
                padding: '0.6rem 1.5rem',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Searching…' : 'Search + Rank'}
            </button>
          </form>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
            }}>
              {error}
            </div>
          )}

          {/* Main two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
            {/* Left: results */}
            <div>
              {initialLoad && (
                <div style={{ color: '#475569', textAlign: 'center', padding: '3rem 0' }}>Loading…</div>
              )}

              {!initialLoad && jobs.length === 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '1.25rem',
                  padding: '4rem 2rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
                  <p style={{ color: '#94a3b8', fontWeight: 500, marginBottom: '0.5rem' }}>Search for your next role</p>
                  <p style={{ color: '#475569', fontSize: '0.82rem' }}>
                    Enter a job title or skills above — we'll fetch live Swedish listings and AI-rank them against your profile.
                  </p>
                </div>
              )}

              {jobs.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {jobs.length} job{jobs.length !== 1 ? 's' : ''} · sorted by AI match score
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {jobs
                      .slice()
                      .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
                      .map(job => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onGenerate={async (id) => {
                            await handleGenerate(id)
                          }}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDelete}
                        />
                      ))}
                  </div>
                </>
              )}
            </div>

            {/* Right: tracker */}
            <TrackerPanel jobs={trackedJobs} onStatusChange={handleStatusChange} />
          </div>
        </div>
      </div>

      {/* Generate modal */}
      {modalJob && (
        <GenerateModal
          job={modalJob}
          onClose={() => setModalJob(null)}
        />
      )}
    </div>
  )
}
