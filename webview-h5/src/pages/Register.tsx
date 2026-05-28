import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm_password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.username || !form.password) {
      setError('请填写所有必填字段')
      return
    }
    if (form.password !== form.confirm_password) {
      setError('两次密码输入不一致')
      return
    }
    if (form.password.length < 6) {
      setError('密码长度至少6位')
      return
    }
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/login', { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto px-4 pt-4 pb-20">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">创建账号</h1>
        <p className="text-gray-500 text-sm mt-1">开始你的健康饮食之旅</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="请输入邮箱"
            autoComplete="email"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="请输入用户名"
            autoComplete="username"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="至少6位密码"
            autoComplete="new-password"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">确认密码</label>
          <input
            type="password"
            value={form.confirm_password}
            onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
            placeholder="再次输入密码"
            autoComplete="new-password"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-3.5 rounded-xl text-base font-medium active:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '注册中...' : '注册'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        已有账号？{' '}
        <Link to="/login" className="text-primary-600 font-medium">立即登录</Link>
      </p>
    </div>
  )
}
