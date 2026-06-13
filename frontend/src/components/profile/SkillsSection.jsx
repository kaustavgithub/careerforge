import { useState } from 'react'
import { nanoid } from './utils'
import SectionCard from './SectionCard'

const CATEGORIES = ['Technical', 'Language', 'Soft', 'Other']

const PILL = {
  Technical: 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20',
  Language:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20',
  Soft:      'bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20',
  Other:     'bg-zinc-700/40 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/60',
}

const CAT_DOT = {
  Technical: 'bg-blue-400', Language: 'bg-emerald-400', Soft: 'bg-violet-400', Other: 'bg-zinc-400',
}

const IS = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#e2e8f0' }

export default function SkillsSection({ skills, onChange }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Technical')

  function addSkill() {
    const trimmed = name.trim()
    if (!trimmed) return
    onChange([...skills, { _id: nanoid(), name: trimmed, category }])
    setName('')
  }

  function removeSkill(idx) { onChange(skills.filter((_, i) => i !== idx)) }

  function handleKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); addSkill() }
  }

  return (
    <SectionCard
      title="Skills"
      iconPath="M13 10V3L4 14h7v7l9-11h-7z"
      accentClass="bg-sky-500/20 text-sky-400"
    >
      <div className="flex gap-2 mb-5">
        <input
          className="flex-1 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition placeholder:text-zinc-600"
          style={IS}
          placeholder="Type a skill and press Enter…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKey}
        />
        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-full appearance-none rounded-xl pl-7 pr-8 py-2.5 text-sm focus:outline-none transition cursor-pointer"
            style={IS}
          >
            {CATEGORIES.map((c) => <option key={c} style={{ background: '#1a1b2e' }}>{c}</option>)}
          </select>
          <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none ${CAT_DOT[category]}`} />
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <button onClick={addSkill}
          className="px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5"
          style={{ background: 'rgba(14,165,233,0.7)' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      {skills.length === 0 ? (
        <p className="text-sm text-zinc-600 text-center py-4">No skills yet — type above and press Add</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, i) => (
            <span key={skill._id || i}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${PILL[skill.category] || PILL.Other}`}>
              {skill.name}
              <button onClick={() => removeSkill(i)} className="ml-0.5 opacity-40 hover:opacity-100 transition">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
