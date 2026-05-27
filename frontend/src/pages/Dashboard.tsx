import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getDailyEntries, getDailyRecommendations, getFoodStats } from '../services/api'
import { toast } from '../components/Toast'
import type { DailySummary, Food, DailyStats } from '../types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const today = new Date().toISOString().split('T')[0]
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [recommendations, setRecommendations] = useState<Food[]>([])
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dailyRes, recRes, statsRes] = await Promise.all([
        getDailyEntries(today),
        getDailyRecommendations(undefined, 4),
        (async () => {
          const end = new Date()
          const start = new Date()
          start.setDate(start.getDate() - 6)
          return getFoodStats(start.toISOString().split('T')[0], end.toISOString().split('T')[0])
        })(),
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

  const chartData = weeklyStats.length > 0
    ? weeklyStats.map((s) => ({ date: s.date.slice(5), 热量: s.total_calories, 蛋白质: s.total_protein }))
    : Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - 6 + i)
        return { date: `${d.getMonth() + 1}/${d.getDate()}`, 热量: 0, 蛋白质: 0 }
      })

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
          <p className="text-gray-500 text-sm">欢迎回来，{user?.username}</p>
        </div>
        <Link to="/diary" className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium">
          + 记录饮食
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="今日摄入" value={total.calories} unit="kcal" target={targetCal} icon="🔥" color="text-orange-600" bg="bg-orange-50" />
            <StatCard label="蛋白质" value={total.protein} unit="g" target={profile ? targetCal * 0.3 / 4 : 60} icon="🥩" color="text-red-600" bg="bg-red-50" />
            <StatCard label="碳水" value={total.carbs} unit="g" target={profile ? targetCal * 0.45 / 4 : 225} icon="🍚" color="text-blue-600" bg="bg-blue-50" />
            <StatCard label="脂肪" value={total.fat} unit="g" target={profile ? targetCal * 0.25 / 9 : 55} icon="🥑" color="text-yellow-600" bg="bg-yellow-50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calorie Ring */}
            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">热量摄入进度</h3>
              <CalorieRing current={total.calories} target={targetCal} />
              <div className="mt-4 space-y-2 w-full">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>已摄入</span><span className="font-semibold text-gray-800">{total.calories} kcal</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>目标</span><span className="font-semibold text-gray-800">{targetCal} kcal</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>剩余</span>
                  <span className={`font-semibold ${targetCal - total.calories > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {targetCal - total.calories > 0 ? targetCal - total.calories : 0} kcal
                  </span>
                </div>
              </div>
            </div>

            {/* Macro Pie */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">三大营养素占比</h3>
              <MacroPie protein={total.protein} carbs={total.carbs} fat={total.fat} />
            </div>

            {/* Quick Stats / Profile */}
            <div className="space-y-4">
              {profile ? (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">身体数据</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <MiniStat label="BMI" value={profile.bmi ? Number(profile.bmi).toFixed(1) : '--'} />
                    <MiniStat label="BMR" value={profile.bmr ? `${Math.round(Number(profile.bmr))}` : '--'} />
                    <MiniStat label="TDEE" value={profile.tdee ? `${Math.round(Number(profile.tdee))}` : '--'} />
                    <MiniStat label="身高" value={profile.height ? `${profile.height}cm` : '--'} />
                    <MiniStat label="体重" value={profile.weight ? `${profile.weight}kg` : '--'} />
                    <MiniStat label="体脂" value={profile.body_fat ? `${Number(profile.body_fat).toFixed(1)}%` : '--'} />
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                  <p className="text-gray-500 text-sm mb-3">尚未设置身体数据</p>
                  <Link to="/calculator" className="text-primary-600 text-sm hover:underline">去计算器设置 →</Link>
                </div>
              )}

              {/* AI Recommendations preview */}
              <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl shadow-md p-6 border border-primary-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-primary-800">🤖 AI 推荐</h3>
                  <Link to="/recommendations" className="text-xs text-primary-600 hover:underline">查看更多</Link>
                </div>
                {recommendations.length > 0 ? (
                  <div className="space-y-2">
                    {recommendations.slice(0, 3).map((food) => (
                      <div key={food.id} className="flex items-center justify-between bg-white/60 rounded-lg p-2 text-sm">
                        <span className="font-medium text-gray-800">{food.name}</span>
                        <span className="text-gray-500">{food.calories} kcal/100g</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">暂无推荐数据</p>
                )}
              </div>
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">7日热量 & 蛋白质趋势</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="热量" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="蛋白质" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Today's meals quick view */}
          {summary?.entries && summary.entries.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">今日饮食记录</h3>
              <div className="space-y-2">
                {summary.entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm">
                        {entry.meal_type === 'breakfast' ? '🌅' : entry.meal_type === 'lunch' ? '☀️' : entry.meal_type === 'dinner' ? '🌙' : '🍪'}
                      </span>
                      <span className="font-medium text-gray-800">{entry.food?.name || '食物'}</span>
                      <span className="text-sm text-gray-500">{entry.quantity}g</span>
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

function StatCard({ label, value, unit, target, icon, color, bg }: {
  label: string; value: number; unit: string; target: number; icon: string; color: string; bg: string
}) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0
  return (
    <div className={`${bg} rounded-xl p-4 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>
        {value}
        <span className="text-xs font-normal text-gray-500 ml-1">{unit}</span>
      </p>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
        <div className={`h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1">{Math.round(pct)}% of target</p>
    </div>
  )
}

function CalorieRing({ current, target }: { current: number; target: number }) {
  const pct = Math.min(current / target, 1.5)
  const color = current > target ? '#ef4444' : current > target * 0.8 ? '#eab308' : '#22c55e'
  const dasharray = `${Math.min(pct * 251, 251)} 251`

  return (
    <svg viewBox="0 0 120 120" className="w-40 h-40">
      <circle cx="60" cy="60" r="48" stroke="#e5e7eb" strokeWidth="12" fill="none" />
      <circle cx="60" cy="60" r="48" stroke={color} strokeWidth="12" fill="none" strokeLinecap="round"
        strokeDasharray={dasharray} transform="rotate(-90 60 60)" />
      <text x="60" y="55" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1e293b">{current}</text>
      <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#9ca3af">/ {target} kcal</text>
    </svg>
  )
}

function MacroPie({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const totalCal = protein * 4 + carbs * 4 + fat * 9
  if (totalCal === 0) {
    return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">今日暂无数据</div>
  }
  const pPct = Math.round((protein * 4 / totalCal) * 100)
  const cPct = Math.round((carbs * 4 / totalCal) * 100)
  const fPct = Math.round((fat * 9 / totalCal) * 100)

  const items = [
    { label: '蛋白质', pct: pPct, color: 'bg-green-500', grams: protein },
    { label: '碳水', pct: cPct, color: 'bg-blue-500', grams: carbs },
    { label: '脂肪', pct: fPct, color: 'bg-yellow-500', grams: fat },
  ]

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{item.label}</span>
            <span>{item.grams}g ({item.pct}%)</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4">
            <div className={`${item.color} h-4 rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-800">{value}</p>
    </div>
  )
}
