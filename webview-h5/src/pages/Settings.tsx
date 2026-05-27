import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getMe, updateProfile } from '../services/api'
import { useToast } from '../components/Toast'
import type { UserProfile } from '../types'

function profileToForm(p: UserProfile) {
  return {
    height: p.height ? String(p.height) : '',
    weight: p.weight ? String(p.weight) : '',
    age: p.age ? String(p.age) : '',
    gender: p.gender || 'male',
    activity_level: p.activity_level || 'moderate',
    goal: p.goal || 'maintain',
  }
}

const LABELS: Record<string, string> = {
  height: '身高 (cm)', weight: '体重 (kg)', age: '年龄',
  gender: '性别', activity_level: '活动水平', goal: '目标',
  body_fat: '体脂率', target_calories: '目标热量',
}

const GENDER_MAP: Record<string, string> = { male: '男', female: '女' }
const ACTIVITY_MAP: Record<string, string> = {
  sedentary: '久坐', light: '轻度运动', moderate: '中度运动', active: '高度运动', very_active: '极高度',
}
const GOAL_MAP: Record<string, string> = { lose: '减脂', gain: '增肌', maintain: '维持体重' }

export default function Settings() {
  const { user, profile, setProfile, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const { show: toast } = useToast()
  const [form, setForm] = useState({ height: '', weight: '', age: '', gender: 'male', activity_level: 'moderate', goal: 'maintain' })
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const loadProfile = useCallback(async () => {
    try {
      const res = await getMe()
      const p = res.data.profile as UserProfile | null
      if (p) {
        setProfile(p)
        setForm(profileToForm(p))
      }
    } catch {
      // ignore
    }
  }, [setProfile])

  useEffect(() => {
    loadProfile().finally(() => setLoaded(true))
  }, [loadProfile])

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const data: Record<string, unknown> = {}
      if (form.height) data.height = Number(form.height)
      if (form.weight) data.weight = Number(form.weight)
      if (form.age) data.age = Number(form.age)
      if (form.gender) data.gender = form.gender
      if (form.activity_level) data.activity_level = form.activity_level
      if (form.goal) data.goal = form.goal
      await updateProfile(data)
      await loadProfile()
      await refreshUser()
      toast('保存成功', 'success')
      setShowForm(false)
    } catch { toast('保存失败', 'error') }
    setSaving(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const profileFields = profile
    ? [
        { key: 'height', value: profile.height ? `${profile.height} cm` : '--' },
        { key: 'weight', value: profile.weight ? `${profile.weight} kg` : '--' },
        { key: 'age', value: profile.age ? `${profile.age} 岁` : '--' },
        { key: 'gender', value: GENDER_MAP[profile.gender || ''] || '--' },
        { key: 'activity_level', value: ACTIVITY_MAP[profile.activity_level || ''] || '--' },
        { key: 'goal', value: GOAL_MAP[profile.goal || ''] || '--' },
        { key: 'body_fat', value: profile.body_fat ? `${Number(profile.body_fat).toFixed(1)}%` : '--' },
        { key: 'target_calories', value: profile.target_calories ? `${profile.target_calories} kcal` : '--' },
      ]
    : []

  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      <h1 className="text-xl font-bold text-gray-800 py-3">设置</h1>

      <div className="space-y-3">
        {/* User Info */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">账号信息</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">用户名</span><span className="font-medium text-gray-800">{user?.username}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">邮箱</span><span className="font-medium text-gray-800">{user?.email}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">注册时间</span><span className="font-medium text-gray-800">{user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '--'}</span></div>
          </div>
        </div>

        {/* Body Data */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-600">身体数据</h3>
            <button onClick={() => setShowForm(!showForm)} className="text-sm text-primary-600 font-medium">
              {showForm ? '取消' : '编辑'}
            </button>
          </div>

          {showForm ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">身高 (cm)</label>
                  <input type="number" value={form.height} onChange={handleChange('height')} placeholder="170"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-0.5" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">体重 (kg)</label>
                  <input type="number" value={form.weight} onChange={handleChange('weight')} placeholder="65"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-0.5" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">年龄</label>
                  <input type="number" value={form.age} onChange={handleChange('age')} placeholder="25"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-0.5" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">性别</label>
                  <select value={form.gender} onChange={handleChange('gender')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-0.5">
                    <option value="male">男</option><option value="female">女</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">活动水平</label>
                <select value={form.activity_level} onChange={handleChange('activity_level')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-0.5">
                  <option value="sedentary">久坐</option>
                  <option value="light">轻度运动(1-3天/周)</option>
                  <option value="moderate">中度运动(3-5天/周)</option>
                  <option value="active">高度运动(6-7天/周)</option>
                  <option value="very_active">极高度</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">目标</label>
                <select value={form.goal} onChange={handleChange('goal')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-0.5">
                  <option value="maintain">维持体重</option>
                  <option value="lose">减脂</option>
                  <option value="gain">增肌</option>
                </select>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium active:bg-primary-700 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          ) : loaded && profile ? (
            <div className="space-y-1.5">
              {profileFields.map(f => (
                <div key={f.key} className="flex justify-between text-sm">
                  <span className="text-gray-500">{LABELS[f.key]}</span>
                  <span className="font-medium text-gray-800">{f.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">点击编辑设置你的身体数据</p>
          )}
        </div>

        {/* Metrics Summary */}
        {profile && (profile.bmi || profile.bmr || profile.tdee) && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">身体指标</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              {profile.bmi && <MetricBox label="BMI" value={Number(profile.bmi).toFixed(1)} />}
              {profile.bmr && <MetricBox label="BMR" value={`${Math.round(Number(profile.bmr))} kcal`} />}
              {profile.tdee && <MetricBox label="TDEE" value={`${Math.round(Number(profile.tdee))} kcal`} />}
              {profile.body_fat && <MetricBox label="体脂率" value={`${Number(profile.body_fat).toFixed(1)}%`} />}
              {profile.target_calories && <MetricBox label="目标热量" value={`${profile.target_calories} kcal`} />}
              {profile.goal && <MetricBox label="目标" value={profile.goal === 'lose' ? '减脂' : profile.goal === 'gain' ? '增肌' : '维持'} />}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="bg-white rounded-xl shadow-sm divide-y">
          <LinkRow to="/calculator" label="身体指标计算器" />
          <LinkRow to="/recommendations" label="AI 饮食推荐" />
          <LinkRow to="/reports" label="饮食报告" />
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full bg-white rounded-xl shadow-sm p-4 text-red-500 font-medium active:bg-red-50 transition-colors">
          退出登录
        </button>
      </div>
    </div>
  )
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-primary-600">{value}</p>
    </div>
  )
}

function LinkRow({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(to)} className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-gray-700 active:bg-gray-50">
      <span>{label}</span>
      <span className="text-gray-400">›</span>
    </button>
  )
}
