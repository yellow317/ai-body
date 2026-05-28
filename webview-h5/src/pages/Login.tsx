import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const { setToken, setUser } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      setError('请填写用户名和密码')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await login(form)
      const { token: access_token, user } = res.data
      localStorage.setItem('token', access_token)
      setToken(access_token)
      setUser(user)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto px-4 pt-4 pb-20">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">欢迎回来</h1>
        <p className="text-gray-500 text-sm mt-1">登录你的账号</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="请输入用户名"
            autoComplete="username"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-shadow"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="请输入密码"
            autoComplete="current-password"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-shadow"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-3.5 rounded-xl text-base font-medium active:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        还没有账号？{' '}
        <Link to="/register" className="text-primary-600 font-medium">立即注册</Link>
      </p>
    </div>
  )
}
