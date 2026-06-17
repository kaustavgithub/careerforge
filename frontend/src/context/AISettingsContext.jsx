import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'

const AISettingsContext = createContext({
  settings: null,
  aiConfigured: false,
  loading: true,
  refresh: () => {},
})

export function AISettingsProvider({ children }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    if (!user) {
      setSettings(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data } = await api.get('/settings')
      setSettings(data)
    } catch {
      setSettings(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [user])

  const aiConfigured = !!(settings && settings[`${settings.ai_provider}_api_key`])

  return (
    <AISettingsContext.Provider value={{ settings, aiConfigured, loading, refresh }}>
      {children}
    </AISettingsContext.Provider>
  )
}

export function useAISettings() {
  return useContext(AISettingsContext)
}
