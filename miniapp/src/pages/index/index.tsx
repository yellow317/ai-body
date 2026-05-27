import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { getDailyEntries, getDailyRecommendations, getFoodStats } from '../../api'
import { getUser } from '../../utils/storage'
import './index.scss'

export default function Index() {
  const [user, setUserState] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  const [weeklyStats, setWeeklyStats] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  const fetchData = async () => {
    setLoading(true)
    try {
      const u = getUser()
      setUserState(u)
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)

      const [dailyRes, statsRes, recRes] = await Promise.all([
        getDailyEntries(today).catch(() => null),
        getFoodStats(start.toISOString().split('T')[0], end.toISOString().split('T')[0]).catch(() => []),
        getDailyRecommendations(undefined, 4).catch(() => null),
      ])

      setSummary(dailyRes)
      setWeeklyStats(Array.isArray(statsRes) ? statsRes : [])
      setRecommendations((recRes as any)?.recommendations || [])
    } catch { /* ignore */ }
    finally { setLoading(false); Taro.stopPullDownRefresh() }
  }

  useDidShow(() => { fetchData() })

  useEffect(() => {
    const u = getUser()
    if (!u) {
      Taro.redirectTo({ url: '/pages/login/index' })
    }
  }, [])

  const total = (summary as any)?.total || { calories: 0, protein: 0, carbs: 0, fat: 0 }

  const handleNavigate = (url: string) => {
    Taro.navigateTo({ url })
  }

  if (loading) {
    return (
      <View className='page-container' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <View className='spinner'></View>
      </View>
    )
  }

  return (
    <View className='page-container index-page'>
      {/* Header */}
      <View className='index-header'>
        <View>
          <Text className='greeting'>欢迎回来</Text>
          <Text className='username'>{user?.username || user?.user?.username || '用户'}</Text>
        </View>
        <View className='avatar'>
          <Text>{(user?.username || 'U')[0]?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View className='stats-grid'>
        <View className='stat-card'>
          <Text className='stat-label'>今日摄入</Text>
          <Text className='stat-value primary'>{total.calories} <Text className='stat-unit'>kcal</Text></Text>
        </View>
        <View className='stat-card'>
          <Text className='stat-label'>蛋白质</Text>
          <Text className='stat-value green'>{total.protein}<Text className='stat-unit'>g</Text></Text>
        </View>
        <View className='stat-card'>
          <Text className='stat-label'>碳水</Text>
          <Text className='stat-value blue'>{total.carbs}<Text className='stat-unit'>g</Text></Text>
        </View>
        <View className='stat-card'>
          <Text className='stat-label'>脂肪</Text>
          <Text className='stat-value yellow'>{total.fat}<Text className='stat-unit'>g</Text></Text>
        </View>
      </View>

      {/* Weekly Chart */}
      <View className='card'>
        <Text className='card-title'>7日热量趋势</Text>
        <View className='chart-bar'>
          {weeklyStats.length > 0 ? weeklyStats.map((s: any, i: number) => {
            const maxCal = Math.max(...weeklyStats.map((x: any) => x.total_calories), 1)
            const h = Math.max(8, (s.total_calories / maxCal) * 200)
            return (
              <View key={i} className='bar-item'>
                <Text className='bar-value'>{s.total_calories}</Text>
                <View className='bar' style={{ height: `${h}rpx`, opacity: 0.3 + (s.total_calories / maxCal) * 0.7 }} />
                <Text className='bar-date'>{s.date.slice(5)}</Text>
              </View>
            )
          }) : (
            <Text className='text-muted' style={{ textAlign: 'center', width: '100%' }}>暂无数据，开始记录饮食吧</Text>
          )}
        </View>
      </View>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <View className='card rec-card'>
          <View className='card-header'>
            <Text className='card-title'>AI 推荐</Text>
            <Text className='link' onClick={() => handleNavigate('/pages/recommendations/index')}>更多 &gt;</Text>
          </View>
          {recommendations.slice(0, 3).map((food: any, idx: number) => (
            <View key={idx} className='rec-item'>
              <Text className='rec-name'>{food.name}</Text>
              <Text className='rec-cal'>{food.calories} kcal/100g</Text>
            </View>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View className='quick-actions'>
        <View className='action-btn' onClick={() => handleNavigate('/pages/diary/index')}>
          <Text className='action-icon'>📝</Text>
          <Text className='action-text'>记录饮食</Text>
        </View>
        <View className='action-btn' onClick={() => handleNavigate('/pages/foods/index')}>
          <Text className='action-icon'>🔍</Text>
          <Text className='action-text'>搜索食物</Text>
        </View>
        <View className='action-btn' onClick={() => handleNavigate('/pages/calculator/index')}>
          <Text className='action-icon'>🧮</Text>
          <Text className='action-text'>身体计算</Text>
        </View>
        <View className='action-btn' onClick={() => handleNavigate('/pages/reports/index')}>
          <Text className='action-icon'>📊</Text>
          <Text className='action-text'>饮食报告</Text>
        </View>
      </View>
    </View>
  )
}
