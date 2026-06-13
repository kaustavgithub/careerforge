import { nanoid } from './utils'
import SectionCard from './SectionCard'

const blank = () => ({
  _id: nanoid(),
  name: '', issuer: '', issue_date: '', expiry_date: '', url: '',
})

const IS = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#e2e8f0' }
const inp = "w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition placeholder:text-zinc-600"
const lbl = "block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5"

function CertEntry({ cert, idx, onChange, onRemove }) {
  function set(field, value) { onChange({ ...cert, [field]: value }) }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(245,158,11,0.06)' }}>
        <div className="w-1.5 h-5 rounded-full bg-amber-500 shrink-0" />
        <span className="text-xs font-semibold text-zinc-400">Certification {idx + 1}</span>
        <button onClick={onRemove} className="ml-auto p-1.5 text-zinc-600 hover:text-red-400 rounded-lg transition" title="Remove">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Certificate Name *</label>
          <input className={inp} style={IS} value={cert.name} placeholder="AWS Solutions Architect" onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Issuer</label>
          <input className={inp} style={IS} value={cert.issuer || ''} placeholder="Amazon Web Services" onChange={(e) => set('issuer', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Issue Date</label>
          <input type="date" className={inp} style={IS} value={cert.issue_date || ''} onChange={(e) => set('issue_date', e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Expiry Date</label>
          <input type="date" className={inp} style={IS} value={cert.expiry_date || ''} onChange={(e) => set('expiry_date', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Credential URL</label>
          <input className={inp} style={IS} value={cert.url || ''} placeholder="https://..." onChange={(e) => set('url', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

export default function CertSection({ certifications, onChange }) {
  function add() { onChange([...certifications, blank()]) }
  function update(idx, cert) { const u = [...certifications]; u[idx] = cert; onChange(u) }
  function remove(idx) { onChange(certifications.filter((_, i) => i !== idx)) }

  return (
    <SectionCard
      title="Certifications"
      iconPath="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
      accentClass="bg-amber-500/20 text-amber-400"
      action={
        <button onClick={add} className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg transition"
          style={{ background: 'rgba(245,158,11,0.10)' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Certificate
        </button>
      }
    >
      {certifications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-zinc-600">No certifications yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert, i) => (
            <CertEntry key={cert._id || i} cert={cert} idx={i} onChange={(c) => update(i, c)} onRemove={() => remove(i)} />
          ))}
        </div>
      )}
    </SectionCard>
  )
}
