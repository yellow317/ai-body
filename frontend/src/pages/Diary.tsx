import { useState, useEffect, useCallback } from 'react'
import { getDailyEntries, addFoodEntry, deleteFoodEntry, searchFoods, createCustomFood, getFavoriteFoods } from '../services/api'
import { toast } from '../components/Toast'
import type { DailySummary, FoodEntry, Food } from '../types'

const MEAL_TYPES = [
  { key: 'breakfast', label: '早餐', color: 'bg-yellow-50 border-yellow-200', icon: '🌅' },
  { key: 'lunch', label: '午餐', color: 'bg-green-50 border-green-200', icon: '☀️' },
  { key: 'dinner', label: '晚餐', color: 'bg-blue-50 border-blue-200', icon: '🌙' },
  { key: 'snack', label: '加餐', color: 'bg-purple-50 border-purple-200', icon: '🍪' },
]

const CATEGORY_OPTIONS = [
  { value: '', label: '全部分类' },
  { value: 'staple', label: '主食' },
  { value: 'protein', label: '蛋白质' },
  { value: 'vegetable', label: '蔬菜' },
  { value: 'fruit', label: '水果' },
  { value: 'fat', label: '脂肪' },
  { value: 'beverage', label: '饮品' },
]

export default function Diary() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activeMealType, setActiveMealType] = useState('snack')

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDailyEntries(date)
      setSummary(res.data)
    } catch (err: unknown) {
      setSummary(null)
      const axiosErr = err as { response?: { status: number } }
      console.error('加载饮食记录失败:', axiosErr?.response?.status || err)
      if (axiosErr?.response?.status === 401) {
        toast('登录已过期，请重新登录', 'error')
      } else {
        toast('加载饮食记录失败，请检查网络连接', 'error')
      }
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const handleDelete = async (id: number) => {
    try {
      await deleteFoodEntry(id)
      fetchEntries()
      toast('已删除', 'success')
    } catch {
      toast('删除失败', 'error')
    }
  }

  const changeDate = (days: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    setDate(d.toISOString().split('T')[0])
  }

  const entries = summary?.entries || []
  const total = summary?.total || { calories: 0, protein: 0, carbs: 0, fat: 0 }

  const groupedEntries: Record<string, FoodEntry[]> = {}
  for (const mt of MEAL_TYPES) {
    groupedEntries[mt.key] = entries.filter((e) => e.meal_type === mt.key)
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">饮食记录</h1>
        <div className="flex items-center space-x-2">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-200 rounded-lg">◀</button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-200 rounded-lg">▶</button>
          <button onClick={() => setDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-2 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200">今天</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meals */}
        <div className="lg:col-span-2 space-y-3">
          {MEAL_TYPES.map((mt) => (
            <div key={mt.key} className={`rounded-xl border-2 p-4 ${mt.color}`}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-700">
                  <span className="mr-2">{mt.icon}</span>{mt.label}
                </h2>
                <button
                  onClick={() => { setActiveMealType(mt.key); setShowModal(true) }}
                  className="text-xs bg-white px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-100 shadow-sm"
                >
                  + 添加食物
                </button>
              </div>
              {groupedEntries[mt.key].length === 0 ? (
                <p className="text-sm text-gray-400 py-2">暂无记录</p>
              ) : (
                <div className="space-y-2">
                  {groupedEntries[mt.key].map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between bg-white/70 rounded-lg p-2">
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">{entry.food?.name || '食物'}</span>
                        <span className="text-sm text-gray-500 ml-2">{entry.quantity}g</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-primary-600">{entry.calories} kcal</span>
                        <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-semibold text-gray-800 mb-4">今日营养统计</h2>
            <div className="space-y-4">
              <StatItem label="总热量" value={total.calories} unit="kcal" target={2000} color="text-primary-600" />
              <StatItem label="蛋白质" value={total.protein} unit="g" target={60} color="text-green-600" />
              <StatItem label="碳水" value={total.carbs} unit="g" target={225} color="text-blue-600" />
              <StatItem label="脂肪" value={total.fat} unit="g" target={55} color="text-yellow-600" />
            </div>
          </div>

          {/* Calorie progress ring */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <h3 className="text-sm text-gray-500 mb-3">热量摄入进度</h3>
            <svg viewBox="0 0 100 100" className="w-32 h-32 mx-auto">
              <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="10" fill="none" />
              <circle cx="50" cy="50" r="40" stroke={total.calories > 2000 ? '#ef4444' : total.calories > 1600 ? '#eab308' : '#22c55e'}
                strokeWidth="10" fill="none" strokeLinecap="round"
                strokeDasharray={`${Math.min((total.calories / 2000) * 251, 251)} 251`}
                transform="rotate(-90 50 50)" />
              <text x="50" y="48" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1e293b">{total.calories}</text>
              <text x="50" y="64" textAnchor="middle" fontSize="10" fill="#9ca3af">/2000 kcal</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Add Food Modal */}
      {showModal && (
        <AddFoodModal
          mealType={activeMealType}
          date={date}
          onClose={() => setShowModal(false)}
          onAdded={fetchEntries}
        />
      )}
    </div>
  )
}

function StatItem({ label, value, unit, target, color }: {
  label: string; value: number; unit: string; target: number; color: string
}) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={`font-semibold ${color}`}>{value} {unit}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function AddFoodModal({ mealType, date, onClose, onAdded }: {
  mealType: string; date: string; onClose: () => void; onAdded: () => void
}) {
  const [tab, setTab] = useState<'search' | 'custom'>('search')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [foods, setFoods] = useState<Food[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [quantity, setQuantity] = useState<Record<number, number>>({})
  const [adding, setAdding] = useState(false)
  const [favoriteFoods, setFavoriteFoods] = useState<Food[]>([])

  const [custom, setCustom] = useState({ name: '', category: 'staple', calories: 0, protein: 0, carbs: 0, fat: 0, serving_size: 100 })

  const doSearch = useCallback(async (p: number = 1) => {
    try {
      const res = await searchFoods({ q: query || undefined, category: category || undefined, page: p, limit: 10 })
      setFoods(res.data.foods)
      setTotal(res.data.total)
      setPage(p)
    } catch {
      toast('搜索食物失败', 'error')
    }
  }, [query, category])

  useEffect(() => {
    doSearch()
    // Load favorites
    getFavoriteFoods().then((res) => setFavoriteFoods(res.data.foods || [])).catch(() => {})
  }, [doSearch])

  const handleAdd = async (foodId: number) => {
    const qty = quantity[foodId] || 100
    setAdding(true)
    try {
      await addFoodEntry({ food_id: foodId, date, meal_type: mealType, quantity: qty })
      toast('添加成功', 'success')
      onClose()
      onAdded()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } }
      const detail = axiosErr?.response?.data?.detail || ''
      const status = axiosErr?.response?.status || 0
      console.error('添加食物失败:', status, detail, err)
      if (status === 404) {
        toast('食物不存在，请刷新页面后重试', 'error')
      } else if (status === 422) {
        toast('数据格式错误: ' + (detail || '请检查输入'), 'error')
      } else {
        toast('添加失败: ' + (detail || '请检查网络连接'), 'error')
      }
    }
    setAdding(false)
  }

  const handleCustomSubmit = async () => {
    if (!custom.name || !custom.calories) {
      toast('请填写食物名称和热量', 'error')
      return
    }
    setAdding(true)
    try {
      const res = await createCustomFood(custom)
      const foodId = res.data.id
      await addFoodEntry({ food_id: foodId, date, meal_type: mealType, quantity: 100 })
      toast('添加成功', 'success')
      onClose()
      onAdded()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } }
      const detail = axiosErr?.response?.data?.detail || ''
      console.error('添加自定义食物失败:', detail, err)
      toast('添加失败: ' + (detail || '请检查网络连接'), 'error')
    }
    setAdding(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">添加食物 - {MEAL_TYPES.find(m => m.key === mealType)?.label}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button onClick={() => setTab('search')}
              className={`px-4 py-2 text-sm font-medium ${tab === 'search' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}>搜索食物</button>
            <button onClick={() => setTab('custom')}
              className={`px-4 py-2 text-sm font-medium ${tab === 'custom' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}>自定义食物</button>
          </div>

          {tab === 'search' ? (
            <>
              {/* Favorites quick-access */}
              {favoriteFoods.length > 0 && query === '' && category === '' && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2 flex items-center">
                    <span className="mr-1">❤️</span>我的收藏
                  </p>
                  <div className="space-y-1">
                    {favoriteFoods.slice(0, 5).map((food) => (
                      <div key={food.id} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg p-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 text-sm">{food.name}</p>
                          <p className="text-xs text-gray-500">{food.calories} kcal/100g</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="number" value={quantity[food.id] || 100} min={10} max={1000}
                            onChange={(e) => setQuantity({ ...quantity, [food.id]: Number(e.target.value) })}
                            className="w-14 px-1.5 py-1 border border-gray-300 rounded text-xs" />
                          <span className="text-xs text-gray-500">g</span>
                          <button onClick={() => handleAdd(food.id)} disabled={adding}
                            className="px-2.5 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 disabled:opacity-50">添加</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 mb-4">
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索食物..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                {foods.map((food) => (
                  <div key={food.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{food.name}</p>
                      <p className="text-xs text-gray-500">{food.calories} kcal/100g | 蛋白 {food.protein}g | 碳水 {food.carbs}g | 脂肪 {food.fat}g</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="number" value={quantity[food.id] || 100} min={10} max={1000}
                        onChange={(e) => setQuantity({ ...quantity, [food.id]: Number(e.target.value) })}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                      <span className="text-xs text-gray-500">g</span>
                      <button onClick={() => handleAdd(food.id)} disabled={adding}
                        className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">添加</button>
                    </div>
                  </div>
                ))}
                {foods.length === 0 && <p className="text-center text-gray-400 py-8">未找到食物</p>}
              </div>
              {total > 10 && (
                <div className="flex justify-center space-x-2 mt-4">
                  <button onClick={() => doSearch(page - 1)} disabled={page <= 1}
                    className="px-3 py-1 text-sm border rounded-lg disabled:opacity-30">上一页</button>
                  <span className="px-3 py-1 text-sm text-gray-600">{page} / {Math.ceil(total / 10)}</span>
                  <button onClick={() => doSearch(page + 1)} disabled={page * 10 >= total}
                    className="px-3 py-1 text-sm border rounded-lg disabled:opacity-30">下一页</button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <input type="text" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })}
                placeholder="食物名称" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <select value={custom.category} onChange={(e) => setCustom({ ...custom, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {CATEGORY_OPTIONS.filter(o => o.value !== '').map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={custom.calories} onChange={(e) => setCustom({ ...custom, calories: Number(e.target.value) })}
                  placeholder="热量(kcal/100g)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input type="number" value={custom.protein} onChange={(e) => setCustom({ ...custom, protein: Number(e.target.value) })}
                  placeholder="蛋白质(g)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input type="number" value={custom.carbs} onChange={(e) => setCustom({ ...custom, carbs: Number(e.target.value) })}
                  placeholder="碳水(g)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input type="number" value={custom.fat} onChange={(e) => setCustom({ ...custom, fat: Number(e.target.value) })}
                  placeholder="脂肪(g)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <button onClick={handleCustomSubmit} disabled={adding || !custom.name}
                className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {adding ? '添加中...' : '添加自定义食物'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
