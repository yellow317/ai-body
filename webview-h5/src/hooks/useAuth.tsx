import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, UserProfile } from '../types'
import { getMe } from '../services/api'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  token: string | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setToken: (token: string | null) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      getMe()
        .then((res) => {
          setUser(res.data.user)
          if (res.data.profile) {
            setProfile(res.data.profile)
          }
        })
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const refreshUser = async () => {
    if (!token) return
    try {
      const res = await getMe()
      setUser(res.data.user)
      if (res.data.profile) {
        setProfile(res.data.profile)
      }
    } catch {
      // ignore
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setProfile(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, setUser, setProfile, setToken, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
