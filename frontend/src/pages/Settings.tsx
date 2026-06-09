import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getMe, updateProfile, uploadAvatar } from '../services/api'
import type { UserProfile } from '../types'

type ProfileForm = {
  height: number
  weight: number
  age: number
  gender: string
  activity_level: string
  goal: string
}

const DEFAULT_FORM: ProfileForm = {
  height: 170, weight: 65, age: 25,
  gender: 'male', activity_level: 'moderate', goal: 'maintain',
}

function profileToForm(p: UserProfile): ProfileForm {
  return {
    height: Number(p.height) || 170,
    weight: Number(p.weight) || 65,
    age: p.age || 25,
    gender: p.gender || 'male',
    activity_level: p.activity_level || 'moderate',
    goal: p.goal || 'maintain',
  }
}

export default function Settings() {
  const { user, profile, setProfile, refreshProfile, logout } = useAuth()
  const [form, setForm] = useState<ProfileForm>(DEFAULT_FORM)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: '请选择小于 2MB 的图片文件' })
      return
    }
    try {
      await uploadAvatar(file)
      await refreshProfile()
      setMessage({ type: 'success', text: '头像更新成功' })
    } catch {
      setMessage({ type: 'error', text: '头像上传失败，请重试' })
    }
  }

  const loadProfile = useCallback(async () => {
    try {
      const res = await getMe()
      const p = res.data.profile as UserProfile | null
      if (p) {
        setProfile(p)
        setForm(profileToForm(p))
      }
    } catch {
      // keep current form
    }
  }, [setProfile])

  useEffect(() => {
    let cancelled = false
    loadProfile().finally(() => {
      if (!cancelled) setReady(true)
    })
    return () => { cancelled = true }
  }, [loadProfile])

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = ['height', 'weight', 'age'].includes(field) ? Number(e.target.value) : e.target.value
    setForm(prev => ({ ...prev, [field]: val }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await updateProfile(form)
      await loadProfile()
      setMessage({ type: 'success', text: '资料更新成功' })
    } catch {
      setMessage({ type: 'error', text: '更新失败，请重试' })
    } finally {
      setSaving(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">设置</h1>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">个人资料</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">身高 (cm)</label>
              <input type="number" value={form.height} onChange={handleChange('height')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                min={100} max={250} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">体重 (kg)</label>
              <input type="number" value={form.weight} onChange={handleChange('weight')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                min={30} max={250} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年龄</label>
              <input type="number" value={form.age} onChange={handleChange('age')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                min={10} max={100} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
              <select value={form.gender} onChange={handleChange('gender')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">活动水平</label>
              <select value={form.activity_level} onChange={handleChange('activity_level')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                <option value="sedentary">久坐 (几乎不运动)</option>
                <option value="light">轻度运动 (1-3天/周)</option>
                <option value="moderate">中度运动 (3-5天/周)</option>
                <option value="active">高度运动 (6-7天/周)</option>
                <option value="very_active">极高度 (体力劳动)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目标</label>
              <select value={form.goal} onChange={handleChange('goal')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                <option value="lose">减脂</option>
                <option value="gain">增肌</option>
                <option value="maintain">维持体重</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 bg-primary-600 text-white px-8 py-2.5 rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? '保存中...' : '保存资料'}
          </button>
        </div>

        {/* Profile Summary */}
        <div className="space-y-4">
          {/* Account info */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">账户信息</h3>
            <div className="flex items-center space-x-4 mb-4">
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold cursor-pointer hover:ring-2 hover:ring-primary-300 overflow-hidden flex-shrink-0"
                title="点击更换头像"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="头像" className="w-full h-full object-cover" />
                ) : (
                  user?.username?.[0]?.toUpperCase()
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{user?.username}</p>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-xs text-primary-600 hover:text-primary-700 mt-0.5"
                >
                  更换头像
                </button>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">用户名</p>
                <p className="text-sm font-medium text-gray-800">{user?.username}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">邮箱</p>
                <p className="text-sm font-medium text-gray-800">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">注册时间</p>
                <p className="text-sm font-medium text-gray-800">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '--'}
                </p>
              </div>
            </div>
          </div>

          {/* Calculated metrics */}
          {profile && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">身体指标</h3>
              <div className="grid grid-cols-2 gap-3">
                <MetricBox label="BMI" value={profile.bmi ? Number(profile.bmi).toFixed(1) : '--'} color="text-blue-600" />
                <MetricBox label="BMR" value={profile.bmr ? `${Math.round(Number(profile.bmr))} kcal` : '--'} color="text-orange-600" />
                <MetricBox label="TDEE" value={profile.tdee ? `${Math.round(Number(profile.tdee))} kcal` : '--'} color="text-green-600" />
                <MetricBox label="体脂率" value={profile.body_fat ? `${Number(profile.body_fat).toFixed(1)}%` : '--'} color="text-purple-600" />
                <MetricBox label="目标热量" value={profile.target_calories ? `${profile.target_calories} kcal` : '--'} color="text-primary-600" />
                <MetricBox
                  label="目标"
                  value={profile.goal === 'lose' ? '减脂' : profile.goal === 'gain' ? '增肌' : profile.goal === 'maintain' ? '维持' : '--'}
                  color="text-pink-600"
                />
              </div>
            </div>
          )}

          {/* Danger zone */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-red-100">
            <h3 className="text-sm font-semibold text-red-600 mb-2">登出</h3>
            <p className="text-xs text-gray-500 mb-4">退出当前账号</p>
            <button
              onClick={logout}
              className="w-full border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 text-sm font-medium"
            >
              登出
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  )
}
