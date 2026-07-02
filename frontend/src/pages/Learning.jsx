import { useEffect, useState } from 'react'
import api from '../api/client'
import SkillGapCard from '../components/learning/SkillGapCard'
import LearnModal from '../components/learning/LearnModal'
import { useAISettings } from '../context/AISettingsContext'

export default function Learning() {
  const { aiConfigured } = useAISettings()
  const [gaps, setGaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/learning/skill-gaps')
      setGaps(data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to load skill gaps.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    setRefreshMsg(null)
    try {
      const { data } = await api.post('/learning/refresh-skill-gaps')
      setRefreshMsg(data.updated > 0 ? `Found ${data.updated} skill gaps from your saved jobs.` : 'No skill gaps found — save some jobs first.')
      await load()
    } catch (e) {
      setRefreshMsg(e?.response?.data?.detail || 'Refresh failed.')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => { setPage(0) }, [gaps, pageSize])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{
              fontWeight: 800, fontSize: '1.6rem',
              background: 'linear-gradient(135deg, #818cf8, #c4b5fd)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              margin: '0 0 0.4rem',
            }}>
              Skills to learn
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              Skills identified from your saved jobs — click Refresh to recompute from your current saved job list.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              style={{
                background: refreshing ? 'rgba(129,140,248,0.2)' : 'rgba(129,140,248,0.15)',
                color: '#818cf8',
                border: '1px solid rgba(129,140,248,0.35)',
                borderRadius: '0.625rem',
                padding: '0.45rem 1rem',
                fontSize: '0.8rem', fontWeight: 600,
                cursor: refreshing || loading ? 'not-allowed' : 'pointer',
                opacity: refreshing || loading ? 0.6 : 1,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {refreshing ? 'Refreshing…' : '↻ Refresh'}
            </button>
            {refreshMsg && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', textAlign: 'right' }}>
                {refreshMsg}
              </span>
            )}
          </div>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                background: 'var(--bg-card-dim)',
                border: '1px solid var(--border-faint)',
                borderRadius: '1rem',
                height: '120px',
              }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            color: '#f87171',
            fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}

        {!loading && !error && gaps.length === 0 && (
          <div style={{
            background: 'var(--bg-card-dim)',
            border: '1px solid var(--border-dim)',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎯</div>
            <h3 style={{ color: 'var(--text-secondary)', fontWeight: 600, margin: '0 0 0.4rem' }}>No skill gaps found</h3>
            <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem', margin: '0 0 1.25rem' }}>
              Save jobs on the Jobs page, then click <strong style={{ color: 'var(--text-secondary)' }}>Refresh</strong> above to compute your skill gaps.
            </p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', border: 'none', borderRadius: '0.625rem',
                padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 600,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                opacity: refreshing ? 0.6 : 1,
              }}
            >
              {refreshing ? 'Refreshing…' : '↻ Refresh now'}
            </button>
          </div>
        )}

        {!loading && !error && gaps.length > 0 && (() => {
          const totalPages = Math.ceil(gaps.length / pageSize)
          const start = page * pageSize
          const visible = gaps.slice(start, start + pageSize)
          return (
            <>
              {/* Per-page selector + count */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>
                  Showing <strong style={{ color: 'var(--text-secondary)' }}>{start + 1}–{Math.min(start + pageSize, gaps.length)}</strong> of <strong style={{ color: 'var(--text-secondary)' }}>{gaps.length}</strong> skill gaps
                </span>
                <div style={{ display: 'inline-flex', background: 'var(--bg-card-dim)', border: '1px solid var(--border-dim)', borderRadius: '0.5rem', padding: '0.15rem', gap: '0.15rem' }}>
                  {[10, 20].map(n => (
                    <button
                      key={n}
                      onClick={() => setPageSize(n)}
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '0.35rem',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: pageSize === n ? '#818cf8' : 'transparent',
                        color: pageSize === n ? '#fff' : 'var(--text-muted)',
                        transition: 'background 0.15s',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {visible.map((gap, i) => (
                  <SkillGapCard
                    key={gap.skill}
                    gap={gap}
                    rank={start + i + 1}
                    onLearn={g => setSelected({ skill: g.skill, jobs: g.jobs })}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    style={{
                      padding: '0.4rem 1rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
                      border: '1px solid var(--border)', cursor: page === 0 ? 'not-allowed' : 'pointer',
                      background: 'var(--bg-card-dim)', color: page === 0 ? 'var(--text-faint)' : 'var(--text-secondary)',
                      opacity: page === 0 ? 0.5 : 1,
                    }}
                  >
                    ← Prev
                  </button>

                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {Array.from({ length: totalPages }, (_, i) => i).map(i => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        style={{
                          width: 32, height: 32, borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
                          border: '1px solid var(--border)', cursor: 'pointer',
                          background: page === i ? '#818cf8' : 'var(--bg-card-dim)',
                          color: page === i ? '#fff' : 'var(--text-muted)',
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                    style={{
                      padding: '0.4rem 1rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
                      border: '1px solid var(--border)', cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
                      background: 'var(--bg-card-dim)', color: page === totalPages - 1 ? 'var(--text-faint)' : 'var(--text-secondary)',
                      opacity: page === totalPages - 1 ? 0.5 : 1,
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )
        })()}
      </div>

      {selected && (
        <LearnModal
          skill={selected.skill}
          jobs={selected.jobs}
          aiConfigured={aiConfigured}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
