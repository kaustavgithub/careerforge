import { nanoid } from './utils'
import SectionCard from './SectionCard'

const blank = () => ({
  _id: nanoid(),
  company: '', title: '', location: '',
  start_date: '', end_date: '', is_current: false, description: '',
})

const IS = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#e2e8f0' }
const inp = "w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition placeholder:text-zinc-600"
const lbl = "block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5"

function WorkEntry({ exp, idx, onChange, onRemove }) {
  function set(field, value) { onChange({ ...exp, [field]: value }) }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(99,102,241,0.06)' }}>
        <div className="w-1.5 h-5 rounded-full bg-indigo-500 shrink-0" />
        <span className="text-xs font-semibold text-zinc-400">Position {idx + 1}</span>
        <button onClick={onRemove} className="ml-auto p-1.5 text-zinc-600 hover:text-red-400 rounded-lg transition" title="Remove">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Job Title *</label>
          <input className={inp} style={IS} value={exp.title} placeholder="Software Engineer" onChange={(e) => set('title', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Company *</label>
          <input className={inp} style={IS} value={exp.company} placeholder="Acme Corp" onChange={(e) => set('company', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Location</label>
          <input className={inp} style={IS} value={exp.location || ''} placeholder="New York, NY" onChange={(e) => set('location', e.target.value)} />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input type="checkbox" id={`curr-${idx}`} checked={exp.is_current || false}
            onChange={(e) => set('is_current', e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-500" />
          <label htmlFor={`curr-${idx}`} className="text-sm text-zinc-400 cursor-pointer">Currently working here</label>
        </div>
        <div>
          <label className={lbl}>Start Date</label>
          <input type="date" className={inp} style={IS} value={exp.start_date || ''} onChange={(e) => set('start_date', e.target.value)} />
        </div>
        {!exp.is_current && (
          <div>
            <label className={lbl}>End Date</label>
            <input type="date" className={inp} style={IS} value={exp.end_date || ''} onChange={(e) => set('end_date', e.target.value)} />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className={lbl}>Description</label>
          <textarea className={`${inp} resize-y`} style={IS} rows={3} value={exp.description || ''}
            placeholder="Key responsibilities, achievements..." onChange={(e) => set('description', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

export default function WorkSection({ experiences, onChange }) {
  function add() { onChange([...experiences, blank()]) }
  function update(idx, exp) { const u = [...experiences]; u[idx] = exp; onChange(u) }
  function remove(idx) { onChange(experiences.filter((_, i) => i !== idx)) }

  return (
    <SectionCard
      title="Work Experience"
      iconPath="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      accentClass="bg-indigo-500/20 text-indigo-400"
      action={
        <button onClick={add} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg transition"
          style={{ background: 'rgba(99,102,241,0.10)' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Position
        </button>
      }
    >
      {experiences.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-zinc-600">No positions yet — click Add Position to start</p>
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp, i) => (
            <WorkEntry key={exp._id || i} exp={exp} idx={i} onChange={(e) => update(i, e)} onRemove={() => remove(i)} />
          ))}
        </div>
      )}
    </SectionCard>
  )
}
