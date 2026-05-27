import { Link, useLocation } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: '仪表盘', icon: '📊' },
  { to: '/diary', label: '饮食', icon: '📝' },
  { to: '/foods', label: '食物库', icon: '🍎' },
  { to: '/chat', label: 'AI助手', icon: '💬' },
  { to: '/settings', label: '设置', icon: '⚙️' },
]

export default function MobileBottomNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-2 min-w-0 ${
                isActive ? 'text-primary-600' : 'text-gray-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
