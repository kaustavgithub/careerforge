import { useEffect, useState } from 'react'
import api from '../api/client'
import Navbar from '../components/Navbar'
import SkillGapCard from '../components/learning/SkillGapCard'
import LearnModal from '../components/learning/LearnModal'
import { useAISettings } from '../context/AISettingsContext'

export default function Learning() {
  const { aiConfigured } = useAISettings()
  const [gaps, setGaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
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
    load()
  }, [])

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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            Skills identified across your saved job listings — sorted by importance (frequency × avg job score).
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
