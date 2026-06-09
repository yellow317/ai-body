import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { uploadAvatar } from '../services/api'

export default function Navbar() {
  const { user, profile, logout, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleAvatarClick = () => {
    avatarInputRef.current?.click()
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) return
    try {
      await uploadAvatar(file)
      await refreshProfile()
    } catch {
      // ignore
    }
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary-600">AI</span>
            <span className="text-lg font-semibold text-gray-800">健康饮食</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <NavLink to="/">首页</NavLink>
            {user ? (
              <>
                <NavLink to="/dashboard">仪表盘</NavLink>
                <NavLink to="/diary">饮食记录</NavLink>
                <NavLink to="/foods">食物库</NavLink>
                <NavLink to="/calculator">计算器</NavLink>
                <NavLink to="/recommendations">推荐</NavLink>
                <NavLink to="/chat">AI助手</NavLink>
                <NavLink to="/reports">报告</NavLink>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center space-x-1 text-gray-700 hover:text-primary-600"
                  >
                    <div
                      onClick={handleAvatarClick}
                      className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:ring-2 hover:ring-primary-300 overflow-hidden flex-shrink-0"
                      title="点击更换头像"
                    >
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="头像" className="w-full h-full object-cover" />
                      ) : (
                        user.username[0].toUpperCase()
                      )}
                    </div>
                    <span>{user.username}</span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1">
                      <Link to="/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>设置</Link>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">登出</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-600">登录</Link>
                <Link to="/register" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">注册</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-500 p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <MobileNavLink to="/" onClick={() => setMenuOpen(false)}>首页</MobileNavLink>
            {user ? (
              <>
                <MobileNavLink to="/dashboard" onClick={() => setMenuOpen(false)}>仪表盘</MobileNavLink>
                <MobileNavLink to="/diary" onClick={() => setMenuOpen(false)}>饮食记录</MobileNavLink>
                <MobileNavLink to="/foods" onClick={() => setMenuOpen(false)}>食物库</MobileNavLink>
                <MobileNavLink to="/calculator" onClick={() => setMenuOpen(false)}>计算器</MobileNavLink>
                <MobileNavLink to="/recommendations" onClick={() => setMenuOpen(false)}>推荐</MobileNavLink>
                <MobileNavLink to="/chat" onClick={() => setMenuOpen(false)}>AI助手</MobileNavLink>
                <MobileNavLink to="/reports" onClick={() => setMenuOpen(false)}>报告</MobileNavLink>
                <MobileNavLink to="/settings" onClick={() => setMenuOpen(false)}>设置</MobileNavLink>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600">登出</button>
              </>
            ) : (
              <>
                <MobileNavLink to="/login" onClick={() => setMenuOpen(false)}>登录</MobileNavLink>
                <MobileNavLink to="/register" onClick={() => setMenuOpen(false)}>注册</MobileNavLink>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />
    </nav>
  )
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-gray-700 hover:text-primary-600 transition-colors">
      {children}
    </Link>
  )
}

function MobileNavLink({ to, onClick, children }: { to: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link to={to} onClick={onClick} className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
      {children}
    </Link>
  )
}
