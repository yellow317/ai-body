import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getDailyEntries, getDailyRecommendations, getFoodStats } from '../services/api'
import { useToast } from '../components/Toast'
import type { DailySummary, Food, DailyStats } from '../types'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const { show: toast } = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [recommendations, setRecommendations] = useState<Food[]>([])
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      const [dailyRes, recRes, statsRes] = await Promise.all([
        getDailyEntries(today),
        getDailyRecommendations(undefined, 4),
        getFoodStats(start.toISOString().split('T')[0], end.toISOString().split('T')[0]),
      ])
      setSummary(dailyRes.data)
      setRecommendations(recRes.data.recommendations || [])
      setWeeklyStats(statsRes.data || [])
    } catch {
      toast('加载数据失败', 'error')
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const total = summary?.total || { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const targetCal = profile?.target_calories || 2000

  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">仪表盘</h1>
          <p className="text-gray-500 text-xs">欢迎回来，{user?.username}</p>
        </div>
        <Link to="/diary" className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium active:bg-primary-700">
          + 记录
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Profile Quick Stats */}
          {profile && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-xl shadow-sm p-3">
                <p className="text-[10px] text-gray-500">BMI</p>
                <p className="text-sm font-bold text-gray-800">{profile.bmi?.toFixed(1) || '-'}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-3">
                <p className="text-[10px] text-gray-500">目标热量</p>
                <p className="text-sm font-bold text-primary-600">{profile.target_calories || '-'}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-3">
                <p className="text-[10px] text-gray-500">目标</p>
                <p className="text-sm font-bold text-gray-800">{profile.goal === 'lose' ? '减脂' : profile.goal === 'gain' ? '增肌' : '保持'}</p>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="今日摄入" value={total.calories} unit="kcal" target={targetCal} color="text-orange-600" bg="bg-orange-50" />
            <StatCard label="蛋白质" value={total.protein} unit="g" target={60} color="text-red-600" bg="bg-red-50" />
            <StatCard label="碳水" value={total.carbs} unit="g" target={225} color="text-blue-600" bg="bg-blue-50" />
            <StatCard label="脂肪" value={total.fat} unit="g" target={55} color="text-yellow-600" bg="bg-yellow-50" />
          </div>

          {/* Macro Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">宏量营养素分布</h3>
            <MacroPie protein={total.protein} carbs={total.carbs} fat={total.fat} />
          </div>

          {/* Calorie Progress */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">热量摄入进度</h3>
            <div className="flex items-center justify-center">
              <CalorieRing current={total.calories} target={targetCal} />
            </div>
            <div className="flex justify-around text-center mt-3">
              <div><p className="text-xs text-gray-500">已摄入</p><p className="text-sm font-bold">{total.calories}</p></div>
              <div><p className="text-xs text-gray-500">目标</p><p className="text-sm font-bold">{targetCal}</p></div>
              <div><p className="text-xs text-gray-500">剩余</p><p className={`text-sm font-bold ${targetCal - total.calories > 0 ? 'text-green-600' : 'text-red-600'}`}>{Math.max(0, targetCal - total.calories)}</p></div>
            </div>
          </div>

          {/* Weekly summary */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">7日热量趋势</h3>
            <div className="flex items-end justify-between h-32 gap-1">
              {weeklyStats.length > 0 ? weeklyStats.map((s, i) => {
                const maxCal = Math.max(...weeklyStats.map(x => x.total_calories), 1)
                const h = Math.max(4, (s.total_calories / maxCal) * 100)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <span className="text-[10px] text-gray-500 mb-1">{s.total_calories}</span>
                    <div className="w-full bg-primary-500 rounded-t" style={{ height: `${h}px`, opacity: 0.3 + (s.total_calories / maxCal) * 0.7 }} />
                    <span className="text-[10px] text-gray-400 mt-1">{s.date.slice(5)}</span>
                  </div>
                )
              }) : (
                <p className="text-gray-400 text-sm w-full text-center">暂无数据</p>
              )}
            </div>
          </div>

          {/* AI Recommendations preview */}
          {recommendations.length > 0 && (
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl shadow-sm p-5 border border-primary-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-primary-800">AI 推荐</h3>
                <Link to="/recommendations" className="text-xs text-primary-600">更多</Link>
              </div>
              <div className="space-y-2">
                {recommendations.slice(0, 3).map((food) => (
                  <div key={food.id} className="flex items-center justify-between bg-white/60 rounded-lg p-2.5 text-sm">
                    <span className="font-medium text-gray-800">{food.name}</span>
                    <span className="text-gray-500 text-xs">{food.calories} kcal/100g</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's meals */}
          {summary?.entries && summary.entries.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">今日饮食</h3>
              <div className="space-y-2">
                {summary.entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">
                        {entry.meal_type === 'breakfast' ? '🌅' : entry.meal_type === 'lunch' ? '☀️' : entry.meal_type === 'dinner' ? '🌙' : '🍪'}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{entry.food?.name || '食物'}</span>
                      <span className="text-xs text-gray-500">{entry.quantity}g</span>
                    </div>
                    <span className="text-sm font-semibold text-primary-600">{entry.calories} kcal</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, unit, target, color, bg }: {
  label: string; value: number; unit: string; target: number; color: string; bg: string
}) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0
  return (
    <div className={`${bg} rounded-xl p-3.5 shadow-sm`}>
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <p className={`text-lg font-bold ${color} mt-0.5`}>
        {value}<span className="text-[10px] font-normal text-gray-500 ml-0.5">{unit}</span>
      </p>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
        <div className={`h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function MacroPie({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const totalG = protein + carbs + fat || 1
  const items = [
    { label: '蛋白质', value: protein, pct: (protein / totalG) * 100, color: 'bg-green-500' },
    { label: '碳水', value: carbs, pct: (carbs / totalG) * 100, color: 'bg-blue-500' },
    { label: '脂肪', value: fat, pct: (fat / totalG) * 100, color: 'bg-yellow-500' },
  ]
  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600">{item.label}</span>
            <span className="text-gray-800 font-medium">{item.value}g ({item.pct.toFixed(0)}%)</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className={`h-3 rounded-full ${item.color} transition-all duration-500`} style={{ width: `${Math.min(item.pct, 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function CalorieRing({ current, target }: { current: number; target: number }) {
  const pct = Math.min(current / target, 1.5)
  const color = current > target ? '#ef4444' : current > target * 0.8 ? '#eab308' : '#22c55e'
  const dasharray = `${Math.min(pct * 251, 251)} 251`

  return (
    <svg viewBox="0 0 120 120" className="w-36 h-36">
      <circle cx="60" cy="60" r="48" stroke="#e5e7eb" strokeWidth="12" fill="none" />
      <circle cx="60" cy="60" r="48" stroke={color} strokeWidth="12" fill="none" strokeLinecap="round"
        strokeDasharray={dasharray} transform="rotate(-90 60 60)" />
      <text x="60" y="55" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1e293b">{current}</text>
      <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#9ca3af">/ {target} kcal</text>
    </svg>
  )
}
