const CATEGORY_COLOR = {
  Language: { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  Framework:{ bg: 'rgba(139,92,246,0.12)', text: '#c4b5fd', border: 'rgba(139,92,246,0.25)' },
  Tool:     { bg: 'rgba(59,130,246,0.12)',  text: '#93c5fd', border: 'rgba(59,130,246,0.25)' },
  Platform: { bg: 'rgba(20,184,166,0.12)', text: '#5eead4', border: 'rgba(20,184,166,0.25)' },
  Other:    { bg: 'var(--bg-card)',         text: 'var(--text-secondary)', border: 'var(--border)' },
}

function ScoreTag({ job }) {
  const color = job.score >= 80 ? '#4ade80' : job.score >= 60 ? '#fde047' : '#f87171'
  const bg    = job.score >= 80 ? 'rgba(34,197,94,0.1)' : job.score >= 60 ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)'
  return (
    <div style={{
      background: bg, border: `1px solid ${color}30`, borderRadius: '6px',
      padding: '2px 8px', fontSize: '0.7rem',
      display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '220px',
    }}>
      <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {job.title}
      </span>
      <span style={{ color, fontWeight: 700, flexShrink: 0 }}>{job.score}</span>
    </div>
  )
}

export default function SkillGapCard({ gap, rank, onLearn }) {
  const cat = CATEGORY_COLOR[gap.category] || CATEGORY_COLOR.Other

  return (
    <div style={{
      background: 'var(--bg-card)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--border)',
      borderRadius: '1rem', padding: '1.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-faint)', fontWeight: 700, fontSize: '0.72rem', minWidth: '1.5rem', textAlign: 'center' }}>
              #{rank}
            </span>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', margin: 0 }}>{gap.skill}</h3>
            <span style={{
              background: cat.bg, color: cat.text, border: `1px solid ${cat.border}`,
              borderRadius: '999px', padding: '1px 8px', fontSize: '0.68rem', fontWeight: 600,
            }}>{gap.category}</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#818cf8', fontWeight: 700, fontSize: '1.1rem' }}>{gap.frequency}</div>
              <div style={{ color: 'var(--text-faint)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>jobs</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#fde047', fontWeight: 700, fontSize: '1.1rem' }}>{gap.avg_job_score}</div>
              <div style={{ color: 'var(--text-faint)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>avg score</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#c4b5fd', fontWeight: 700, fontSize: '1.1rem' }}>{gap.gap_score}</div>
              <div style={{ color: 'var(--text-faint)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>gap score</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {gap.jobs.map((j, i) => <ScoreTag key={i} job={j} />)}
          </div>
        </div>

        <button
          onClick={() => onLearn(gap)}
          style={{
            flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', border: 'none', borderRadius: '8px',
            padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Learn ✦
        </button>
      </div>
    </div>
  )
}
