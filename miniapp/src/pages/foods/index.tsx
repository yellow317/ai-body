import { useState, useEffect, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import { searchFoods, createCustomFood } from '../../api'
import './index.scss'

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
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [foods, setFoods] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [showCustom, setShowCustom] = useState(false)

  const limit = 12

  const fetchFoods = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res: any = await searchFoods({ q: query || undefined, category: category || undefined, page: p, limit })
      setFoods(res.foods || [])
      setTotal(res.total || 0)
      setPage(p)
    } catch { setFoods([]); setTotal(0) }
    setLoading(false)
  }, [query, category])

  useEffect(() => { fetchFoods(1) }, [fetchFoods])

  const totalPages = Math.ceil(total / limit)

  return (
    <View className='page-container foods-page'>
      {/* Search */}
      <View className='search-card'>
        <Input className='food-search-input' placeholder='搜索食物名称...' value={query}
          onInput={(e: any) => setQuery(e.detail.value)}
          onConfirm={() => fetchFoods()} />
        <ScrollView scrollX className='cat-scroll'>
          {CATEGORIES.map(cat => (
            <View key={cat.key}
              className={`cat-pill ${category === cat.key ? 'active' : ''}`}
              onClick={() => setCategory(cat.key)}>
              <Text>{cat.icon} {cat.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className='header-row'>
        <Text className='result-count'>共 {total} 种食物</Text>
        <View className='custom-btn' onClick={() => setShowCustom(true)}>
          <Text className='custom-btn-text'>+ 自定义</Text>
        </View>
      </View>

      {loading ? (
        <View className='spinner-wrap'><View className='spinner'></View></View>
      ) : (
        <>
          <ScrollView scrollY className='food-list'>
            {foods.map((food: any) => (
              <View key={food.id} className='food-card' onClick={() => setDetail(food)}>
                <View className='food-card-top'>
                  <View>
                    <Text className='food-card-name'>{food.name}</Text>
                    <Text className='food-card-cat'>{CATEGORIES.find(c => c.key === food.category)?.label || food.category}</Text>
                  </View>
                  <Text className='food-card-cal'>{food.calories} <Text className='unit'>/100g</Text></Text>
                </View>
                <View className='macro-grid'>
                  <View className='macro-item'><Text className='macro-val green'>{food.protein}g</Text><Text className='macro-lbl'>蛋白</Text></View>
                  <View className='macro-item'><Text className='macro-val blue'>{food.carbs}g</Text><Text className='macro-lbl'>碳水</Text></View>
                  <View className='macro-item'><Text className='macro-val yellow'>{food.fat}g</Text><Text className='macro-lbl'>脂肪</Text></View>
                  <View className='macro-item'><Text className='macro-val purple'>{food.fiber}g</Text><Text className='macro-lbl'>纤维</Text></View>
                </View>
              </View>
            ))}
            {foods.length === 0 && <Text className='empty-msg'>未找到匹配的食物</Text>}
          </ScrollView>

          {totalPages > 1 && (
            <View className='pagination'>
              <View className='page-btn' onClick={() => fetchFoods(page - 1)}><Text>上一页</Text></View>
              <Text className='page-num'>{page}/{totalPages}</Text>
              <View className='page-btn' onClick={() => fetchFoods(page + 1)}><Text>下一页</Text></View>
            </View>
          )}
        </>
      )}

      {/* Detail Modal */}
      {detail && <FoodDetail detail={detail} onClose={() => setDetail(null)} />}

      {/* Custom Modal */}
      {showCustom && <CustomFoodModal onClose={() => setShowCustom(false)} onAdded={() => { setShowCustom(false); fetchFoods(1) }} />}
    </View>
  )
}

function FoodDetail({ detail, onClose }: { detail: any; onClose: () => void }) {
  const macros = [
    { label: '蛋白质', value: detail.protein, color: '#22c55e' },
    { label: '碳水', value: detail.carbs, color: '#60a5fa' },
    { label: '脂肪', value: detail.fat, color: '#eab308' },
    { label: '纤维', value: detail.fiber, color: '#a855f7' },
  ]
  const maxVal = Math.max(...macros.map(m => m.value), 1)

  return (
    <View className='detail-mask' onClick={onClose}>
      <View className='detail-card' onClick={(e: any) => e.stopPropagation()}>
        <View className='detail-header'>
          <View>
            <Text className='detail-name'>{detail.name}</Text>
            <Text className='detail-cat'>{CATEGORIES.find(c => c.key === detail.category)?.label || detail.category}</Text>
          </View>
          <View onClick={onClose}><Text className='detail-close'>✕</Text></View>
        </View>
        <View className='detail-cal-box'>
          <Text className='detail-cal'>{detail.calories}</Text>
          <Text className='detail-cal-unit'>kcal / 100g</Text>
        </View>
        {macros.map(m => (
          <View key={m.label} className='macro-bar-wrap'>
            <View className='macro-bar-header'>
              <Text className='macro-bar-label'>{m.label}</Text>
              <Text className='macro-bar-val' style={{ color: m.color }}>{m.value}g</Text>
            </View>
            <View className='macro-bar-bg'>
              <View className='macro-bar-fill' style={{ width: `${Math.min((m.value / maxVal) * 100, 100)}%`, backgroundColor: m.color, opacity: 0.4 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

function CustomFoodModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [custom, setCustom] = useState({ name: '', category: 'staple', calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!custom.name) {
      Taro.showToast({ title: '请输入食物名称', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      await createCustomFood(custom)
      Taro.showToast({ title: '添加成功', icon: 'success' })
      onClose(); onAdded()
    } catch { Taro.showToast({ title: '添加失败', icon: 'error' }) }
    setSubmitting(false)
  }

  return (
    <View className='detail-mask' onClick={onClose}>
      <View className='detail-card' onClick={(e: any) => e.stopPropagation()}>
        <View className='detail-header'>
          <Text className='detail-name'>添加自定义食物</Text>
          <View onClick={onClose}><Text className='detail-close'>✕</Text></View>
        </View>
        <View className='custom-form'>
          <Input className='form-input' placeholder='食物名称 *' value={custom.name}
            onInput={(e: any) => setCustom({ ...custom, name: e.detail.value })} />
          <Input className='form-input' type='digit' placeholder='热量 (kcal/100g)'
            onInput={(e: any) => setCustom({ ...custom, calories: Number(e.detail.value) })} />
          <Input className='form-input' type='digit' placeholder='蛋白质 (g)'
            onInput={(e: any) => setCustom({ ...custom, protein: Number(e.detail.value) })} />
          <Input className='form-input' type='digit' placeholder='碳水 (g)'
            onInput={(e: any) => setCustom({ ...custom, carbs: Number(e.detail.value) })} />
          <Input className='form-input' type='digit' placeholder='脂肪 (g)'
            onInput={(e: any) => setCustom({ ...custom, fat: Number(e.detail.value) })} />
          <View className='submit-btn' onClick={handleSubmit}>
            <Text>{submitting ? '添加中...' : '添加食物'}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
