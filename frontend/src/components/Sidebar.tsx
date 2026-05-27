import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const menuItems = [
  { to: '/dashboard', label: '仪表盘', icon: '📊' },
  { to: '/diary', label: '饮食记录', icon: '📝' },
  { to: '/foods', label: '食物库', icon: '🍎' },
  { to: '/calculator', label: '计算器', icon: '🧮' },
  { to: '/recommendations', label: '智能推荐', icon: '🤖' },
  { to: '/chat', label: 'AI助手', icon: '💬' },
  { to: '/reports', label: '报告', icon: '📈' },
  { to: '/settings', label: '设置', icon: '⚙️' },
]

export default function Sidebar() {
  const { user, profile } = useAuth()
  const location = useLocation()

  return (
    <aside className="hidden md:block w-64 bg-white shadow-md min-h-[calc(100vh-4rem)] fixed left-0 top-16 p-4 overflow-y-auto">
      {/* User info card */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-4 text-white mb-6">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            {user?.username[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{user?.username}</p>
            <p className="text-sm text-primary-100">
              {profile?.goal === 'lose' ? '减脂' : profile?.goal === 'gain' ? '增肌' : profile?.goal === 'maintain' ? '维持' : '未设置目标'}
            </p>
          </div>
        </div>
        {profile?.target_calories && (
          <div className="text-sm">
            <p>目标：{profile.target_calories} kcal/天</p>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
