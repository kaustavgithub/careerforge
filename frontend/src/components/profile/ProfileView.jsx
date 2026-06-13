import { useEffect, useRef, useState } from 'react'

function formatDate(d) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function abbr(name) {
  return (name || '??').split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const PILL = {
  Technical: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  Language:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  Soft:      'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  Other:     'bg-zinc-700/40 text-zinc-400 border border-zinc-700/50',
}

/* Reveals children when they scroll into view */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVis(true); obs.disconnect() } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}>
      {children}
    </div>
  )
}

function SectionHeading({ label, color = '#818cf8' }) {
  return (
    <p style={{ color, fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '2.5rem' }}>
      {label}
    </p>
  )
}

/* Glass panel used across sections */
function Glass({ children, className = '', style = {} }) {
  return (
    <div className={className} style={{
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '1.25rem',
      ...style,
    }}>
      {children}
    </div>
  )
}

export default function ProfileView({ profile, fullName }) {
  const initials = abbr(fullName)

  const skillsByCategory = profile.skills.reduce((acc, s) => {
    const c = s.category || 'Other';
    (acc[c] = acc[c] || []).push(s)
    return acc
  }, {})

  const isEmpty =
    !profile.headline && !profile.summary &&
    !profile.work_experiences.length && !profile.educations.length &&
    !profile.skills.length && !profile.certifications.length

  const stats = [
    profile.work_experiences.length > 0 && { n: profile.work_experiences.length, label: 'Roles' },
    profile.skills.length > 0            && { n: profile.skills.length,            label: 'Skills' },
    profile.certifications.length > 0    && { n: profile.certifications.length,    label: 'Certs' },
    profile.educations.length > 0        && { n: profile.educations.length,        label: 'Degrees' },
  ].filter(Boolean)

  return (
    <div style={{ background: '#06070f', minHeight: '100vh' }}>

      {/* ══ HERO — full viewport width ══════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        {/* Background orbs */}
        <div className="absolute pointer-events-none" style={{ top: '-20%', left: '-10%', width: '70vw', height: '70vw', maxWidth: 800, maxHeight: 800, background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)', borderRadius: '50%' }} />
        <div className="absolute pointer-events-none" style={{ bottom: '-15%', right: '-10%', width: '55vw', height: '55vw', maxWidth: 650, maxHeight: 650, background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 65%)', borderRadius: '50%' }} />
        <div className="absolute pointer-events-none" style={{ top: '40%', right: '25%', width: '30vw', height: '30vw', maxWidth: 400, maxHeight: 400, background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)', borderRadius: '50%' }} />
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative w-full px-6 sm:px-16 lg:px-24 py-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

              {/* LEFT — text */}
              <div>
                {/* Available badge */}
                <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-xs font-bold text-emerald-400"
                  style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.20)' }}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px 2px rgba(52,211,153,0.55)' }} />
                  Open to opportunities
                </div>

                <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)', fontWeight: 900, color: '#fff', lineHeight: 0.93, letterSpacing: '-0.02em' }}>
                  {fullName || 'Your Name'}
                </h1>

                {profile.headline && (
                  <p className="mt-5 font-semibold" style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)', color: '#a5b4fc' }}>
                    {profile.headline}
                  </p>
                )}

                {(profile.location || profile.phone) && (
                  <div className="flex flex-wrap gap-5 mt-7">
                    {profile.location && (
                      <span className="flex items-center gap-2 text-sm text-zinc-500">
                        <svg className="w-4 h-4 text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {profile.location}
                      </span>
                    )}
                    {profile.phone && (
                      <span className="flex items-center gap-2 text-sm text-zinc-500">
                        <svg className="w-4 h-4 text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
                        </svg>
                        {profile.phone}
                      </span>
                    )}
                  </div>
                )}

                {/* Social + CTA */}
                <div className="flex flex-wrap gap-3 mt-9">
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-full transition"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                      LinkedIn
                    </a>
                  )}
                  {profile.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-full transition"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      GitHub
                    </a>
                  )}
                  {profile.website_url && (
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-full transition"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      Website
                    </a>
                  )}
                  <a href={`mailto:?subject=I'd love to connect with ${fullName || 'you'}`}
                    className="flex items-center gap-2 text-sm font-black text-white px-6 py-2.5 rounded-full transition"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 24px rgba(99,102,241,0.40)' }}>
                    Let's connect
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                </div>

                {/* Stats row */}
                {stats.length > 0 && (
                  <div className="flex flex-wrap gap-6 mt-12 pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    {stats.map(({ n, label }, i) => (
                      <div key={i}>
                        <p className="font-mono font-black text-white" style={{ fontSize: '2rem', lineHeight: 1 }}>{n}</p>
                        <p className="text-xs text-zinc-600 uppercase tracking-widest mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT — profile photo / avatar */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  {/* Glow behind avatar */}
                  <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(99,102,241,0.3) 0%, transparent 70%)', filter: 'blur(40px)', transform: 'scale(1.2)' }} />
                  {profile.photo_url ? (
                    <img src={profile.photo_url} alt={fullName}
                      className="relative rounded-3xl object-cover"
                      style={{ width: 'clamp(240px, 30vw, 400px)', height: 'clamp(240px, 30vw, 400px)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                  ) : null}
                  <div className="relative rounded-3xl flex items-center justify-center select-none"
                    style={{
                      display: profile.photo_url ? 'none' : 'flex',
                      width: 'clamp(240px, 30vw, 400px)',
                      height: 'clamp(240px, 30vw, 400px)',
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.3) 100%)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
                      fontSize: 'clamp(3rem, 8vw, 6rem)',
                      fontWeight: 900,
                      color: 'rgba(255,255,255,0.7)',
                    }}>
                    {initials}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-700">
          <p className="text-xs uppercase tracking-widest">Scroll</p>
          <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ══ EMPTY STATE ════════════════════════════════════════════ */}
      {isEmpty && (
        <section className="px-6 py-32 text-center">
          <p className="text-4xl mb-4 select-none">✦</p>
          <p className="text-xl font-bold text-zinc-400">Profile coming soon</p>
          <p className="text-sm text-zinc-600 mt-2">Click "Edit Profile" to add your information</p>
        </section>
      )}

      {/* ══ ABOUT ══════════════════════════════════════════════════ */}
      {profile.summary && (
        <section className="px-6 sm:px-16 lg:px-24 py-24" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <SectionHeading label="About" />
              <p style={{ fontSize: 'clamp(1.2rem, 2.5vw, 2rem)', color: '#94a3b8', lineHeight: 1.65, fontWeight: 500, maxWidth: '70ch' }}>
                {profile.summary}
              </p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ══ EXPERIENCE — scroll-reveal one at a time ════════════════ */}
      {profile.work_experiences.length > 0 && (
        <section className="px-6 sm:px-16 lg:px-24 py-24" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <SectionHeading label="Experience" />
            </Reveal>

            <div className="space-y-8">
              {profile.work_experiences.map((exp, i) => (
                <Reveal key={exp.id || i} delay={i * 80}>
                  <Glass style={{ overflow: 'hidden' }}>
                    {/* Top accent bar */}
                    <div style={{ height: 3, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, transparent)' }} />
                    <div className="p-8 sm:p-10">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                        {/* Company logo */}
                        <div className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-indigo-300 select-none"
                          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.20)', fontSize: '1rem' }}>
                          {abbr(exp.company)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <h3 className="font-black text-white" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.5rem)' }}>{exp.title}</h3>
                              <p className="mt-1 font-semibold text-indigo-400">
                                {exp.company}
                                {exp.location && <span className="text-zinc-600 font-normal"> · {exp.location}</span>}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className="font-mono text-xs text-zinc-500 px-3 py-1.5 rounded-full"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                {formatDate(exp.start_date) || '?'} – {exp.is_current ? 'Present' : (formatDate(exp.end_date) || '?')}
                              </span>
                              {exp.is_current && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 px-3 py-1 rounded-full"
                                  style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)' }}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
                                  Current
                                </span>
                              )}
                            </div>
                          </div>

                          {exp.description && (
                            <p className="mt-5 text-zinc-400 leading-relaxed" style={{ fontSize: '0.925rem' }}>
                              {exp.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Glass>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ SKILLS ═════════════════════════════════════════════════ */}
      {profile.skills.length > 0 && (
        <section className="px-6 sm:px-16 lg:px-24 py-24 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 60%)' }} />
          <div className="max-w-7xl mx-auto relative">
            <Reveal>
              <SectionHeading label="Skills" color="#a5b4fc" />
              <div className="space-y-8">
                {Object.entries(skillsByCategory).map(([cat, catSkills], ci) => (
                  <Reveal key={cat} delay={ci * 60}>
                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-3">{cat}</p>
                    <div className="flex flex-wrap gap-2">
                      {catSkills.map((skill, i) => (
                        <span key={skill.id || i}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold ${PILL[cat] || PILL.Other}`}>
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ══ EDUCATION ══════════════════════════════════════════════ */}
      {profile.educations.length > 0 && (
        <section className="px-6 sm:px-16 lg:px-24 py-24" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <SectionHeading label="Education" color="#c4b5fd" />
            </Reveal>
            <div className="space-y-5">
              {profile.educations.map((edu, i) => (
                <Reveal key={edu.id || i} delay={i * 80}>
                  <Glass className="group">
                    <div className="p-6 sm:p-8 flex items-start gap-5">
                      <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black text-violet-300 select-none"
                        style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.20)', fontSize: '0.85rem' }}>
                        {abbr(edu.institution)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black text-zinc-200">{edu.institution}</h3>
                            {(edu.degree || edu.field_of_study) && (
                              <p className="text-sm text-zinc-500 mt-0.5">
                                {[edu.degree, edu.field_of_study].filter(Boolean).join(' · ')}
                              </p>
                            )}
                            {edu.grade && <p className="text-xs font-bold text-violet-400 mt-1">{edu.grade}</p>}
                          </div>
                          {(edu.start_date || edu.end_date) && (
                            <span className="font-mono text-xs text-zinc-600 px-3 py-1.5 rounded-full shrink-0"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                              {formatDate(edu.start_date)}{edu.end_date && ` – ${formatDate(edu.end_date)}`}
                            </span>
                          )}
                        </div>
                        {edu.description && (
                          <p className="text-sm text-zinc-500 mt-3 leading-relaxed">{edu.description}</p>
                        )}
                      </div>
                    </div>
                  </Glass>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ CERTIFICATIONS ═════════════════════════════════════════ */}
      {profile.certifications.length > 0 && (
        <section className="px-6 sm:px-16 lg:px-24 py-24" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <SectionHeading label="Certifications" color="#fbbf24" />
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {profile.certifications.map((cert, i) => (
                <Reveal key={cert.id || i} delay={i * 60}>
                  <Glass className="h-full p-6 flex flex-col">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)' }}>
                      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-zinc-200 text-sm leading-snug">{cert.name}</h3>
                    {cert.issuer && <p className="text-xs text-zinc-500 mt-1">{cert.issuer}</p>}
                    {cert.issue_date && (
                      <p className="font-mono text-xs text-zinc-600 mt-2">
                        {formatDate(cert.issue_date)}
                        {cert.expiry_date && <span> → {formatDate(cert.expiry_date)}</span>}
                      </p>
                    )}
                    {cert.url && (
                      <a href={cert.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 mt-auto pt-3 transition">
                        View credential
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </Glass>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="px-6 py-10 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-xs text-zinc-700">Built with CareerForge</p>
      </div>
    </div>
  )
}
