import { useState, useEffect } from 'react'
import { getDailyRecommendations, getMealPlan } from '../services/api'
import { useToast } from '../components/Toast'
import type { Food } from '../types'

const MEAL_FILTERS = [
  { key: '', label: '全部' },
  { key: 'breakfast', label: '早餐' },
  { key: 'lunch', label: '午餐' },
  { key: 'dinner', label: '晚餐' },
  { key: 'snack', label: '加餐' },
]

export default function Recommendations() {
  const { show: toast } = useToast()
  const [mealType, setMealType] = useState('')
  const [recommendations, setRecommendations] = useState<Food[]>([])
  const [mealPlan, setMealPlan] = useState<Record<string, Food[]>>({})
  const [loading, setLoading] = useState(true)
  const [showMealPlan, setShowMealPlan] = useState(false)

  const fetchRecommendations = async (type?: string) => {
    setLoading(true)
    try {
      const res = await getDailyRecommendations(type || undefined, 20)
      setRecommendations(res.data.recommendations || [])
    } catch { toast('加载推荐失败', 'error') }
    setLoading(false)
  }

  const fetchMealPlan = async () => {
    setLoading(true)
    try {
      const res = await getMealPlan()
      setMealPlan(res.data.meal_plan || res.data || {})
      setShowMealPlan(true)
    } catch { toast('加载饮食计划失败', 'error') }
    setLoading(false)
  }

  useEffect(() => { fetchRecommendations() }, [])

  const handleFilter = (type: string) => {
    setMealType(type)
    fetchRecommendations(type || undefined)
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      <div className="flex items-center justify-between py-3">
        <h1 className="text-xl font-bold text-gray-800">AI 推荐</h1>
        <button onClick={fetchMealPlan}
          className="text-sm text-primary-600 font-medium active:text-primary-700">
          {showMealPlan ? '刷新计划' : '饮食计划'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto hide-scrollbar">
        {MEAL_FILTERS.map(f => (
          <button key={f.key} onClick={() => handleFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              mealType === f.key ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 active:bg-gray-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
      ) : showMealPlan ? (
        <div className="space-y-4">
          <button onClick={() => setShowMealPlan(false)} className="text-sm text-primary-600">&larr; 返回推荐列表</button>
          {Object.entries(mealPlan).map(([meal, foods]) => (
            <div key={meal} className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm">
                {meal === 'breakfast' ? '🌅 早餐' : meal === 'lunch' ? '☀️ 午餐' : meal === 'dinner' ? '🌙 晚餐' : '🍪 加餐'}
              </h3>
              <div className="space-y-2">
                {Array.isArray(foods) && foods.map((food: Food, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5">
                    <span className="text-sm font-medium text-gray-800">{food.name}</span>
                    <span className="text-xs text-gray-500">{food.calories} kcal</span>
                  </div>
                ))}
                {(!Array.isArray(foods) || foods.length === 0) && <p className="text-xs text-gray-400">暂无推荐</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {recommendations.length > 0 ? recommendations.map((food) => (
            <div key={food.id} className="bg-white rounded-xl shadow-sm p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{food.name}</p>
                <p className="text-xs text-gray-400">蛋白 {food.protein}g · 碳水 {food.carbs}g · 脂肪 {food.fat}g</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary-600">{food.calories}</p>
                <p className="text-[10px] text-gray-400">kcal/100g</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🍽️</div>
              <p className="text-sm">暂无推荐数据</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
