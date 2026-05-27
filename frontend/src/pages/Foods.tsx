import { useState, useEffect, useCallback } from 'react'
import { searchFoods, createCustomFood, getFavoriteFoods, addFavoriteFood, removeFavoriteFood } from '../services/api'
import { toast } from '../components/Toast'
import type { Food } from '../types'

const CATEGORIES = [
  { key: '', label: '全部', color: 'bg-gray-100 text-gray-700', icon: '📋' },
  { key: 'staple', label: '主食', color: 'bg-yellow-100 text-yellow-700', icon: '🍚' },
  { key: 'protein', label: '蛋白质', color: 'bg-red-100 text-red-700', icon: '🥩' },
  { key: 'vegetable', label: '蔬菜', color: 'bg-green-100 text-green-700', icon: '🥬' },
  { key: 'fruit', label: '水果', color: 'bg-pink-100 text-pink-700', icon: '🍎' },
  { key: 'fat', label: '脂肪', color: 'bg-purple-100 text-purple-700', icon: '🥑' },
  { key: 'beverage', label: '饮品', color: 'bg-cyan-100 text-cyan-700', icon: '🥤' },
]

export default function Foods() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)
  const [foods, setFoods] = useState<Food[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [custom, setCustom] = useState({
    name: '', category: 'staple', calories: 0, protein: 0, carbs: 0, fat: 0,
    fiber: 0, sugar: 0, serving_size: 100,
  })
  const [submitting, setSubmitting] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())
  const [favoriteFoods, setFavoriteFoods] = useState<Food[]>([])

  const limit = 12

  const fetchFoods = useCallback(async (p: number = 1) => {
    setLoading(true)
    try {
      const res = await searchFoods({
        q: query || undefined,
        category: category || undefined,
        page: p,
        limit,
      })
      const fetchedFoods: Food[] = res.data.foods
      setFoods(fetchedFoods)
      setTotal(res.data.total)
      setPage(p)
      // Track which are favorited from search results
      const ids = new Set<number>()
      fetchedFoods.forEach((f) => { if (f.is_favorited) ids.add(f.id) })
      setFavoriteIds(ids)
    } catch {
      setFoods([])
      setTotal(0)
      toast('加载食物数据失败', 'error')
    } finally {
      setLoading(false)
    }
  }, [query, category])

  const fetchFavorites = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getFavoriteFoods()
      const favs: Food[] = res.data.foods
      setFavoriteFoods(favs)
      const ids = new Set<number>()
      favs.forEach((f) => ids.add(f.id))
      setFavoriteIds(ids)
    } catch {
      setFavoriteFoods([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (showFavorites) {
      fetchFavorites()
    } else {
      fetchFoods(1)
    }
  }, [showFavorites, fetchFavorites, fetchFoods])

  const handleToggleFavorite = async (food: Food, e: React.MouseEvent) => {
    e.stopPropagation()
    const isFav = favoriteIds.has(food.id)
    try {
      if (isFav) {
        await removeFavoriteFood(food.id)
        setFavoriteIds((prev) => { const next = new Set(prev); next.delete(food.id); return next })
        setFavoriteFoods((prev) => prev.filter((f) => f.id !== food.id))
        toast('已取消收藏', 'success')
      } else {
        await addFavoriteFood(food.id)
        setFavoriteIds((prev) => { const next = new Set(prev); next.add(food.id); return next })
        if (showFavorites) {
          setFavoriteFoods((prev) => [...prev, { ...food, is_favorited: true }])
        }
        toast('已收藏', 'success')
      }
      // Update in food list too
      setFoods((prev) => prev.map((f) => f.id === food.id ? { ...f, is_favorited: !isFav } : f))
    } catch {
      toast('操作失败', 'error')
    }
  }

  const totalPages = Math.ceil((showFavorites ? favoriteFoods.length : total) / limit)

  const handleCustomSubmit = async () => {
    if (!custom.name) return
    setSubmitting(true)
    try {
      await createCustomFood(custom)
      toast('添加成功', 'success')
      setShowCustom(false)
      setCustom({ name: '', category: 'staple', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, serving_size: 100 })
      if (showFavorites) fetchFavorites()
      else fetchFoods(1)
    } catch {
      toast('添加失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const displayedFoods = showFavorites ? favoriteFoods : foods

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">食物库</h1>
        <button
          onClick={() => setShowCustom(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium"
        >
          + 自定义食物
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowFavorites(false) }}
              placeholder="搜索食物名称..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Category pills + Favorites tab */}
        <div className="flex flex-wrap gap-2 mt-3">
          {/* Favorites tab */}
          <button
            onClick={() => { setShowFavorites(true); setCategory('') }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              showFavorites
                ? 'bg-red-500 text-white'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            <span className="mr-1">❤️</span>我的收藏
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => { setCategory(cat.key); setShowFavorites(false) }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat.key && !showFavorites
                  ? 'bg-primary-600 text-white'
                  : `${cat.color} hover:opacity-80`
              }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedFoods.map((food) => (
              <div
                key={food.id}
                onClick={() => setSelectedFood(food)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer relative group"
              >
                {/* Favorite button */}
                <button
                  onClick={(e) => handleToggleFavorite(food, e)}
                  className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${
                    favoriteIds.has(food.id)
                      ? 'text-red-500 bg-red-50'
                      : 'text-gray-300 hover:text-red-400 bg-transparent hover:bg-red-50 opacity-0 group-hover:opacity-100'
                  }`}
                  title={favoriteIds.has(food.id) ? '取消收藏' : '收藏'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill={favoriteIds.has(food.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>

                <div className="flex items-start justify-between mb-3">
                  <div className="pr-8">
                    <p className="font-semibold text-gray-800">{food.name}</p>
                    <span className="text-xs text-gray-400">
                      {CATEGORIES.find(c => c.key === food.category)?.icon} {CATEGORIES.find(c => c.key === food.category)?.label || food.category}
                      {food.is_custom && <span className="ml-1 text-[10px] bg-gray-100 px-1 rounded">自定义</span>}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-primary-600 flex-shrink-0">{food.calories}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center text-xs">
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
                <p className="text-[10px] text-gray-400 mt-2 text-right">每100g</p>
              </div>
            ))}
          </div>

          {displayedFoods.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">{showFavorites ? '💔' : '🍽️'}</div>
              <p>{showFavorites ? '还没有收藏任何食物，点击食物卡片上的心形图标收藏吧' : '未找到匹配的食物'}</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <button
                onClick={() => showFavorites ? null : fetchFoods(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 text-sm border rounded-lg disabled:opacity-30 hover:bg-gray-50"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => showFavorites ? null : fetchFoods(p)}
                  className={`w-10 h-10 text-sm rounded-lg ${
                    p === page ? 'bg-primary-600 text-white' : 'border hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => showFavorites ? null : fetchFoods(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 text-sm border rounded-lg disabled:opacity-30 hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-4">
            共 {showFavorites ? favoriteFoods.length : total} 种食物
          </p>
        </>
      )}

      {/* Food Detail Modal */}
      {selectedFood && (
        <FoodDetailModal
          food={selectedFood}
          isFavorited={favoriteIds.has(selectedFood.id)}
          onToggleFavorite={(food) => handleToggleFavorite(food, { stopPropagation: () => {} } as React.MouseEvent)}
          onClose={() => setSelectedFood(null)}
        />
      )}

      {/* Custom Food Modal */}
      {showCustom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">添加自定义食物</h3>
                <button onClick={() => setShowCustom(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={custom.name}
                  onChange={(e) => setCustom({ ...custom, name: e.target.value })}
                  placeholder="食物名称 *"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
                <select
                  value={custom.category}
                  onChange={(e) => setCustom({ ...custom, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {CATEGORIES.filter(c => c.key !== '').map((cat) => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">热量 (kcal/100g) *</label>
                    <input type="number" value={custom.calories || ''} onChange={(e) => setCustom({ ...custom, calories: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">蛋白质 (g)</label>
                    <input type="number" value={custom.protein || ''} onChange={(e) => setCustom({ ...custom, protein: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">碳水 (g)</label>
                    <input type="number" value={custom.carbs || ''} onChange={(e) => setCustom({ ...custom, carbs: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">脂肪 (g)</label>
                    <input type="number" value={custom.fat || ''} onChange={(e) => setCustom({ ...custom, fat: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">纤维 (g)</label>
                    <input type="number" value={custom.fiber || ''} onChange={(e) => setCustom({ ...custom, fiber: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">糖 (g)</label>
                    <input type="number" value={custom.sugar || ''} onChange={(e) => setCustom({ ...custom, sugar: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
                <button
                  onClick={handleCustomSubmit}
                  disabled={submitting || !custom.name}
                  className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
                >
                  {submitting ? '添加中...' : '添加食物'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FoodDetailModal({ food, isFavorited, onToggleFavorite, onClose }: {
  food: Food; isFavorited: boolean; onToggleFavorite: (food: Food) => void; onClose: () => void
}) {
  const macronutrients = [
    { label: '热量', value: food.calories, unit: 'kcal', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: '蛋白质', value: food.protein, unit: 'g', color: 'text-green-600', bg: 'bg-green-50' },
    { label: '碳水', value: food.carbs, unit: 'g', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '脂肪', value: food.fat, unit: 'g', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: '纤维', value: food.fiber, unit: 'g', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '糖', value: food.sugar, unit: 'g', color: 'text-pink-600', bg: 'bg-pink-50' },
  ]

  const maxVal = Math.max(...macronutrients.filter(m => m.label !== '热量').map(m => m.value), 1)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-gray-800">{food.name}</h3>
                <button
                  onClick={() => onToggleFavorite(food)}
                  className={`p-1 rounded-full ${isFavorited ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
                  title={isFavorited ? '取消收藏' : '收藏'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500">
                {CATEGORIES.find(c => c.key === food.category)?.icon} {CATEGORIES.find(c => c.key === food.category)?.label || food.category}
                {food.is_custom && <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">自定义</span>}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          <div className="text-center mb-4">
            <span className="text-3xl font-bold text-primary-600">{food.calories}</span>
            <span className="text-sm text-gray-500 ml-1">kcal / 100g</span>
          </div>

          {/* Macro bars */}
          <div className="space-y-3">
            {macronutrients.filter(m => m.label !== '热量').map((macro) => (
              <div key={macro.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{macro.label}</span>
                  <span className={`font-medium ${macro.color}`}>{macro.value}g</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${macro.bg.replace('bg-', 'bg-').replace('-50', '-400')}`}
                    style={{ width: `${Math.min((macro.value / maxVal) * 100, 100)}%`, opacity: 0.5 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
