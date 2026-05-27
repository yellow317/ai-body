import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { getDailyRecommendations, getMealPlan } from '../../api'
import './index.scss'

const MEAL_FILTERS = [
  { key: '', label: '全部' },
  { key: 'breakfast', label: '早餐' },
  { key: 'lunch', label: '午餐' },
  { key: 'dinner', label: '晚餐' },
  { key: 'snack', label: '加餐' },
]

export default function Recommendations() {
  const [mealType, setMealType] = useState('')
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [mealPlan, setMealPlan] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [showMealPlan, setShowMealPlan] = useState(false)

  const fetchRecommendations = async (type?: string) => {
    setLoading(true)
    try {
      const res: any = await getDailyRecommendations(type || undefined, 20)
      setRecommendations(res.recommendations || [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  const fetchMealPlan = async () => {
    setLoading(true)
    try {
      const res: any = await getMealPlan()
      setMealPlan(res.meal_plan || res || {})
      setShowMealPlan(true)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchRecommendations() }, [])

  const handleFilter = (type: string) => {
    setMealType(type)
    fetchRecommendations(type || undefined)
  }

  return (
    <View className='page-container rec-page'>
      <View className='rec-header'>
        <Text className='rec-title'>AI 推荐</Text>
        <View className='meal-plan-btn' onClick={fetchMealPlan}>
          <Text className='meal-plan-btn-text'>{showMealPlan ? '刷新计划' : '饮食计划'}</Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView scrollX className='filter-scroll'>
        {MEAL_FILTERS.map(f => (
          <View key={f.key}
            className={`filter-pill ${mealType === f.key ? 'active' : ''}`}
            onClick={() => handleFilter(f.key)}>
            <Text>{f.label}</Text>
          </View>
        ))}
      </ScrollView>

      {loading ? (
        <View className='spinner-wrap'><View className='spinner'></View></View>
      ) : showMealPlan ? (
        <View>
          <View className='back-link' onClick={() => setShowMealPlan(false)}>
            <Text className='back-link-text'>&larr; 返回推荐列表</Text>
          </View>
          {Object.entries(mealPlan).map(([meal, foods]) => (
            <View key={meal} className='meal-plan-card'>
              <Text className='meal-plan-title'>
                {meal === 'breakfast' ? '🌅 早餐' : meal === 'lunch' ? '☀️ 午餐' : meal === 'dinner' ? '🌙 晚餐' : '🍪 加餐'}
              </Text>
              {Array.isArray(foods) && foods.length > 0 ? foods.map((food: any, idx: number) => (
                <View key={idx} className='mp-food-item'>
                  <Text className='mp-food-name'>{food.name}</Text>
                  <Text className='mp-food-cal'>{food.calories} kcal</Text>
                </View>
              )) : <Text className='empty-msg'>暂无推荐</Text>}
            </View>
          ))}
        </View>
      ) : (
        <View>
          {recommendations.length > 0 ? recommendations.map((food: any, idx: number) => (
            <View key={idx} className='rec-card-item'>
              <View className='rec-card-left'>
                <Text className='rec-food-name'>{food.name}</Text>
                <Text className='rec-food-meta'>蛋白 {food.protein}g · 碳水 {food.carbs}g · 脂肪 {food.fat}g</Text>
              </View>
              <View className='rec-card-right'>
                <Text className='rec-food-cal'>{food.calories}</Text>
                <Text className='rec-food-unit'>kcal/100g</Text>
              </View>
            </View>
          )) : (
            <View className='empty-wrap'>
              <Text className='empty-icon'>🍽️</Text>
              <Text className='empty-text'>暂无推荐数据</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}
