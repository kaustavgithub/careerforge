import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  async function handleParse() {
    if (!file) return
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post('/cv/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate('/profile')
    } catch (err) {
      setError(err.response?.data?.detail || 'Parsing failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#06070f' }}>
      {/* Ambient orbs */}
      <div className="absolute top-0 left-1/4 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 65%)' }} />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)' }} />

      <Navbar />

      <main className="relative max-w-2xl mx-auto px-4 py-14">
        {/* Greeting */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-400 mb-2">Welcome back</p>
          <h2 className="text-4xl font-black text-white">{user?.full_name}</h2>
          <p className="text-zinc-500 mt-2 text-sm">
            Upload your CV to auto-fill your profile, or{' '}
            <button onClick={() => navigate('/profile')} className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
              build it from scratch
            </button>
            .
          </p>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className="rounded-2xl p-12 text-center cursor-pointer transition-all duration-200"
          style={{
            background: dragging
              ? 'rgba(99,102,241,0.12)'
              : 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: dragging
              ? '2px dashed rgba(99,102,241,0.7)'
              : '2px dashed rgba(255,255,255,0.10)',
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.doc"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />

          {file ? (
            <div>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-bold text-white text-lg">{file.name}</p>
              <p className="text-zinc-500 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
            </div>
          ) : (
            <div>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
                <svg className="w-7 h-7 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className="font-bold text-zinc-300 text-lg">Drop your CV here</p>
              <p className="text-zinc-600 text-sm mt-1">or click to browse — PDF or DOCX</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-xl px-4 py-3 text-sm text-red-300"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
            {error}
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={handleParse}
            disabled={!file || loading}
            className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 24px rgba(99,102,241,0.30)' }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Analysing with Claude AI…
              </>
            ) : '✨ Parse CV with Claude AI'}
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-3.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white transition"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Go to Profile
          </button>
        </div>

        {loading && (
          <p className="text-center text-xs text-zinc-600 mt-4">
            Claude is reading your CV and extracting your experience, education, and skills…
          </p>
        )}
      </main>
    </div>
  )
}
