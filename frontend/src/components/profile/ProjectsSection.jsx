import { nanoid } from './utils'
import SectionCard from './SectionCard'

const blank = () => ({
  _id: nanoid(),
  name: '', description: '', technologies: '',
  url: '', repo_url: '', start_date: '', end_date: '',
})

const IS = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#e2e8f0' }
const inp = "w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition placeholder:text-zinc-600"
const lbl = "block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5"

function ProjectEntry({ project, idx, onChange, onRemove }) {
  function set(field, value) { onChange({ ...project, [field]: value }) }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(34,211,238,0.06)' }}>
        <div className="w-1.5 h-5 rounded-full bg-cyan-500 shrink-0" />
        <span className="text-xs font-semibold text-zinc-400">Project {idx + 1}</span>
        <button onClick={onRemove} className="ml-auto p-1.5 text-zinc-600 hover:text-red-400 rounded-lg transition" title="Remove">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={lbl}>Project Name *</label>
          <input className={inp} style={IS} value={project.name} placeholder="Personal portfolio site" onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Start Date</label>
          <input type="date" className={inp} style={IS} value={project.start_date || ''} onChange={(e) => set('start_date', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>End Date</label>
          <input type="date" className={inp} style={IS} value={project.end_date || ''} onChange={(e) => set('end_date', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Live URL</label>
          <input className={inp} style={IS} value={project.url || ''} placeholder="https://..." onChange={(e) => set('url', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Repo URL</label>
          <input className={inp} style={IS} value={project.repo_url || ''} placeholder="https://github.com/..." onChange={(e) => set('repo_url', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Technologies</label>
          <input className={inp} style={IS} value={project.technologies || ''} placeholder="React, FastAPI, PostgreSQL" onChange={(e) => set('technologies', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Description</label>
          <textarea className={`${inp} resize-y`} style={IS} rows={2} value={project.description || ''}
            placeholder="What it does, your role, notable outcomes..." onChange={(e) => set('description', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

export default function ProjectsSection({ projects, onChange }) {
  function add() { onChange([...projects, blank()]) }
  function update(idx, project) { const u = [...projects]; u[idx] = project; onChange(u) }
  function remove(idx) { onChange(projects.filter((_, i) => i !== idx)) }

  return (
    <SectionCard
      title="Personal Projects"
      iconPath="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      accentClass="bg-cyan-500/20 text-cyan-400"
      action={
        <button onClick={add} className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg transition"
          style={{ background: 'rgba(34,211,238,0.10)' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Project
        </button>
      }
    >
      {projects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-zinc-600">No personal projects yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project, i) => (
            <ProjectEntry key={project._id || i} project={project} idx={i} onChange={(p) => update(i, p)} onRemove={() => remove(i)} />
          ))}
        </div>
      )}
    </SectionCard>
  )
}
