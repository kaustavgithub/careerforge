import { useEffect, useState } from 'react'
import api from '../api/client'
import Navbar from '../components/Navbar'
import SkillGapCard from '../components/learning/SkillGapCard'
import LearnModal from '../components/learning/LearnModal'
import { useAISettings } from '../context/AISettingsContext'

export default function Learning() {
  const { settings, aiConfigured, refresh } = useAISettings()
  const [gaps, setGaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [switching, setSwitching] = useState(false)
  const useLocal = settings?.use_local_ai !== false

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/learning/skill-gaps')
      setGaps(data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to analyse skill gaps.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (settings) load()
  }, [settings])

  async function setMode(local) {
    if (local === useLocal || switching) return
    setSwitching(true)
    try {
      await api.patch('/settings/use-local-ai', { use_local_ai: local })
      await refresh()
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)' }}>
      <Navbar />

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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1rem' }}>
            Skills identified across your saved job listings — sorted by importance (frequency × avg job score).
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              display: 'inline-flex',
              background: 'var(--bg-card-dim)',
              border: '1px solid var(--border-dim)',
              borderRadius: '0.6rem',
              padding: '0.2rem',
              gap: '0.2rem',
            }}>
              <button
                onClick={() => setMode(true)}
                disabled={switching}
                style={{
                  padding: '0.35rem 0.8rem',
                  borderRadius: '0.45rem',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: switching ? 'default' : 'pointer',
                  background: useLocal ? '#818cf8' : 'transparent',
                  color: useLocal ? '#fff' : 'var(--text-muted)',
                }}
              >
                Local
              </button>
              <button
                onClick={() => setMode(false)}
                disabled={switching || !aiConfigured}
                title={!aiConfigured ? 'Add an API key in Settings to use AI mode' : ''}
                style={{
                  padding: '0.35rem 0.8rem',
                  borderRadius: '0.45rem',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: switching || !aiConfigured ? 'default' : 'pointer',
                  opacity: !aiConfigured ? 0.5 : 1,
                  background: !useLocal ? '#818cf8' : 'transparent',
                  color: !useLocal ? '#fff' : 'var(--text-muted)',
                }}
              >
                AI
              </button>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>
              {useLocal ? 'Fast keyword scan, no API usage' : 'Smarter analysis, uses your AI provider'}
            </span>
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
            <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem', margin: 0 }}>
              Search for jobs first — skill gaps are extracted from your saved job listings.
            </p>
          </div>
        )}

        {!loading && !error && gaps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {gaps.slice(0, 10).map((gap, i) => (
              <SkillGapCard
                key={gap.skill}
                gap={gap}
                rank={i + 1}
                onLearn={g => setSelected({ skill: g.skill, jobs: g.jobs })}
              />
            ))}
          </div>
        )}
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
