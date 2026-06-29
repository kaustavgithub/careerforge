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

  useEffect(() => { load() }, [])

  useEffect(() => { setPage(0) }, [gaps, pageSize])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontWeight: 800, fontSize: '1.6rem',
            background: 'linear-gradient(135deg, #818cf8, #c4b5fd)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            margin: '0 0 0.4rem',
          }}>
            Skills to learn
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            Skills identified across your scored job listings — updated automatically when you search or score jobs.
          </p>
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
            <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem', margin: 0 }}>
              Search for jobs on the Jobs page — skill gaps are built automatically as you score jobs.
            </p>
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
