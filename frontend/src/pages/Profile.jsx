import { useRef, useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import ProfileView from '../components/profile/ProfileView'
import { nanoid } from '../components/profile/utils'
import CertSection from '../components/profile/CertSection'
import EducationSection from '../components/profile/EducationSection'
import PersonalSection from '../components/profile/PersonalSection'
import ProjectsSection from '../components/profile/ProjectsSection'
import SkillsSection from '../components/profile/SkillsSection'
import WorkSection from '../components/profile/WorkSection'

const emptyProfile = {
  headline: '',
  summary: '',
  phone: '',
  location: '',
  linkedin_url: '',
  github_url: '',
  website_url: '',
  work_experiences: [],
  educations: [],
  skills: [],
  certifications: [],
  projects: [],
}

const CV_PARSE_PROMPT = `Parse the following CV and return ONLY a valid JSON object (no explanations, no markdown, just raw JSON) with this exact structure:

{
  "headline": "Professional headline or job title",
  "summary": "2-3 sentence professional summary",
  "phone": "Phone number with country code",
  "location": "City, Country",
  "linkedin_url": "https://linkedin.com/in/...",
  "github_url": "https://github.com/...",
  "website_url": "https://...",
  "work_experiences": [
    {
      "company": "Company name",
      "title": "Job title",
      "location": "City, Country",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "is_current": false,
      "description": "Key responsibilities and achievements"
    }
  ],
  "educations": [
    {
      "institution": "University or school name",
      "degree": "e.g. B.Tech, M.Sc, MBA",
      "field_of_study": "Subject area",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "grade": "GPA or percentage",
      "description": "Thesis, awards, activities"
    }
  ],
  "skills": [
    { "name": "Skill name", "category": "Technical" }
  ],
  "certifications": [
    {
      "name": "Certificate name",
      "issuer": "Issuing organization",
      "issue_date": "YYYY-MM-DD",
      "expiry_date": "YYYY-MM-DD",
      "url": "https://..."
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "What it does, your role, notable outcomes",
      "technologies": "React, FastAPI, PostgreSQL",
      "url": "https://...",
      "repo_url": "https://github.com/...",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD"
    }
  ]
}

Rules:
- Use null for any missing or unknown values
- Skill category must be one of: Technical, Language, Soft, Other
- Include every entry from a "Personal Projects" / "Projects" / "Side Projects" section under "projects" — these are separate from work_experiences
- Dates must be YYYY-MM-DD format or null

Here is my CV text:
[PASTE YOUR CV TEXT HERE]`

function mapParsedToProfile(data) {
  const result = { ...emptyProfile }
  for (const key of ['headline', 'summary', 'phone', 'location', 'linkedin_url', 'github_url', 'website_url']) {
    if (data[key] != null) result[key] = data[key]
  }
  if (Array.isArray(data.work_experiences)) {
    result.work_experiences = data.work_experiences.map((e) => ({ ...e, _id: nanoid() }))
  }
  if (Array.isArray(data.educations)) {
    result.educations = data.educations.map((e) => ({ ...e, _id: nanoid() }))
  }
  if (Array.isArray(data.skills)) {
    result.skills = data.skills.map((e) => ({ ...e, _id: nanoid() }))
  }
  if (Array.isArray(data.certifications)) {
    result.certifications = data.certifications.map((e) => ({ ...e, _id: nanoid() }))
  }
  if (Array.isArray(data.projects)) {
    result.projects = data.projects.map((e) => ({ ...e, _id: nanoid() }))
  }
  return result
}

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editMode, setEditMode] = useState('upload') // 'upload' | 'paste' | 'manual'
  const [draft, setDraft] = useState(emptyProfile)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)

  // Upload mode
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Paste mode
  const [pastedText, setPastedText] = useState('')
  const [promptCopied, setPromptCopied] = useState(false)

  // Shared import feedback
  const [importMsg, setImportMsg] = useState(null)

  // View mode
  const [copyMsg, setCopyMsg] = useState(false)

  useEffect(() => {
    api.get('/profile')
      .then((res) => setProfile({ ...emptyProfile, ...res.data }))
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  function startEditing() {
    setDraft({ ...profile })
    setIsEditing(true)
    setEditMode('upload')
    setSelectedFile(null)
    setPastedText('')
    setImportMsg(null)
    setSaveMsg(null)
  }

  function cancelEditing() {
    setIsEditing(false)
    setDraft(emptyProfile)
    setSelectedFile(null)
    setPastedText('')
    setImportMsg(null)
    setSaveMsg(null)
  }

  function switchMode(mode) {
    setEditMode(mode)
    setImportMsg(null)
    setSelectedFile(null)
    setPastedText('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await api.put('/profile', draft)
      const saved = { ...emptyProfile, ...res.data }
      setProfile(saved)
      setDraft(saved)
      setSaveMsg('Profile saved successfully!')
      setTimeout(() => {
        setSaveMsg(null)
        setIsEditing(false)
        setDraft(emptyProfile)
      }, 1500)
    } catch {
      setSaveMsg('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleParseUpload() {
    if (!selectedFile) return
    setUploading(true)
    setImportMsg(null)
    const formData = new FormData()
    formData.append('file', selectedFile)
    try {
      const res = await api.post('/cv/parse', formData)
      setDraft(mapParsedToProfile(res.data))
      setImportMsg({ ok: true, text: 'CV parsed with AI. Review the form below and save.' })
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      setImportMsg({ ok: false, text: 'Failed to parse CV. Check your API key or try another file.' })
    } finally {
      setUploading(false)
    }
  }

  function handleParsePaste() {
    setImportMsg(null)
    const trimmed = pastedText.trim()
    if (!trimmed) {
      setImportMsg({ ok: false, text: 'Nothing pasted yet — paste the JSON output from your AI chat first.' })
      return
    }
    // Strip markdown code fences if present
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
    const jsonStr = fenceMatch ? fenceMatch[1].trim() : trimmed
    try {
      const data = JSON.parse(jsonStr)
      setDraft(mapParsedToProfile(data))
      setImportMsg({ ok: true, text: 'Profile imported! Review the form below and save.' })
      setPastedText('')
    } catch {
      setImportMsg({ ok: false, text: 'Could not parse JSON. Make sure you paste the raw JSON your AI chat returned.' })
    }
  }

  function handleCopyPrompt() {
    navigator.clipboard.writeText(CV_PARSE_PROMPT).then(() => {
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 2500)
    })
  }

  async function handleDownload(format) {
    try {
      const res = await api.get(`/cv/generate?format=${format}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `CV.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Download failed. Please try again.')
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/u/${user?.id}`).then(() => {
      setCopyMsg(true)
      setTimeout(() => setCopyMsg(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
        <div className="max-w-3xl mx-auto px-4 py-12 text-red-400">{error}</div>
      </div>
    )
  }

  const glassBar = {
    background: 'var(--nav-bg)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--nav-border)',
  }
  const glassBtn = { background: 'var(--btn-glass-bg)', border: '1px solid var(--btn-glass-border)' }
  const IS = { background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--input-color)' }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>

      {/* ── VIEW MODE ──────────────────────────────────────────── */}
      {!isEditing && (
        <>
          {/* Profile action strip */}
          <div className="px-4 py-2" style={{ background: 'var(--bg-card-dim)', borderBottom: '1px solid var(--border-faint)' }}>
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-end gap-2">
              <button onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
                style={{ ...glassBtn, color: 'var(--text-secondary)' }}>
                {copyMsg
                  ? <span className="text-emerald-400">✓ Copied!</span>
                  : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>Share</>
                }
              </button>
              <button onClick={() => handleDownload('pdf')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
                style={{ ...glassBtn, color: 'var(--text-secondary)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                PDF
              </button>
              <button onClick={() => handleDownload('docx')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
                style={{ ...glassBtn, color: 'var(--text-secondary)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                DOCX
              </button>
              <button onClick={startEditing}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white transition"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 2px 12px rgba(99,102,241,0.35)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit Profile
              </button>
            </div>
          </div>

          {saveMsg && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-semibold shadow-2xl"
              style={saveMsg.includes('success')
                ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.30)', color: '#6ee7b7' }
                : { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
              {saveMsg.includes('success') ? '✓ ' : '✕ '}{saveMsg}
            </div>
          )}

          <ProfileView profile={profile} fullName={user?.full_name} />
        </>
      )}

      {/* ── EDIT MODE ──────────────────────────────────────────── */}
      {isEditing && (
        <>
          <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">
            {/* Edit header */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">Edit Profile</h2>
                <p className="text-sm text-zinc-600 mt-0.5">Changes apply when you click Save</p>
              </div>
              <div className="flex gap-2">
                <button onClick={cancelEditing}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white transition"
                  style={glassBtn}>Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </div>

            {saveMsg && (
              <div className="rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2"
                style={saveMsg.includes('success')
                  ? { background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.20)', color: '#6ee7b7' }
                  : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#fca5a5' }}>
                {saveMsg.includes('success') ? '✓' : '✕'} {saveMsg}
              </div>
            )}

            {/* Import method card */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Tabs */}
              <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {[
                  { key: 'upload', label: 'Upload CV',         icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
                  { key: 'paste',  label: 'Paste from AI',     icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                  { key: 'manual', label: 'Edit directly',     icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                ].map(({ key, label, icon }) => (
                  <button key={key} onClick={() => switchMode(key)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition"
                    style={editMode === key
                      ? { borderBottom: '2px solid #6366f1', color: '#a5b4fc', background: 'rgba(99,102,241,0.08)' }
                      : { borderBottom: '2px solid transparent', color: '#52525b' }}>
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              <div className="px-6 py-5">
                {importMsg && (
                  <div className="mb-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
                    style={importMsg.ok
                      ? { background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.20)', color: '#6ee7b7' }
                      : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#fca5a5' }}>
                    <span>{importMsg.ok ? '✓' : '✕'}</span><span>{importMsg.text}</span>
                  </div>
                )}

                {editMode === 'upload' && (
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-500">Upload your PDF or DOCX — your AI provider will extract your info automatically.</p>
                    <label htmlFor="cv-upload"
                      className="flex flex-col items-center justify-center gap-3 rounded-xl px-6 py-10 cursor-pointer transition"
                      style={selectedFile
                        ? { border: '2px dashed rgba(99,102,241,0.6)', background: 'rgba(99,102,241,0.08)' }
                        : { border: '2px dashed rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.02)' }}>
                      {selectedFile ? (
                        <>
                          <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm font-semibold text-indigo-300">{selectedFile.name}</p>
                          <p className="text-xs text-zinc-600">Click to change</p>
                        </>
                      ) : (
                        <>
                          <svg className="w-10 h-10 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <div className="text-center">
                            <span className="text-sm font-semibold text-indigo-400">Click to choose file</span>
                            <p className="text-xs text-zinc-600 mt-1">PDF or DOCX</p>
                          </div>
                        </>
                      )}
                    </label>
                    <input id="cv-upload" ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                      onChange={(e) => { setSelectedFile(e.target.files?.[0] || null); setImportMsg(null) }} />
                    <button onClick={handleParseUpload} disabled={!selectedFile || uploading}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-40 flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                      {uploading ? (
                        <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Parsing…</>
                      ) : 'Parse CV'}
                    </button>
                  </div>
                )}

                {editMode === 'paste' && (
                  <div className="space-y-4">
                    <div className="rounded-xl p-4 text-sm text-zinc-500 space-y-2"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p className="font-semibold text-zinc-300">How to use:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Copy the prompt below and open your AI chat tool (ChatGPT, Claude, Gemini, etc.)</li>
                        <li>Replace <code className="px-1 rounded text-xs text-zinc-400" style={{ background: 'rgba(255,255,255,0.08)' }}>[PASTE YOUR CV TEXT HERE]</code> with your CV</li>
                        <li>Send it, then copy the JSON output</li>
                        <li>Paste it below and click Parse</li>
                      </ol>
                      <button onClick={handleCopyPrompt}
                        className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-zinc-300 hover:text-white transition"
                        style={glassBtn}>
                        {promptCopied ? '✓ Prompt copied!' : <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>Copy prompt</>}
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Paste JSON output here</label>
                      <textarea rows={10} value={pastedText}
                        onChange={(e) => { setPastedText(e.target.value); setImportMsg(null) }}
                        placeholder={'{\n  "headline": "...",\n  "work_experiences": [...]\n}'}
                        className="w-full rounded-xl px-4 py-3 text-sm font-mono resize-y focus:outline-none"
                        style={IS} spellCheck={false} />
                    </div>
                    <button onClick={handleParsePaste} disabled={!pastedText.trim()}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Parse</button>
                  </div>
                )}

                {editMode === 'manual' && (
                  <p className="text-sm text-zinc-500">Fill in your information directly using the form below.</p>
                )}
              </div>
            </div>

            {/* Form sections */}
            <PersonalSection profile={draft} onChange={setDraft} />
            <WorkSection experiences={draft.work_experiences} onChange={(work_experiences) => setDraft((p) => ({ ...p, work_experiences }))} />
            <EducationSection educations={draft.educations} onChange={(educations) => setDraft((p) => ({ ...p, educations }))} />
            <SkillsSection skills={draft.skills} onChange={(skills) => setDraft((p) => ({ ...p, skills }))} />
            <ProjectsSection projects={draft.projects} onChange={(projects) => setDraft((p) => ({ ...p, projects }))} />
            <CertSection certifications={draft.certifications} onChange={(certifications) => setDraft((p) => ({ ...p, certifications }))} />

            <div className="flex justify-between pb-8">
              <button onClick={cancelEditing}
                className="px-6 py-3 rounded-xl font-semibold text-zinc-300 hover:text-white transition"
                style={glassBtn}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-8 py-3 rounded-xl font-bold text-white transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.30)' }}>
                {saving ? 'Saving…' : 'Save All Changes'}
              </button>
            </div>
          </main>
        </>
      )}
    </div>
  )
}
