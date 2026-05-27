import { useState, useCallback, useEffect } from 'react'
import { getFoodStats } from '../services/api'
import { useToast } from '../components/Toast'
import type { DailyStats } from '../types'

type Period = '7' | '14' | '30'

export default function Reports() {
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

  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      <h1 className="text-xl font-bold text-gray-800 py-3">饮食报告</h1>

      {/* Period selector */}
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
      ) : (
        <div className="space-y-4">
          {/* Averages */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500">日均热量</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{avgCals} <span className="text-sm font-normal text-gray-500">kcal</span></p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500">日均蛋白质</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{avgProtein} <span className="text-sm font-normal text-gray-500">g</span></p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500">日均碳水</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{avgCarbs} <span className="text-sm font-normal text-gray-500">g</span></p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500">日均脂肪</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{avgFat} <span className="text-sm font-normal text-gray-500">g</span></p>
            </div>
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

          {/* Daily bar chart */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">每日热量摄入</h3>
            {stats.length > 0 ? (
              <div className="flex items-end justify-between h-40 gap-1">
                {stats.map((s, i) => {
                  const h = Math.max(4, (s.total_calories / maxCal) * 140)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center min-w-0">
                      <span className="text-[9px] text-gray-500 mb-1">{s.total_calories}</span>
                      <div className="w-full bg-primary-500 rounded-t" style={{ height: `${h}px`, opacity: 0.3 + (s.total_calories / maxCal) * 0.7 }} />
                      <span className="text-[9px] text-gray-400 mt-1">{s.date.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8 text-sm">暂无数据</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
