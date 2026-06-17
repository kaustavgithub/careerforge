import { useEffect, useState } from 'react'
import api from '../api/client'
import Navbar from '../components/Navbar'
import { useAISettings } from '../context/AISettingsContext'

const PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-api03-…', models: ['claude-sonnet-4-6', 'claude-opus-4-8', 'claude-haiku-4-5-20251001'] },
  { value: 'openai', label: 'OpenAI', placeholder: 'sk-…', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini'] },
  { value: 'gemini', label: 'Google Gemini', placeholder: 'AIza…', models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'] },
  { value: 'groq', label: 'Groq', placeholder: 'gsk_…', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'] },
]

const CUSTOM_MODEL = '__custom__'
const providerInfo = value => PROVIDERS.find(p => p.value === value) || PROVIDERS[0]

export default function Settings() {
  const { settings, refresh: refreshAiSettings } = useAISettings()
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [useLocalAi, setUseLocalAi] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [msg, setMsg] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const activeId = settings?.active_ai_config_id || null

  async function loadConfigs() {
    const { data } = await api.get('/ai-configs')
    setConfigs(data)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadConfigs(), api.get('/settings').then(r => setUseLocalAi(r.data.use_local_ai !== false))])
      .finally(() => setLoading(false))
  }, [])

  async function toggleLocalAi(value) {
    setUseLocalAi(value)
    await api.patch('/settings/use-local-ai', { use_local_ai: value })
    refreshAiSettings()
  }

  async function activate(id) {
    setBusyId(id)
    setMsg(null)
    try {
      await api.post(`/ai-configs/${id}/activate`)
      await refreshAiSettings()
    } catch {
      setMsg('Failed to activate that configuration.')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id) {
    setBusyId(id)
    setMsg(null)
    try {
      await api.delete(`/ai-configs/${id}`)
      await loadConfigs()
      await refreshAiSettings()
    } catch {
      setMsg('Failed to delete that configuration.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleCreated() {
    setShowAdd(false)
    await loadConfigs()
    await refreshAiSettings()
  }

  const sectionLabelStyle = {
    display: 'block', fontSize: '0.8rem', fontWeight: 600,
    color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)' }}>
      <Navbar />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontWeight: 800, fontSize: '1.6rem',
            background: 'linear-gradient(135deg, #818cf8, #c4b5fd)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            margin: '0 0 0.4rem',
          }}>
            Settings
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            Manage your AI provider keys and intelligence mode.
          </p>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-faint)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
            Loading…
          </div>
        ) : (
          <>
            {/* AI Configs Section */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ ...sectionLabelStyle, marginBottom: 0 }}>AI Configurations</label>
                <button
                  onClick={() => setShowAdd(v => !v)}
                  style={{
                    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.35)',
                    color: '#818cf8', borderRadius: '0.5rem', padding: '0.3rem 0.7rem',
                    fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {showAdd ? 'Cancel' : '+ Add'}
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-faint)', margin: '0 0 0.85rem' }}>
                Save as many provider + key + model combinations as you like, each under its own name.
                Pick one to make it active — that's the one used everywhere.
              </p>

              {showAdd && (
                <AddConfigForm
                  existingNames={configs.map(c => c.name)}
                  onCreated={handleCreated}
                />
              )}

              {msg && (
                <div style={{
                  padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem',
                  marginBottom: '0.75rem',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#f87171',
                }}>
                  {msg}
                </div>
              )}

              {configs.length === 0 && !showAdd && (
                <div style={{
                  background: 'var(--bg-card-dim)', border: '1px solid var(--border-dim)',
                  borderRadius: '0.85rem', padding: '1.5rem', textAlign: 'center',
                  color: 'var(--text-faint)', fontSize: '0.85rem',
                }}>
                  No AI configurations yet — add one to enable AI features.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {configs.map(c => {
                  const active = c.id === activeId
                  const info = providerInfo(c.provider)
                  return (
                    <div
                      key={c.id}
                      style={{
                        border: `1px solid ${active ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
                        background: active ? 'rgba(99,102,241,0.06)' : 'var(--bg-card-dim)',
                        borderRadius: '0.85rem',
                        padding: '0.8rem 1rem',
                        display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                          {active && (
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 700, color: '#818cf8',
                              background: 'rgba(99,102,241,0.12)', borderRadius: '999px',
                              padding: '0.1rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em',
                            }}>
                              Active
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>
                          {info.label}{c.model ? ` · ${c.model}` : ''}
                        </div>
                      </div>

                      {!active && (
                        <button
                          onClick={() => activate(c.id)}
                          disabled={busyId === c.id}
                          style={{
                            background: 'var(--btn-glass-bg)', border: '1px solid var(--btn-glass-border)',
                            color: 'var(--text-secondary)', borderRadius: '0.5rem', padding: '0.35rem 0.75rem',
                            fontSize: '0.78rem', cursor: busyId === c.id ? 'default' : 'pointer',
                          }}
                        >
                          Make active
                        </button>
                      )}
                      <button
                        onClick={() => remove(c.id)}
                        disabled={busyId === c.id}
                        title="Delete"
                        style={{
                          background: 'none', border: 'none', color: '#f87171',
                          cursor: busyId === c.id ? 'default' : 'pointer', fontSize: '0.95rem', padding: '0.2rem 0.4rem',
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* AI Mode Section */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={sectionLabelStyle}>Intelligence Mode</label>

              {[
                {
                  value: true,
                  title: 'Local where possible',
                  desc: 'Skill gap analysis and job ranking use fast local algorithms (free, no API calls). Only cover letters, tailored CVs, and learning plans use the API.',
                },
                {
                  value: false,
                  title: 'Use AI everywhere',
                  desc: 'Skill gap analysis uses your active AI provider for smarter results. All features use your API key — requires an active configuration.',
                },
              ].map(opt => (
                <div
                  key={String(opt.value)}
                  onClick={() => toggleLocalAi(opt.value)}
                  style={{
                    cursor: 'pointer',
                    border: `1px solid ${useLocalAi === opt.value ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
                    background: useLocalAi === opt.value ? 'rgba(99,102,241,0.08)' : 'var(--bg-card-dim)',
                    borderRadius: '0.75rem',
                    padding: '0.85rem 1rem',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                    border: `2px solid ${useLocalAi === opt.value ? '#818cf8' : 'var(--border)'}`,
                    background: useLocalAi === opt.value ? '#818cf8' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {useLocalAi === opt.value && (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {opt.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)', lineHeight: 1.5 }}>
                      {opt.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function AddConfigForm({ existingNames, onCreated }) {
  const [name, setName] = useState('')
  const [provider, setProvider] = useState('anthropic')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const info = providerInfo(provider)
  const isCustomModel = model === CUSTOM_MODEL

  const inputStyle = {
    width: '100%', padding: '0.55rem 0.8rem', borderRadius: '0.55rem',
    background: 'var(--input-bg)', border: '1px solid var(--input-border)',
    color: 'var(--input-color)', fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace',
  }
  const selectStyle = { ...inputStyle, fontFamily: 'inherit' }

  async function submit(e) {
    e.preventDefault()
    setError(null)
    const trimmedName = name.trim()
    if (!trimmedName) { setError('Name is required.'); return }
    if (existingNames.includes(trimmedName)) { setError(`"${trimmedName}" is already used.`); return }
    if (!apiKey.trim()) { setError('API key is required.'); return }

    setSaving(true)
    try {
      await api.post('/ai-configs', {
        name: trimmedName,
        provider,
        api_key: apiKey.trim(),
        model: (isCustomModel ? customModel.trim() : model.trim()) || null,
      })
      onCreated()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create configuration.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: 'var(--bg-card-dim)', border: '1px solid var(--border-dim)',
        borderRadius: '0.85rem', padding: '1rem', marginBottom: '0.85rem',
        display: 'flex', flexDirection: 'column', gap: '0.6rem',
      }}
    >
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Unique name, e.g. Work Anthropic"
        style={inputStyle}
      />

      <select
        value={provider}
        onChange={e => { setProvider(e.target.value); setModel(''); setCustomModel('') }}
        style={selectStyle}
      >
        {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>

      <div style={{ position: 'relative' }}>
        <input
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder={info.placeholder}
          style={{ ...inputStyle, paddingRight: '3rem' }}
        />
        <button
          type="button"
          onClick={() => setShowKey(v => !v)}
          style={{
            position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0.2rem 0.4rem',
          }}
        >
          {showKey ? 'Hide' : 'Show'}
        </button>
      </div>

      <select value={model} onChange={e => setModel(e.target.value)} style={selectStyle}>
        <option value="">Default model</option>
        {info.models.map(m => <option key={m} value={m}>{m}</option>)}
        <option value={CUSTOM_MODEL}>Custom…</option>
      </select>
      {isCustomModel && (
        <input
          type="text"
          value={customModel}
          onChange={e => setCustomModel(e.target.value)}
          placeholder="exact model id, e.g. gpt-5"
          style={inputStyle}
        />
      )}

      {error && <div style={{ color: '#f87171', fontSize: '0.78rem' }}>{error}</div>}

      <button
        type="submit"
        disabled={saving}
        style={{
          alignSelf: 'flex-end',
          padding: '0.5rem 1.1rem', borderRadius: '0.55rem', fontSize: '0.82rem',
          background: saving ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.85)',
          border: '1px solid rgba(99,102,241,0.5)',
          color: '#fff', cursor: saving ? 'default' : 'pointer', fontWeight: 600,
        }}
      >
        {saving ? 'Adding…' : 'Add'}
      </button>
    </form>
  )
}
