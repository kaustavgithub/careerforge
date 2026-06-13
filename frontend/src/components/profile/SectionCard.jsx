export default function SectionCard({ title, iconPath, accentClass = 'bg-indigo-500/20 text-indigo-400', children, action }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2.5">
          {iconPath && (
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${accentClass}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
              </svg>
            </span>
          )}
          <h3 className="font-semibold text-zinc-200 text-sm">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}
