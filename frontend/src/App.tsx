import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { ToastProvider } from './components/Toast'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Diary from './pages/Diary'
import Foods from './pages/Foods'
import Calculator from './pages/Calculator'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Recommendations from './pages/Recommendations'
import Chat from './pages/Chat'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="diary" element={<ProtectedRoute><Diary /></ProtectedRoute>} />
          <Route path="foods" element={<ProtectedRoute><Foods /></ProtectedRoute>} />
          <Route path="calculator" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
          <Route path="chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
