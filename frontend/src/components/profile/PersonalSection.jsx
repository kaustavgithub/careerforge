import SectionCard from './SectionCard'

const IS = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#e2e8f0' }
const inp = "w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition placeholder:text-zinc-600"
const iinp = "w-full rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:outline-none transition placeholder:text-zinc-600"
const lbl = "block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5"

function IconWrap({ children, icon }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={icon} />
        </svg>
      </span>
      {children}
    </div>
  )
}

export default function PersonalSection({ profile, onChange }) {
  function set(field, value) {
    onChange((p) => ({ ...p, [field]: value }))
  }

  return (
    <SectionCard
      title="Personal Information"
      iconPath="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      accentClass="bg-indigo-500/20 text-indigo-400"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={lbl}>Professional Headline</label>
          <IconWrap icon="M7 7h10M7 11h7M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16l-4-2-4 2-4-2-4 2z">
            <input className={iinp} style={IS} placeholder="e.g. Senior Software Engineer at Acme Corp"
              value={profile.headline || ''} onChange={(e) => set('headline', e.target.value)} />
          </IconWrap>
        </div>

        <div>
          <label className={lbl}>Phone</label>
          <IconWrap icon="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z">
            <input className={iinp} style={IS} placeholder="+1 555 000 0000"
              value={profile.phone || ''} onChange={(e) => set('phone', e.target.value)} />
          </IconWrap>
        </div>

        <div>
          <label className={lbl}>Location</label>
          <IconWrap icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z">
            <input className={iinp} style={IS} placeholder="City, Country"
              value={profile.location || ''} onChange={(e) => set('location', e.target.value)} />
          </IconWrap>
        </div>

        <div>
          <label className={lbl}>LinkedIn URL</label>
          <IconWrap icon="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1">
            <input className={iinp} style={IS} placeholder="https://linkedin.com/in/..."
              value={profile.linkedin_url || ''} onChange={(e) => set('linkedin_url', e.target.value)} />
          </IconWrap>
        </div>

        <div>
          <label className={lbl}>GitHub URL</label>
          <IconWrap icon="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4">
            <input className={iinp} style={IS} placeholder="https://github.com/..."
              value={profile.github_url || ''} onChange={(e) => set('github_url', e.target.value)} />
          </IconWrap>
        </div>

        <div className="sm:col-span-2">
          <label className={lbl}>Website</label>
          <IconWrap icon="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9">
            <input className={iinp} style={IS} placeholder="https://yoursite.com"
              value={profile.website_url || ''} onChange={(e) => set('website_url', e.target.value)} />
          </IconWrap>
        </div>

        <div className="sm:col-span-2">
          <label className={lbl}>Profile Photo URL</label>
          <IconWrap icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z">
            <input className={iinp} style={IS} placeholder="https://example.com/photo.jpg"
              value={profile.photo_url || ''} onChange={(e) => set('photo_url', e.target.value)} />
          </IconWrap>
          {profile.photo_url && (
            <div className="mt-2 flex items-center gap-3">
              <img src={profile.photo_url} alt="Preview"
                className="w-10 h-10 rounded-xl object-cover"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                onError={(e) => { e.target.style.display = 'none' }} />
              <span className="text-xs text-zinc-600">Preview</span>
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className={lbl}>Professional Summary</label>
          <textarea className={`${inp} resize-y`} style={IS} rows={4}
            placeholder="A brief summary of your background and career goals..."
            value={profile.summary || ''} onChange={(e) => set('summary', e.target.value)} />
        </div>
      </div>
    </SectionCard>
  )
}
