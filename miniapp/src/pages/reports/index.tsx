import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { getFoodStats } from '../../api'
import './index.scss'

type Period = '7' | '14' | '30'

export default function Reports() {
  const [period, setPeriod] = useState<Period>('7')
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchStats = async (p: Period) => {
    setLoading(true)
    setPeriod(p)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - parseInt(p))
    try {
      const res: any = await getFoodStats(start.toISOString().split('T')[0], end.toISOString().split('T')[0])
      setStats(Array.isArray(res) ? res : [])
    } catch { setStats([]) }
    setLoading(false)
  }

  useEffect(() => { fetchStats('7') }, [])

  const totals = stats.reduce((acc, s) => ({
    calories: acc.calories + (s.total_calories || 0),
    protein: acc.protein + (s.total_protein || 0),
    carbs: acc.carbs + (s.total_carbs || 0),
    fat: acc.fat + (s.total_fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const days = stats.length || parseInt(period)
  const avgCals = Math.round(totals.calories / Math.max(days, 1))
  const avgProtein = Math.round(totals.protein / Math.max(days, 1))
  const avgCarbs = Math.round(totals.carbs / Math.max(days, 1))
  const avgFat = Math.round(totals.fat / Math.max(days, 1))

  const maxCal = Math.max(...stats.map(s => s.total_calories || 0), 1)

  return (
    <View className='page-container reports-page'>
      <Text className='reports-title'>饮食报告</Text>

      {/* Period selector */}
      <View className='period-row'>
        {(['7', '14', '30'] as Period[]).map(p => (
          <View key={p} className={`period-btn ${period === p ? 'active' : ''}`} onClick={() => fetchStats(p)}>
            <Text>{p}天</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View className='spinner-wrap'><View className='spinner'></View></View>
      ) : (
        <>
          {/* Averages */}
          <View className='avg-grid'>
            <View className='avg-card'>
              <Text className='avg-label'>日均热量</Text>
              <Text className='avg-value primary'>{avgCals} <Text className='avg-unit'>kcal</Text></Text>
            </View>
            <View className='avg-card'>
              <Text className='avg-label'>日均蛋白</Text>
              <Text className='avg-value green'>{avgProtein} <Text className='avg-unit'>g</Text></Text>
            </View>
            <View className='avg-card'>
              <Text className='avg-label'>日均碳水</Text>
              <Text className='avg-value blue'>{avgCarbs} <Text className='avg-unit'>g</Text></Text>
            </View>
            <View className='avg-card'>
              <Text className='avg-label'>日均脂肪</Text>
              <Text className='avg-value yellow'>{avgFat} <Text className='avg-unit'>g</Text></Text>
            </View>
          </View>

          {/* Totals */}
          <View className='card'>
            <Text className='card-title'>{period}天总计</Text>
            <View className='total-grid'>
              <View className='total-item'>
                <Text className='total-num primary'>{totals.calories}</Text>
                <Text className='total-lbl'>热量(kcal)</Text>
              </View>
              <View className='total-item'>
                <Text className='total-num green'>{totals.protein}</Text>
                <Text className='total-lbl'>蛋白(g)</Text>
              </View>
              <View className='total-item'>
                <Text className='total-num blue'>{totals.carbs}</Text>
                <Text className='total-lbl'>碳水(g)</Text>
              </View>
              <View className='total-item'>
                <Text className='total-num yellow'>{totals.fat}</Text>
                <Text className='total-lbl'>脂肪(g)</Text>
              </View>
            </View>
          </View>

          {/* Daily Chart */}
          <View className='card'>
            <Text className='card-title'>每日热量摄入</Text>
            {stats.length > 0 ? (
              <View className='bar-chart'>
                {stats.map((s: any, i: number) => {
                  const h = Math.max(8, ((s.total_calories || 0) / maxCal) * 260)
                  return (
                    <View key={i} className='bar-col'>
                      <Text className='bar-top'>{s.total_calories || 0}</Text>
                      <View className='bar-body' style={{ height: `${h}rpx`, opacity: 0.3 + ((s.total_calories || 0) / maxCal) * 0.7 }} />
                      <Text className='bar-bottom'>{s.date?.slice(5)}</Text>
                    </View>
                  )
                })}
              </View>
            ) : (
              <Text className='empty-msg'>暂无数据</Text>
            )}
          </View>
        </>
      )}
    </View>
  )
}
