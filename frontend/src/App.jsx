import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AISettingsProvider } from './context/AISettingsContext.jsx'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Jobs from './pages/Jobs.jsx'
import JDAnalyser from './pages/JDAnalyser.jsx'
import Learning from './pages/Learning.jsx'
import Login from './pages/Login.jsx'
import OidcCallback from './pages/OidcCallback.jsx'
import Profile from './pages/Profile.jsx'
import PublicProfile from './pages/PublicProfile.jsx'
import Register from './pages/Register.jsx'
import SavedJobs from './pages/SavedJobs.jsx'
import Settings from './pages/Settings.jsx'

function AppLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <ThemeProvider>
    <AISettingsProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<OidcCallback />} />
        <Route path="/u/:userId" element={<PublicProfile />} />
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
        <Route path="/jobs" element={<AppLayout><Jobs /></AppLayout>} />
        <Route path="/saved-jobs" element={<AppLayout><SavedJobs /></AppLayout>} />
        <Route path="/jd-analyser" element={<AppLayout><JDAnalyser /></AppLayout>} />
        <Route path="/learning" element={<AppLayout><Learning /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
      </Routes>
    </BrowserRouter>
    </AISettingsProvider>
    </ThemeProvider>
  )
}
