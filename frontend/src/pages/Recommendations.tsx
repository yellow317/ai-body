import { useState, useEffect, useCallback } from 'react'
import { getDailyRecommendations, getMealPlan, addFoodEntry } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { toast } from '../components/Toast'
import type { Food, MealPlan } from '../types'

const MEAL_TYPES = [
  { key: '', label: '全部', icon: '🍽️', color: 'bg-gray-100' },
  { key: 'breakfast', label: '早餐', icon: '🌅', color: 'bg-yellow-50' },
  { key: 'lunch', label: '午餐', icon: '☀️', color: 'bg-green-50' },
  { key: 'dinner', label: '晚餐', icon: '🌙', color: 'bg-blue-50' },
  { key: 'snack', label: '加餐', icon: '🍪', color: 'bg-purple-50' },
]

export default function Recommendations() {
  const { profile } = useAuth()
  const [mealType, setMealType] = useState('')
  const [recommendations, setRecommendations] = useState<Food[]>([])
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [planCalories, setPlanCalories] = useState(profile?.target_calories || 2000)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [addingId, setAddingId] = useState<number | null>(null)

  const fetchRecommendations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDailyRecommendations(mealType || undefined, 12)
      setRecommendations(res.data.recommendations || [])
    } catch {
      setRecommendations([])
      toast('加载推荐失败', 'error')
    } finally {
      setLoading(false)
    }
  }, [mealType])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  const handleGeneratePlan = async () => {
    setGenerating(true)
    try {
      const res = await getMealPlan(planCalories)
      setMealPlan(res.data.plan)
    } catch {
      toast('生成计划失败，请重试', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleAddToDiary = async (foodId: number, foodName: string, mealType: string) => {
    setAddingId(foodId)
    try {
      const today = new Date().toISOString().split('T')[0]
      await addFoodEntry({ food_id: foodId, date: today, meal_type: mealType, quantity: 100 })
      setFeedbackMsg(`已添加「${foodName}」到饮食记录`)
      setTimeout(() => setFeedbackMsg(''), 2000)
    } catch {
      setFeedbackMsg('添加失败，请重试')
      setTimeout(() => setFeedbackMsg(''), 2000)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🤖 AI 智能推荐</h1>
          <p className="text-gray-500 text-sm mt-1">
            {profile?.goal === 'lose' ? '基于减脂目标智能推荐低卡高蛋白食物' :
             profile?.goal === 'gain' ? '基于增肌目标智能推荐高营养密度食物' :
             '基于健康维持目标智能推荐均衡食物'}
          </p>
        </div>
      </div>

      {/* Feedback toast */}
      {feedbackMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 text-green-700 rounded-lg text-sm animate-pulse">
          {feedbackMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meal Plan Generator */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-20">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🍱 生成饮食计划</h2>
            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-1 block">目标热量 (kcal/天)</label>
              <input
                type="number"
                value={planCalories}
                onChange={(e) => setPlanCalories(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                min={1000} max={5000}
              />
            </div>
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-3 rounded-lg hover:from-primary-700 hover:to-purple-700 disabled:opacity-50 font-medium"
            >
              {generating ? '🤖 AI 生成中...' : '🤖 生成智能饮食计划'}
            </button>

            {mealPlan && (
              <div className="mt-6 space-y-3">
                {MEAL_TYPES.filter(m => m.key).map((mt) => {
                  const meal = mealPlan[mt.key as keyof MealPlan]
                  if (!meal || meal.items.length === 0) return null
                  return (
                    <div key={mt.key} className={`rounded-lg p-3 ${mt.color}`}>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {mt.icon} {mt.label} · {meal.total_calories} kcal
                      </p>
                      <div className="space-y-1.5">
                        {meal.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-700">{item.name}</span>
                              <span className="text-gray-400 text-xs">{item.quantity}g</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-primary-600 font-medium">{item.calories} kcal</span>
                              <button
                                onClick={() => handleAddToDiary(item.food_id, item.name, mt.key)}
                                disabled={addingId === item.food_id}
                                className="text-xs bg-white px-2 py-0.5 rounded border border-gray-200 hover:bg-primary-50 hover:border-primary-200 disabled:opacity-50"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Food Recommendations */}
        <div className="lg:col-span-2">
          {/* Meal type tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {MEAL_TYPES.map((mt) => (
              <button
                key={mt.key}
                onClick={() => setMealType(mt.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mealType === mt.key
                    ? 'bg-primary-600 text-white shadow-md'
                    : `${mt.color} text-gray-600 hover:bg-gray-200`
                }`}
              >
                {mt.icon} {mt.label}
              </button>
            ))}
          </div>

          {/* Food cards */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendations.map((food, idx) => (
                <div
                  key={food.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <h3 className="font-semibold text-gray-800">{food.name}</h3>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 ml-8">
                        {food.category === 'staple' ? '主食' :
                         food.category === 'protein' ? '蛋白质' :
                         food.category === 'vegetable' ? '蔬菜' :
                         food.category === 'fruit' ? '水果' :
                         food.category === 'fat' ? '脂肪' :
                         food.category === 'beverage' ? '饮品' : food.category}
                      </p>
                    </div>
                    <span className="text-xl font-bold text-primary-600">{food.calories}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-center text-xs mb-3 ml-8">
                    <div className="bg-green-50 rounded p-1">
                      <p className="text-green-700 font-medium">{food.protein}g</p>
                      <p className="text-green-500 text-[10px]">蛋白</p>
                    </div>
                    <div className="bg-blue-50 rounded p-1">
                      <p className="text-blue-700 font-medium">{food.carbs}g</p>
                      <p className="text-blue-500 text-[10px]">碳水</p>
                    </div>
                    <div className="bg-yellow-50 rounded p-1">
                      <p className="text-yellow-700 font-medium">{food.fat}g</p>
                      <p className="text-yellow-500 text-[10px]">脂肪</p>
                    </div>
                    <div className="bg-purple-50 rounded p-1">
                      <p className="text-purple-700 font-medium">{food.fiber}g</p>
                      <p className="text-purple-500 text-[10px]">纤维</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-8">
                    <button
                      onClick={() => handleAddToDiary(food.id, food.name, mealType || 'snack')}
                      disabled={addingId === food.id}
                      className="flex-1 bg-primary-50 text-primary-700 px-4 py-2 rounded-lg text-sm hover:bg-primary-100 disabled:opacity-50 font-medium"
                    >
                      {addingId === food.id ? '添加中...' : '+ 记录饮食'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && recommendations.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-lg">暂无推荐</p>
              <p className="text-sm mt-1">设置身体数据可获取个性化推荐</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
