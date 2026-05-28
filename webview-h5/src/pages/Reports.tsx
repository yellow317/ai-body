import { useState, useCallback, useEffect } from 'react'
import { getFoodStats } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import type { DailyStats } from '../types'

type Period = '7' | '14' | '30'

export default function Reports() {
  const { profile } = useAuth()
  const { show: toast } = useToast()
  const [period, setPeriod] = useState<Period>('7')
  const [stats, setStats] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(false)

  const fetchStats = useCallback(async (p: Period) => {
    setLoading(true)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - parseInt(p))
    try {
      const res = await getFoodStats(start.toISOString().split('T')[0], end.toISOString().split('T')[0])
      setStats(res.data || [])
    } catch { toast('加载报告失败', 'error') }
    setLoading(false)
  }, [toast])

  useEffect(() => {
    fetchStats(period)
  }, [period, fetchStats])

  const handlePeriodChange = (p: Period) => {
    setPeriod(p)
  }

  const totals = stats.reduce((acc, s) => ({
    calories: acc.calories + s.total_calories,
    protein: acc.protein + s.total_protein,
    carbs: acc.carbs + s.total_carbs,
    fat: acc.fat + s.total_fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const days = stats.length || parseInt(period)
  const avgCals = Math.round(totals.calories / Math.max(days, 1))
  const avgProtein = Math.round(totals.protein / Math.max(days, 1))
  const avgCarbs = Math.round(totals.carbs / Math.max(days, 1))
  const avgFat = Math.round(totals.fat / Math.max(days, 1))

  const maxCal = Math.max(...stats.map(s => s.total_calories), 1)
  const maxMacro = Math.max(...stats.map(s => Math.max(s.total_protein, s.total_carbs, s.total_fat)), 1)

  const targetCal = profile?.target_calories || 2000

  return (
    <div className="max-w-lg lg:max-w-4xl xl:max-w-6xl mx-auto px-4 lg:px-6 pb-24">
      <h1 className="text-xl font-bold text-gray-800 py-3">饮食报告</h1>

      <div className="flex gap-2 mb-4">
        {(['7', '14', '30'] as Period[]).map(p => (
          <button key={p} onClick={() => handlePeriodChange(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 active:bg-gray-50'
            }`}>
            {p}天
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
      ) : stats.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm">暂无数据，开始记录饮食后将在此显示报告</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Averages */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <AvgCard label="日均热量" value={avgCals} unit="kcal" target={targetCal} color="text-primary-600" bg="bg-primary-50" barColor="bg-primary-500" />
            <AvgCard label="日均蛋白质" value={avgProtein} unit="g" target={Math.round(targetCal * 0.3 / 4)} color="text-green-600" bg="bg-green-50" barColor="bg-green-500" />
            <AvgCard label="日均碳水" value={avgCarbs} unit="g" target={Math.round(targetCal * 0.45 / 4)} color="text-blue-600" bg="bg-blue-50" barColor="bg-blue-500" />
            <AvgCard label="日均脂肪" value={avgFat} unit="g" target={Math.round(targetCal * 0.25 / 9)} color="text-yellow-600" bg="bg-yellow-50" barColor="bg-yellow-500" />
          </div>

          {/* Totals */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">{period}天总计</h3>
            <div className="grid grid-cols-4 text-center gap-2">
              <div><p className="text-lg font-bold text-primary-600">{totals.calories}</p><p className="text-[10px] text-gray-500">热量(kcal)</p></div>
              <div><p className="text-lg font-bold text-green-600">{totals.protein}</p><p className="text-[10px] text-gray-500">蛋白(g)</p></div>
              <div><p className="text-lg font-bold text-blue-600">{totals.carbs}</p><p className="text-[10px] text-gray-500">碳水(g)</p></div>
              <div><p className="text-lg font-bold text-yellow-600">{totals.fat}</p><p className="text-[10px] text-gray-500">脂肪(g)</p></div>
            </div>
          </div>

          {/* Calorie bar chart */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">每日热量摄入</h3>
            <div className="flex items-end justify-between h-40 gap-1">
              {stats.map((s, i) => {
                const h = Math.max(4, (s.total_calories / maxCal) * 140)
                const isOver = s.total_calories > targetCal
                return (
                  <div key={i} className="flex-1 flex flex-col items-center min-w-0">
                    <span className={`text-[9px] mb-1 ${isOver ? 'text-red-500' : 'text-gray-500'}`}>{s.total_calories}</span>
                    <div className={`w-full rounded-t ${isOver ? 'bg-red-400' : 'bg-primary-400'}`}
                      style={{ height: `${h}px`, opacity: 0.3 + (s.total_calories / maxCal) * 0.7 }} />
                    <span className="text-[9px] text-gray-400 mt-1">{s.date.slice(5)}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-center mt-3">
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary-400 inline-block" /> 未超标</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> 超标</span>
              </div>
            </div>
          </div>

          {/* Macro breakdown stacked bar chart */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">每日营养素摄入</h3>
            <div className="flex items-end justify-between h-40 gap-1">
              {stats.map((s, i) => {
                const total = s.total_protein + s.total_carbs + s.total_fat || 1
                const pH = Math.max(2, (s.total_protein / maxMacro) * 140)
                const cH = Math.max(2, (s.total_carbs / maxMacro) * 140)
                const fH = Math.max(2, (s.total_fat / maxMacro) * 140)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center min-w-0">
                    <span className="text-[9px] text-gray-500 mb-1">{s.total_protein + s.total_carbs + s.total_fat}</span>
                    <div className="w-full flex flex-col-reverse" style={{ height: '140px' }}>
                      <div className="w-full bg-yellow-400" style={{ height: `${fH}px` }} />
                      <div className="w-full bg-blue-400" style={{ height: `${cH}px` }} />
                      <div className="w-full bg-green-400" style={{ height: `${pH}px` }} />
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1">{s.date.slice(5)}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-center gap-3 mt-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block" /> 蛋白质</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" /> 碳水</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" /> 脂肪</span>
            </div>
          </div>

          {/* Daily detail table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-600 px-4 py-3 border-b">每日详细数据</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">日期</th>
                    <th className="text-right px-4 py-2.5 text-xs text-gray-500 font-medium">热量</th>
                    <th className="text-right px-4 py-2.5 text-xs text-gray-500 font-medium">蛋白</th>
                    <th className="text-right px-4 py-2.5 text-xs text-gray-500 font-medium">碳水</th>
                    <th className="text-right px-4 py-2.5 text-xs text-gray-500 font-medium">脂肪</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...stats].reverse().map((s) => (
                    <tr key={s.date} className="active:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-800 font-medium text-xs">{s.date.slice(5)}</td>
                      <td className="px-4 py-2.5 text-right text-xs">
                        <span className={s.total_calories > targetCal ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                          {s.total_calories}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-gray-700">{s.total_protein}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-gray-700">{s.total_carbs}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-gray-700">{s.total_fat}</td>
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

function AvgCard({ label, value, unit, target, color, bg, barColor }: {
  label: string; value: number; unit: string; target: number; color: string; bg: string; barColor: string
}) {
  const pct = target > 0 ? Math.min(Math.round((value / target) * 100), 150) : 0
  return (
    <div className={`${bg} rounded-xl shadow-sm p-4`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color} mt-1`}>{value} <span className="text-sm font-normal text-gray-500">{unit}</span></p>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">目标 {target}{unit} · {pct}%</p>
    </div>
  )
}
