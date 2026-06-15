const STATUS_ORDER = ['applied', 'saved', 'rejected']
const STATUS_LABEL = { applied: 'Applied', saved: 'Saved', rejected: 'Rejected' }
const STATUS_COLOR = {
  applied: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', text: '#4ade80' },
  saved:   { bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)', text: '#fde047' },
  rejected:{ bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', text: '#f87171' },
}

export default function TrackerPanel({ jobs, onStatusChange }) {
  const tracked = jobs.filter(j => j.status !== 'new')
  const grouped = {}
  for (const s of STATUS_ORDER) grouped[s] = tracked.filter(j => j.status === s)

  return (
    <div style={{
      background: 'var(--bg-card-dim)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--border-dim)',
      borderRadius: '1.25rem', padding: '1.25rem',
      position: 'sticky', top: '5rem',
      maxHeight: 'calc(100vh - 7rem)', overflowY: 'auto',
    }}>
      <h2 style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1rem' }}>
        Application Tracker
      </h2>

      {tracked.length === 0 && (
        <p style={{ color: 'var(--text-faint)', fontSize: '0.78rem', textAlign: 'center', marginTop: '2rem' }}>
          No tracked applications yet.<br />Save or apply to a job to track it here.
        </p>
      )}

      {STATUS_ORDER.map(status => {
        const list = grouped[status]
        if (list.length === 0) return null
        const c = STATUS_COLOR[status]
        return (
          <div key={status} style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{
                background: c.bg, border: `1px solid ${c.border}`,
                color: c.text, borderRadius: '999px', padding: '1px 8px',
                fontSize: '0.7rem', fontWeight: 700,
              }}>
                {STATUS_LABEL[status]}
              </span>
              <span style={{ color: 'var(--text-faint)', fontSize: '0.7rem' }}>{list.length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {list.map(job => (
                <div key={job.id} style={{
                  background: 'var(--bg-card-dim)',
                  border: '1px solid var(--border-faint)',
                  borderRadius: '0.625rem', padding: '0.5rem 0.75rem',
                }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 500, margin: '0 0 1px' }}>{job.title}</p>
                  {job.company && <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0 }}>{job.company}</p>}
                  {status === 'applied' && job.applied_at && (
                    <p style={{ color: 'var(--text-faint)', fontSize: '0.7rem', margin: '3px 0 0' }}>
                      {new Date(job.applied_at).toLocaleDateString()}
                    </p>
                  )}
                  <button
                    onClick={() => onStatusChange(job.id, 'new')}
                    style={{
                      background: 'none', border: 'none',
                      color: 'var(--text-faint)', fontSize: '0.7rem',
                      cursor: 'pointer', padding: 0, marginTop: '4px',
                    }}
                  >
                    ✕ remove from tracker
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
