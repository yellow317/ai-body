import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import MobileBottomNav from './MobileBottomNav'
import { useAuth } from '../hooks/useAuth'
import { useLocation } from 'react-router-dom'

const hideBottomNavRoutes = ['/login', '/register']

export default function MainLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const showBottomNav = user && !hideBottomNavRoutes.includes(location.pathname)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        {user && <Sidebar />}
        <main className={`flex-1 p-3 md:p-6 w-full overflow-x-hidden ${user ? 'ml-0 md:ml-64 mb-14 md:mb-0' : ''}`}>
          <Outlet />
        </main>
      </div>
      {showBottomNav && <MobileBottomNav />}
    </div>
  )
}
