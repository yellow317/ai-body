import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import TabBar from './components/TabBar'
import { isInMiniProgram, postMessageToMiniProgram } from './utils/wechat'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Diary from './pages/Diary'
import Foods from './pages/Foods'
import Calculator from './pages/Calculator'
import Chat from './pages/Chat'
import Recommendations from './pages/Recommendations'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function AppRoutes() {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Sync auth state to Mini Program
  useEffect(() => {
    if (user) {
      postMessageToMiniProgram({ type: 'LOGIN_SUCCESS', user: { id: user.id, username: user.username } })
    }
  }, [user])

  // Report route change back to mini program (for web-view page tracking)
  useEffect(() => {
    postMessageToMiniProgram({
      type: 'ROUTE_CHANGE',
      path: location.pathname,
      hash: window.location.hash,
    })
  }, [location.pathname])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple top header for mini program context */}
      {user && (
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
            <span className="text-base font-bold text-primary-600">AI 健康饮食</span>
            <button
              onClick={() => document.location.hash = '#/settings'}
              className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold"
            >
              {user.username[0].toUpperCase()}
            </button>
          </div>
        </header>
      )}

      <main className={user ? 'pb-16' : ''}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/diary" element={<ProtectedRoute><Diary /></ProtectedRoute>} />
          <Route path="/foods" element={<ProtectedRoute><Foods /></ProtectedRoute>} />
          <Route path="/calculator" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Bottom Tab Bar - only shown when logged in */}
      {user && <TabBar />}
    </div>
  )
}

export default function App() {
  useEffect(() => {
    const inMP = isInMiniProgram()
    if (inMP) {
      document.body.classList.add('in-miniprogram')
    }
  }, [])

  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  )
}
