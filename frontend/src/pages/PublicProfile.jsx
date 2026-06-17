import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import ProfileView from '../components/profile/ProfileView'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const emptyProfile = {
  headline: '', summary: '', phone: '', location: '',
  linkedin_url: '', github_url: '', website_url: '', photo_url: '',
  work_experiences: [], educations: [], skills: [], certifications: [],
}

export default function PublicProfile() {
  const { userId } = useParams()
  const [profile, setProfile] = useState(null)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    axios
      .get(`${BASE_URL}/profile/public/${userId}`)
      .then((res) => {
        const { full_name, ...profileData } = res.data
        setFullName(full_name)
        setProfile({ ...emptyProfile, ...profileData })
      })
      .catch((err) => { if (err.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <div className="min-h-screen" style={{ background: '#06070f' }}>
      {/* Minimal public navbar */}
      <nav className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(6,7,15,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="CareerForge" className="w-7 h-7 rounded-lg" />
          <span className="text-sm font-bold text-white">CareerForge</span>
        </Link>
        <Link to="/login"
          className="text-xs font-semibold text-zinc-400 hover:text-white px-4 py-1.5 rounded-xl transition"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          Sign in
        </Link>
      </nav>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      )}

      {!loading && notFound && (
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <div className="text-5xl mb-5 select-none text-zinc-700">✦</div>
          <p className="text-xl font-bold text-zinc-400">Profile not found</p>
          <p className="text-sm text-zinc-600 mt-2">This profile may not exist or hasn't been set up yet.</p>
          <Link to="/login"
            className="mt-8 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.30)' }}>
            Create your own
          </Link>
        </div>
      )}

      {!loading && profile && (
        <ProfileView profile={profile} fullName={fullName} />
      )}
    </div>
  )
}
