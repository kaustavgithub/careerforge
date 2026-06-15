export default function SectionCard({ title, iconPath, accentClass = 'bg-indigo-500/20 text-indigo-400', children, action }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border)',
      }}>
      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border-faint)', background: 'var(--bg-card-dim)' }}>
        <div className="flex items-center gap-2.5">
          {iconPath && (
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${accentClass}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
              </svg>
            </span>
          )}
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}
