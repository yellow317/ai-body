import { useState, useEffect, useCallback, useMemo } from 'react'
import { getFoodStats } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { toast } from '../components/Toast'
import type { DailyStats } from '../types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts'

type Period = '7d' | '14d' | '30d'

const COLORS = { 热量: '#3b82f6', 蛋白质: '#22c55e', 碳水: '#f59e0b', 脂肪: '#ef4444' }

export default function Reports() {
  const { profile } = useAuth()
  const [period, setPeriod] = useState<Period>('7d')
  const [stats, setStats] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)

  const dateRange = useMemo(() => {
    const end = new Date()
    const start = new Date()
    const days = period === '7d' ? 6 : period === '14d' ? 13 : 29
    start.setDate(start.getDate() - days)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  }, [period])

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getFoodStats(dateRange.start, dateRange.end)
      setStats(res.data || [])
    } catch {
      setStats([])
      toast('加载报告数据失败', 'error')
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const chartData = useMemo(() => {
    return stats.map((s) => ({
      date: s.date.slice(5),
      热量: s.total_calories,
      蛋白质: s.total_protein,
      碳水: s.total_carbs,
      脂肪: s.total_fat,
    }))
  }, [stats])

  const averages = useMemo(() => {
    if (stats.length === 0) return { 热量: 0, 蛋白质: 0, 碳水: 0, 脂肪: 0 }
    const sum = stats.reduce((acc, s) => ({
      热量: acc.热量 + s.total_calories,
      蛋白质: acc.蛋白质 + s.total_protein,
      碳水: acc.碳水 + s.total_carbs,
      脂肪: acc.脂肪 + s.total_fat,
    }), { 热量: 0, 蛋白质: 0, 碳水: 0, 脂肪: 0 })
    const n = stats.length
    return {
      热量: Math.round(sum.热量 / n),
      蛋白质: Math.round(sum.蛋白质 / n * 10) / 10,
      碳水: Math.round(sum.碳水 / n * 10) / 10,
      脂肪: Math.round(sum.脂肪 / n * 10) / 10,
    }
  }, [stats])

  const macroPieData = [
    { name: '蛋白质', value: averages.蛋白质 * 4, color: '#22c55e' },
    { name: '碳水', value: averages.碳水 * 4, color: '#f59e0b' },
    { name: '脂肪', value: averages.脂肪 * 9, color: '#ef4444' },
  ].filter(d => d.value > 0)

  const totalCalAvg = macroPieData.reduce((s, d) => s + d.value, 0)
  const macroPieWithPct = macroPieData.map(d => ({
    ...d,
    pct: totalCalAvg > 0 ? Math.round((d.value / totalCalAvg) * 100) : 0,
  }))

  const targetCal = profile?.target_calories || 2000
  const targetProtein = profile?.target_calories ? Math.round(targetCal * 0.3 / 4 * 10) / 10 : 60

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📈 数据报告</h1>
          <p className="text-gray-500 text-sm mt-1">追踪你的营养摄入趋势</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['7d', '14d', '30d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === p ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {p === '7d' ? '7天' : p === '14d' ? '14天' : '30天'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : stats.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg">暂无数据</p>
          <p className="text-sm mt-1">开始记录饮食后将在此显示报告</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Averages */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AvgCard label="日均热量" value={averages.热量} unit="kcal" target={targetCal} color="text-primary-600" icon="🔥" />
            <AvgCard label="日均蛋白质" value={averages.蛋白质} unit="g" target={targetProtein} color="text-green-600" icon="🥩" />
            <AvgCard label="日均碳水" value={averages.碳水} unit="g" target={targetCal * 0.45 / 4} color="text-yellow-600" icon="🍚" />
            <AvgCard label="日均脂肪" value={averages.脂肪} unit="g" target={targetCal * 0.25 / 9} color="text-red-600" icon="🥑" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calorie trend */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">热量摄入趋势</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="热量" stroke="#3b82f6" fill="url(#colorCal)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Macronutrient stack */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">三大营养素摄入趋势</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="蛋白质" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="碳水" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="脂肪" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Macro ratio pie */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">热量来源占比 (日均)</h3>
              {macroPieWithPct.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={macroPieWithPct}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {macroPieWithPct.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => `${val} kcal`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-gray-400">无数据</div>
              )}
            </div>

            {/* Calorie vs Target */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">热量摄入 vs 目标</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="热量" fill="#3b82f6" radius={[4, 4, 0, 0]} name="实际摄入" />
                  <Line
                    type="monotone"
                    dataKey={() => targetCal}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="目标"
                    dot={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily detail table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-sm font-semibold text-gray-600">每日详细数据</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-600 font-medium">日期</th>
                    <th className="text-right px-6 py-3 text-gray-600 font-medium">热量 (kcal)</th>
                    <th className="text-right px-6 py-3 text-gray-600 font-medium">蛋白质 (g)</th>
                    <th className="text-right px-6 py-3 text-gray-600 font-medium">碳水 (g)</th>
                    <th className="text-right px-6 py-3 text-gray-600 font-medium">脂肪 (g)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...stats].reverse().map((s) => (
                    <tr key={s.date} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-800 font-medium">{s.date}</td>
                      <td className="px-6 py-3 text-right">
                        <span className={s.total_calories > targetCal ? 'text-red-600' : 'text-green-600'}>
                          {s.total_calories}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">{s.total_protein}</td>
                      <td className="px-6 py-3 text-right">{s.total_carbs}</td>
                      <td className="px-6 py-3 text-right">{s.total_fat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AvgCard({ label, value, unit, target, color, icon }: {
  label: string; value: number; unit: string; target: number; color: string; icon: string
}) {
  const pct = target > 0 ? Math.min(Math.round((value / target) * 100), 150) : 0
  const statusColor = pct > 120 ? 'text-red-600' : pct >= 80 ? 'text-green-600' : 'text-yellow-600'

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>
        {value}
        <span className="text-xs font-normal text-gray-400 ml-1">{unit}</span>
      </p>
      <div className="flex items-center justify-between mt-1">
        <div className="w-full bg-gray-100 rounded-full h-1.5 mr-2">
          <div
            className={`h-1.5 rounded-full ${color.replace('text-', 'bg-')}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <span className={`text-xs ${statusColor}`}>{pct}%</span>
      </div>
    </div>
  )
}
