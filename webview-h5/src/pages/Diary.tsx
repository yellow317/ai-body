import { useState, useEffect, useCallback } from 'react'
import { getDailyEntries, addFoodEntry, deleteFoodEntry, searchFoods, createCustomFood, getFavoriteFoods } from '../services/api'
import { useToast } from '../components/Toast'
import type { DailySummary, FoodEntry, Food } from '../types'

const MEAL_TYPES = [
  { key: 'breakfast', label: '早餐', icon: '🌅', color: 'border-l-yellow-400' },
  { key: 'lunch', label: '午餐', icon: '☀️', color: 'border-l-green-400' },
  { key: 'dinner', label: '晚餐', icon: '🌙', color: 'border-l-blue-400' },
  { key: 'snack', label: '加餐', icon: '🍪', color: 'border-l-purple-400' },
]

const CATEGORIES = [
  { value: '', label: '全部' },
  { value: 'staple', label: '主食' },
  { value: 'protein', label: '蛋白质' },
  { value: 'vegetable', label: '蔬菜' },
  { value: 'fruit', label: '水果' },
  { value: 'fat', label: '脂肪' },
  { value: 'beverage', label: '饮品' },
]

export default function Diary() {
  const { show: toast } = useToast()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDailyEntries(date)
      setSummary(res.data)
    } catch {
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const handleDelete = async (id: number) => {
    try {
      await deleteFoodEntry(id)
      fetchEntries()
      toast('已删除', 'success')
    } catch { toast('删除失败', 'error') }
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
    <div className="max-w-lg lg:max-w-4xl xl:max-w-6xl mx-auto px-4 lg:px-6 pb-24">
      {/* Date picker */}
      <div className="flex items-center justify-between py-3">
        <button onClick={() => changeDate(-1)} className="p-2 text-gray-500 active:text-primary-600 text-lg">◀</button>
        <div className="text-center">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="text-sm font-semibold text-gray-800 bg-transparent text-center focus:outline-none" />
          <button onClick={() => setDate(new Date().toISOString().split('T')[0])}
            className="block text-[10px] text-primary-500 mx-auto mt-1">回到今天</button>
        </div>
        <button onClick={() => changeDate(1)} className="p-2 text-gray-500 active:text-primary-600 text-lg">▶</button>
      </div>

      {/* Stats bar */}
      <div className="flex justify-around bg-white rounded-xl shadow-sm p-3 mb-3 text-center">
        <div><p className="text-[10px] text-gray-500">热量</p><p className="text-sm font-bold text-primary-600">{total.calories}</p></div>
        <div><p className="text-[10px] text-gray-500">蛋白</p><p className="text-sm font-bold text-green-600">{total.protein}g</p></div>
        <div><p className="text-[10px] text-gray-500">碳水</p><p className="text-sm font-bold text-blue-600">{total.carbs}g</p></div>
        <div><p className="text-[10px] text-gray-500">脂肪</p><p className="text-sm font-bold text-yellow-600">{total.fat}g</p></div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {MEAL_TYPES.map((mt) => (
            <div key={mt.key} className={`bg-white rounded-xl shadow-sm border-l-4 ${mt.color} p-3`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700 text-sm">
                  <span className="mr-1.5">{mt.icon}</span>{mt.label}
                </h3>
                <AddButton
                  mealType={mt.key}
                  date={date}
                  onAdded={fetchEntries}
                />
              </div>
              {groupedEntries[mt.key].length === 0 ? (
                <p className="text-xs text-gray-400 py-2">暂无记录</p>
              ) : (
                groupedEntries[mt.key].map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{entry.food?.name || '食物'}</p>
                      <p className="text-xs text-gray-500">{entry.quantity}g</p>
                    </div>
                    <span className="text-sm font-semibold text-primary-600 mr-2">{entry.calories} kcal</span>
                    <button onClick={() => handleDelete(entry.id)} className="text-red-400 active:text-red-600 p-1">✕</button>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AddButton({ mealType, date, onAdded }: { mealType: string; date: string; onAdded: () => void }) {
  const { show: toast } = useToast()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'search' | 'custom'>('search')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [foods, setFoods] = useState<Food[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [quantity, setQuantity] = useState<Record<number, number>>({})
  const [adding, setAdding] = useState(false)
  const [custom, setCustom] = useState({ name: '', category: 'staple', calories: 0, protein: 0, carbs: 0, fat: 0, serving_size: 100 })
  const [favorites, setFavorites] = useState<Food[]>([])

  const doSearch = useCallback(async (p: number = 1) => {
    try {
      const res = await searchFoods({ q: query || undefined, category: category || undefined, page: p, limit: 10 })
      setFoods(res.data.foods)
      setTotal(res.data.total)
      setPage(p)
    } catch { toast('搜索失败', 'error') }
  }, [query, category])

  useEffect(() => {
    if (open) {
      doSearch()
      getFavoriteFoods().then(res => setFavorites(res.data.foods || [])).catch(() => {})
    }
  }, [doSearch, open])

  const showFavorites = !query && !category && favorites.length > 0

  const handleAdd = async (foodId: number) => {
    const qty = quantity[foodId] || 100
    setAdding(true)
    try {
      await addFoodEntry({ food_id: foodId, date, meal_type: mealType, quantity: qty })
      toast('添加成功', 'success')
      setOpen(false)
      onAdded()
    } catch { toast('添加失败', 'error') }
    setAdding(false)
  }

  const handleCustomSubmit = async () => {
    if (!custom.name || !custom.calories) { toast('请填写食物名称和热量', 'error'); return }
    setAdding(true)
    try {
      const res = await createCustomFood(custom)
      await addFoodEntry({ food_id: res.data.id, date, meal_type: mealType, quantity: 100 })
      toast('添加成功', 'success')
      setOpen(false)
      onAdded()
    } catch { toast('添加失败', 'error') }
    setAdding(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs bg-primary-50 text-primary-600 px-3 py-1 rounded-full active:bg-primary-100 font-medium">
        + 添加
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">添加食物</h3>
                <button onClick={() => setOpen(false)} className="text-gray-400 text-xl p-1">✕</button>
              </div>

              <div className="flex border-b mb-4">
                <button onClick={() => setTab('search')} className={`px-4 py-2 text-sm font-medium ${tab === 'search' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}>搜索</button>
                <button onClick={() => setTab('custom')} className={`px-4 py-2 text-sm font-medium ${tab === 'custom' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}>自定义</button>
              </div>

              {tab === 'search' ? (
                <>
                  <div className="flex gap-2 mb-3">
                    <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索食物..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-2 py-2 border border-gray-200 rounded-lg text-sm">
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>

                  {/* Favorites quick-add */}
                  {showFavorites && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1.5">❤️ 我的收藏</p>
                      <div className="flex flex-wrap gap-1.5">
                        {favorites.slice(0, 5).map(food => (
                          <button key={food.id} onClick={() => handleAdd(food.id)} disabled={adding}
                            className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-full font-medium active:bg-red-100 transition-colors">
                            {food.name} · {food.calories}kcal
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {foods.map(food => (
                      <div key={food.id} className="flex items-center justify-between border rounded-lg p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{food.name}</p>
                          <p className="text-xs text-gray-500">{food.calories} kcal/100g</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <input type="number" value={quantity[food.id] || 100} min={10} max={1000}
                            onChange={(e) => setQuantity({ ...quantity, [food.id]: Number(e.target.value) })}
                            className="w-14 px-1.5 py-1 border border-gray-200 rounded text-sm" />
                          <button onClick={() => handleAdd(food.id)} disabled={adding}
                            className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg active:bg-primary-700 disabled:opacity-50">添加</button>
                        </div>
                      </div>
                    ))}
                    {foods.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">未找到食物</p>}
                  </div>
                  {total > 10 && (
                    <div className="flex justify-center gap-2 mt-3">
                      <button onClick={() => doSearch(page - 1)} disabled={page <= 1} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-30">上一页</button>
                      <span className="px-3 py-1 text-sm text-gray-500">{page}/{Math.ceil(total / 10)}</span>
                      <button onClick={() => doSearch(page + 1)} disabled={page * 10 >= total} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-30">下一页</button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <input type="text" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} placeholder="食物名称" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <select value={custom.category} onChange={(e) => setCustom({ ...custom, category: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    {CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={custom.calories || ''} onChange={(e) => setCustom({ ...custom, calories: Number(e.target.value) })} placeholder="热量(kcal/100g)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    <input type="number" value={custom.protein || ''} onChange={(e) => setCustom({ ...custom, protein: Number(e.target.value) })} placeholder="蛋白质(g)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    <input type="number" value={custom.carbs || ''} onChange={(e) => setCustom({ ...custom, carbs: Number(e.target.value) })} placeholder="碳水(g)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    <input type="number" value={custom.fat || ''} onChange={(e) => setCustom({ ...custom, fat: Number(e.target.value) })} placeholder="脂肪(g)" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <button onClick={handleCustomSubmit} disabled={adding || !custom.name}
                    className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium active:bg-primary-700 disabled:opacity-50">
                    {adding ? '添加中...' : '添加自定义食物'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
