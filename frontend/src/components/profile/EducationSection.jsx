import { nanoid } from './utils'
import SectionCard from './SectionCard'

const blank = () => ({
  _id: nanoid(),
  institution: '', degree: '', field_of_study: '',
  start_date: '', end_date: '', grade: '', description: '',
})

const IS = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#e2e8f0' }
const inp = "w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition placeholder:text-zinc-600"
const lbl = "block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5"

function EduEntry({ edu, idx, onChange, onRemove }) {
  function set(field, value) { onChange({ ...edu, [field]: value }) }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(139,92,246,0.06)' }}>
        <div className="w-1.5 h-5 rounded-full bg-violet-500 shrink-0" />
        <span className="text-xs font-semibold text-zinc-400">Education {idx + 1}</span>
        <button onClick={onRemove} className="ml-auto p-1.5 text-zinc-600 hover:text-red-400 rounded-lg transition" title="Remove">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={lbl}>Institution *</label>
          <input className={inp} style={IS} value={edu.institution} placeholder="MIT, Stanford, IIT..." onChange={(e) => set('institution', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Degree</label>
          <input className={inp} style={IS} value={edu.degree || ''} placeholder="B.Tech, M.Sc, MBA..." onChange={(e) => set('degree', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Field of Study</label>
          <input className={inp} style={IS} value={edu.field_of_study || ''} placeholder="Computer Science" onChange={(e) => set('field_of_study', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Start Date</label>
          <input type="date" className={inp} style={IS} value={edu.start_date || ''} onChange={(e) => set('start_date', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>End Date</label>
          <input type="date" className={inp} style={IS} value={edu.end_date || ''} onChange={(e) => set('end_date', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Grade / GPA</label>
          <input className={inp} style={IS} value={edu.grade || ''} placeholder="3.8 / 4.0, First Class..." onChange={(e) => set('grade', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Description</label>
          <textarea className={`${inp} resize-y`} style={IS} rows={2} value={edu.description || ''}
            placeholder="Awards, thesis, notable activities..." onChange={(e) => set('description', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

export default function EducationSection({ educations, onChange }) {
  function add() { onChange([...educations, blank()]) }
  function update(idx, edu) { const u = [...educations]; u[idx] = edu; onChange(u) }
  function remove(idx) { onChange(educations.filter((_, i) => i !== idx)) }

  return (
    <SectionCard
      title="Education"
      iconPath="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
      accentClass="bg-violet-500/20 text-violet-400"
      action={
        <button onClick={add} className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 px-3 py-1.5 rounded-lg transition"
          style={{ background: 'rgba(139,92,246,0.10)' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Education
        </button>
      }
    >
      {educations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-zinc-600">No education entries yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {educations.map((edu, i) => (
            <EduEntry key={edu._id || i} edu={edu} idx={i} onChange={(e) => update(i, e)} onRemove={() => remove(i)} />
          ))}
        </div>
      )}
    </SectionCard>
  )
}
