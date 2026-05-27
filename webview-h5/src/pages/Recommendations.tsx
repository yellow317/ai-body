import { useState, useEffect } from 'react'
import { getDailyRecommendations, getMealPlan, addFoodEntry } from '../services/api'
import { useAuth } from '../hooks/useAuth'
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
  const { profile } = useAuth()
  const [mealType, setMealType] = useState('')
  const [recommendations, setRecommendations] = useState<Food[]>([])
  const [mealPlan, setMealPlan] = useState<Record<string, Food[]>>({})
  const [loading, setLoading] = useState(true)
  const [showMealPlan, setShowMealPlan] = useState(false)
  const [targetCalories, setTargetCalories] = useState(profile?.target_calories || 1800)
  const [adding, setAdding] = useState<number | null>(null)

  const goalText = profile?.goal === 'lose' ? '减脂' : profile?.goal === 'gain' ? '增肌' : '保持体重'
  const goalDesc = profile?.goal === 'lose'
    ? `基于${goalText}目标，推荐低热量高蛋白食物`
    : profile?.goal === 'gain'
    ? `基于${goalText}目标，推荐富含优质蛋白和碳水的食物`
    : `基于${goalText}目标，推荐均衡营养的食物`

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
      const res = await getMealPlan(targetCalories)
      setMealPlan(res.data.meal_plan || res.data || {})
      setShowMealPlan(true)
    } catch {
      toast('加载饮食计划失败', 'error')
    }
    setLoading(false)
  }

  useEffect(() => { fetchRecommendations() }, [])

  const handleFilter = (type: string) => {
    setMealType(type)
    fetchRecommendations(type || undefined)
  }

  const handleAddToDiary = async (food: Food) => {
    setAdding(food.id)
    try {
      const today = new Date().toISOString().split('T')[0]
      await addFoodEntry({ food_id: food.id, date: today, meal_type: mealType || 'snack', quantity: 100 })
      toast(`${food.name} 已添加到日记`, 'success')
    } catch { toast('添加失败', 'error') }
    setAdding(null)
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

      {/* Goal description */}
      {profile?.goal && (
        <p className="text-xs text-gray-500 mb-3 bg-primary-50 rounded-lg px-3 py-2">{goalDesc}</p>
      )}

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
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setShowMealPlan(false)} className="text-sm text-primary-600">&larr; 返回推荐列表</button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-500">目标热量:</span>
              <input type="number" value={targetCalories} onChange={(e) => setTargetCalories(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center" />
              <button onClick={fetchMealPlan} className="text-xs bg-primary-600 text-white px-2 py-1 rounded-lg">更新</button>
            </div>
          </div>
          {Object.entries(mealPlan).map(([meal, foods]) => (
            <div key={meal} className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm">
                {meal === 'breakfast' ? '🌅 早餐' : meal === 'lunch' ? '☀️ 午餐' : meal === 'dinner' ? '🌙 晚餐' : '🍪 加餐'}
              </h3>
              <div className="space-y-2">
                {Array.isArray(foods) && foods.map((food: Food, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5">
                    <div>
                      <span className="text-sm font-medium text-gray-800">{food.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{food.calories} kcal</span>
                    </div>
                    <button onClick={() => handleAddToDiary(food)} disabled={adding === food.id}
                      className="text-xs bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full font-medium active:bg-primary-100 disabled:opacity-50">
                      {adding === food.id ? '...' : '+ 记录'}
                    </button>
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
              <div className="text-right flex items-center gap-2">
                <div>
                  <p className="text-lg font-bold text-primary-600">{food.calories}</p>
                  <p className="text-[10px] text-gray-400">kcal/100g</p>
                </div>
                <button onClick={() => handleAddToDiary(food)} disabled={adding === food.id}
                  className="text-xs bg-primary-600 text-white px-2.5 py-1.5 rounded-lg font-medium active:bg-primary-700 disabled:opacity-50 whitespace-nowrap">
                  {adding === food.id ? '...' : '+ 记录饮食'}
                </button>
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
