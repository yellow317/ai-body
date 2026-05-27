import { useState, useEffect, useCallback } from 'react'
import { searchFoods, createCustomFood } from '../services/api'
import { useToast } from '../components/Toast'
import type { Food } from '../types'

const CATEGORIES = [
  { key: '', label: '全部', icon: '📋' },
  { key: 'staple', label: '主食', icon: '🍚' },
  { key: 'protein', label: '蛋白', icon: '🥩' },
  { key: 'vegetable', label: '蔬菜', icon: '🥬' },
  { key: 'fruit', label: '水果', icon: '🍎' },
  { key: 'fat', label: '脂肪', icon: '🥑' },
  { key: 'beverage', label: '饮品', icon: '🥤' },
]

export default function Foods() {
  const { show: toast } = useToast()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [foods, setFoods] = useState<Food[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [showCustom, setShowCustom] = useState(false)

  const limit = 12

  const fetchFoods = useCallback(async (p: number = 1) => {
    setLoading(true)
    try {
      const res = await searchFoods({ q: query || undefined, category: category || undefined, page: p, limit })
      setFoods(res.data.foods)
      setTotal(res.data.total)
      setPage(p)
    } catch { toast('加载失败', 'error') }
    setLoading(false)
  }, [query, category])

  useEffect(() => { fetchFoods(1) }, [fetchFoods])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      <div className="flex items-center justify-between py-3">
        <h1 className="text-xl font-bold text-gray-800">食物库</h1>
        <button onClick={() => setShowCustom(true)} className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium active:bg-primary-700">+ 自定义</button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-3 mb-3">
        <input
          type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索食物名称..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                category === cat.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
      ) : (
        <>
          <div className="space-y-2">
            {foods.map((food) => (
              <div key={food.id} onClick={() => setSelectedFood(food)}
                className="bg-white rounded-xl shadow-sm p-3 active:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{food.name}</p>
                    <span className="text-xs text-gray-400">{CATEGORIES.find(c => c.key === food.category)?.label || food.category}</span>
                  </div>
                  <span className="text-lg font-bold text-primary-600">{food.calories}<span className="text-xs text-gray-400 font-normal">/100g</span></span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                  <div className="bg-green-50 rounded p-1"><span className="text-green-700 font-medium">{food.protein}g</span> <span className="text-green-500">蛋白</span></div>
                  <div className="bg-blue-50 rounded p-1"><span className="text-blue-700 font-medium">{food.carbs}g</span> <span className="text-blue-500">碳水</span></div>
                  <div className="bg-yellow-50 rounded p-1"><span className="text-yellow-700 font-medium">{food.fat}g</span> <span className="text-yellow-500">脂肪</span></div>
                  <div className="bg-purple-50 rounded p-1"><span className="text-purple-700 font-medium">{food.fiber}g</span> <span className="text-purple-500">纤维</span></div>
                </div>
              </div>
            ))}
          </div>

          {foods.length === 0 && <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">🍽️</div><p className="text-sm">未找到匹配的食物</p></div>}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => fetchFoods(page - 1)} disabled={page <= 1} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-30">上一页</button>
              <span className="px-3 py-2 text-sm text-gray-500">{page}/{totalPages}</span>
              <button onClick={() => fetchFoods(page + 1)} disabled={page >= totalPages} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-30">下一页</button>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-3">共 {total} 种食物</p>
        </>
      )}

      {/* Food Detail */}
      {selectedFood && <FoodDetailModal food={selectedFood} onClose={() => setSelectedFood(null)} />}

      {/* Custom Food Modal */}
      {showCustom && <CustomFoodModal onClose={() => setShowCustom(false)} onAdded={() => fetchFoods(1)} />}
    </div>
  )
}

function FoodDetailModal({ food, onClose }: { food: Food; onClose: () => void }) {
  const macros = [
    { label: '蛋白质', value: food.protein, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '碳水', value: food.carbs, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '脂肪', value: food.fat, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: '纤维', value: food.fiber, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '糖', value: food.sugar, color: 'text-pink-600', bg: 'bg-pink-50' },
  ]
  const maxVal = Math.max(...macros.map(m => m.value), 1)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-800">{food.name}</h3>
          <button onClick={onClose} className="text-gray-400 text-xl p-1">✕</button>
        </div>
        <p className="text-xs text-gray-500 mb-3">{CATEGORIES.find(c => c.key === food.category)?.label || food.category} {food.is_custom && '· 自定义'}</p>
        <div className="text-center mb-4">
          <span className="text-3xl font-bold text-primary-600">{food.calories}</span>
          <span className="text-sm text-gray-500 ml-1">kcal / 100g</span>
        </div>
        <div className="space-y-2">
          {macros.map(m => (
            <div key={m.label}>
              <div className="flex justify-between text-xs mb-0.5"><span className="text-gray-600">{m.label}</span><span className={`font-medium ${m.color}`}>{m.value}g</span></div>
              <div className="w-full bg-gray-100 rounded-full h-2"><div className={`h-2 rounded-full ${m.bg}`} style={{ width: `${Math.min((m.value / maxVal) * 100, 100)}%`, opacity: 0.5 }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CustomFoodModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { show: toast } = useToast()
  const [custom, setCustom] = useState({ name: '', category: 'staple', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, serving_size: 100 })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!custom.name) return
    setSubmitting(true)
    try {
      await createCustomFood(custom)
      toast('添加成功', 'success')
      onClose()
      onAdded()
    } catch { toast('添加失败', 'error') }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">添加自定义食物</h3>
          <button onClick={onClose} className="text-gray-400 text-xl p-1">✕</button>
        </div>
        <div className="space-y-3">
          <input type="text" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} placeholder="食物名称 *" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          <select value={custom.category} onChange={(e) => setCustom({ ...custom, category: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
            {CATEGORIES.filter(c => c.key).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-gray-500">热量 (kcal/100g) *</label><input type="number" value={custom.calories || ''} onChange={(e) => setCustom({ ...custom, calories: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-0.5" /></div>
            <div><label className="text-xs text-gray-500">蛋白质 (g)</label><input type="number" value={custom.protein || ''} onChange={(e) => setCustom({ ...custom, protein: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-0.5" /></div>
            <div><label className="text-xs text-gray-500">碳水 (g)</label><input type="number" value={custom.carbs || ''} onChange={(e) => setCustom({ ...custom, carbs: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-0.5" /></div>
            <div><label className="text-xs text-gray-500">脂肪 (g)</label><input type="number" value={custom.fat || ''} onChange={(e) => setCustom({ ...custom, fat: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mt-0.5" /></div>
          </div>
          <button onClick={handleSubmit} disabled={submitting || !custom.name}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium active:bg-primary-700 disabled:opacity-50">
            {submitting ? '添加中...' : '添加食物'}
          </button>
        </div>
      </div>
    </div>
  )
}
