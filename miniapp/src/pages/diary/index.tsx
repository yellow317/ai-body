import { useState, useEffect, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, Picker, ScrollView } from '@tarojs/components'
import { getDailyEntries, addFoodEntry, deleteFoodEntry, searchFoods, createCustomFood } from '../../api'
import './index.scss'

const MEAL_TYPES = [
  { key: 'breakfast', label: '早餐', icon: '🌅' },
  { key: 'lunch', label: '午餐', icon: '☀️' },
  { key: 'dinner', label: '晚餐', icon: '🌙' },
  { key: 'snack', label: '加餐', icon: '🍪' },
]

const CATEGORIES = [
  { value: '', label: '全部' },
  { value: 'staple', label: '主食' },
  { value: 'protein', label: '蛋白' },
  { value: 'vegetable', label: '蔬菜' },
  { value: 'fruit', label: '水果' },
  { value: 'fat', label: '脂肪' },
  { value: 'beverage', label: '饮品' },
]

export default function Diary() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [activeMealType, setActiveMealType] = useState('breakfast')

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDailyEntries(date)
      setSummary(res)
    } catch { setSummary(null) }
    setLoading(false)
  }, [date])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const changeDate = (days: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    setDate(d.toISOString().split('T')[0])
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteFoodEntry(id)
      fetchEntries()
      Taro.showToast({ title: '已删除', icon: 'success' })
    } catch { Taro.showToast({ title: '删除失败', icon: 'error' }) }
  }

  const entries = summary?.entries || []
  const total = summary?.total || { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const grouped: Record<string, any[]> = {}
  for (const mt of MEAL_TYPES) grouped[mt.key] = entries.filter((e: any) => e.meal_type === mt.key)

  const handleDateChange = (e: any) => setDate(e.detail.value)

  return (
    <View className='page-container diary-page'>
      {/* Date Picker */}
      <View className='date-bar'>
        <View className='date-arrow' onClick={() => changeDate(-1)}><Text>◀</Text></View>
        <Picker mode='date' value={date} onChange={handleDateChange}>
          <View className='date-text'><Text>{date}</Text></View>
        </Picker>
        <View className='date-arrow' onClick={() => changeDate(1)}><Text>▶</Text></View>
      </View>

      {/* Stats Bar */}
      <View className='stats-row'>
        <View className='stat-item'><Text className='st-label'>热量</Text><Text className='st-val primary'>{total.calories}</Text></View>
        <View className='stat-item'><Text className='st-label'>蛋白</Text><Text className='st-val green'>{total.protein}g</Text></View>
        <View className='stat-item'><Text className='st-label'>碳水</Text><Text className='st-val blue'>{total.carbs}g</Text></View>
        <View className='stat-item'><Text className='st-label'>脂肪</Text><Text className='st-val yellow'>{total.fat}g</Text></View>
      </View>

      {loading ? (
        <View className='spinner-wrap'><View className='spinner'></View></View>
      ) : (
        <ScrollView scrollY className='meal-list'>
          {MEAL_TYPES.map(mt => (
            <View key={mt.key} className='meal-section'>
              <View className='meal-header'>
                <Text className='meal-title'>{mt.icon} {mt.label}</Text>
                <View className='add-btn' onClick={() => { setActiveMealType(mt.key); setModalVisible(true) }}>
                  <Text className='add-btn-text'>+ 添加</Text>
                </View>
              </View>
              {grouped[mt.key].length === 0 ? (
                <Text className='empty-text'>暂无记录</Text>
              ) : (
                grouped[mt.key].map((entry: any) => (
                  <View key={entry.id} className='entry-item'>
                    <View className='entry-info'>
                      <Text className='entry-name'>{entry.food?.name || '食物'}</Text>
                      <Text className='entry-qty'>{entry.quantity}g</Text>
                    </View>
                    <View className='entry-right'>
                      <Text className='entry-cal'>{entry.calories} kcal</Text>
                      <View className='del-btn' onClick={() => handleDelete(entry.id)}>
                        <Text>✕</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add Food Modal */}
      {modalVisible && (
        <AddFoodModal
          mealType={activeMealType}
          date={date}
          onClose={() => setModalVisible(false)}
          onAdded={fetchEntries}
        />
      )}
    </View>
  )
}

function AddFoodModal({ mealType, date, onClose, onAdded }: {
  mealType: string; date: string; onClose: () => void; onAdded: () => void
}) {
  const [tab, setTab] = useState<'search' | 'custom'>('search')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [foods, setFoods] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [quantity, setQuantity] = useState<Record<number, number>>({})
  const [adding, setAdding] = useState(false)
  const [custom, setCustom] = useState({ name: '', category: 'staple', calories: 0, protein: 0, carbs: 0, fat: 0 })

  const doSearch = async (p = 1) => {
    try {
      const res: any = await searchFoods({ q: query || undefined, category: category || undefined, page: p, limit: 10 })
      setFoods(res.foods || [])
      setTotal(res.total || 0)
      setPage(p)
    } catch { /* ignore */ }
  }

  useEffect(() => { doSearch() }, [])

  const handleAdd = async (foodId: number) => {
    setAdding(true)
    try {
      await addFoodEntry({ food_id: foodId, date, meal_type: mealType, quantity: quantity[foodId] || 100 })
      Taro.showToast({ title: '添加成功', icon: 'success' })
      onClose(); onAdded()
    } catch { Taro.showToast({ title: '添加失败', icon: 'error' }) }
    setAdding(false)
  }

  const handleCustomSubmit = async () => {
    if (!custom.name) return
    setAdding(true)
    try {
      const res: any = await createCustomFood(custom)
      await addFoodEntry({ food_id: res.id, date, meal_type: mealType, quantity: 100 })
      Taro.showToast({ title: '添加成功', icon: 'success' })
      onClose(); onAdded()
    } catch { Taro.showToast({ title: '添加失败', icon: 'error' }) }
    setAdding(false)
  }

  return (
    <View className='modal-mask' onClick={onClose}>
      <View className='modal-card' onClick={(e: any) => e.stopPropagation()}>
        <View className='modal-header'>
          <Text className='modal-title'>添加食物</Text>
          <View onClick={onClose}><Text className='modal-close'>✕</Text></View>
        </View>

        <View className='tab-row'>
          <View className={`tab-item ${tab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>
            <Text>搜索</Text>
          </View>
          <View className={`tab-item ${tab === 'custom' ? 'active' : ''}`} onClick={() => setTab('custom')}>
            <Text>自定义</Text>
          </View>
        </View>

        {tab === 'search' ? (
          <View>
            <View className='search-row'>
              <Input className='search-input' placeholder='搜索食物...' value={query}
                onInput={(e: any) => setQuery(e.detail.value)}
                onConfirm={() => doSearch()} />
              <Picker mode='selector' range={CATEGORIES.map(c => c.label)} onChange={(e: any) => { setCategory(CATEGORIES[e.detail.value].value); doSearch() }}>
                <View className='cat-picker'><Text>{CATEGORIES.find(c => c.value === category)?.label || '分类'}</Text></View>
              </Picker>
            </View>
            <ScrollView scrollY className='food-scroll'>
              {foods.map((food: any) => (
                <View key={food.id} className='food-row'>
                  <View className='food-info'>
                    <Text className='food-name'>{food.name}</Text>
                    <Text className='food-meta'>{food.calories} kcal/100g</Text>
                  </View>
                  <Input className='qty-input' type='number' value={String(quantity[food.id] || 100)}
                    onInput={(e: any) => setQuantity({ ...quantity, [food.id]: Number(e.detail.value) })} />
                  <View className='add-btn-sm' onClick={() => handleAdd(food.id)}>
                    <Text>添加</Text>
                  </View>
                </View>
              ))}
              {foods.length === 0 && <Text className='empty-text' style={{ padding: '40rpx', textAlign: 'center' }}>未找到食物</Text>}
            </ScrollView>
            {total > 10 && (
              <View className='page-row'>
                <View className='page-btn' onClick={() => doSearch(page - 1)}><Text>上一页</Text></View>
                <Text className='page-num'>{page}/{Math.ceil(total / 10)}</Text>
                <View className='page-btn' onClick={() => doSearch(page + 1)}><Text>下一页</Text></View>
              </View>
            )}
          </View>
        ) : (
          <View className='custom-form'>
            <Input className='form-input' placeholder='食物名称' value={custom.name}
              onInput={(e: any) => setCustom({ ...custom, name: e.detail.value })} />
            <Picker mode='selector' range={CATEGORIES.filter(c => c.value).map(c => c.label)} onChange={(e: any) => {
              const keys = CATEGORIES.filter(c => c.value)
              setCustom({ ...custom, category: keys[e.detail.value].value })
            }}>
              <View className='form-input picker-input'><Text>{CATEGORIES.find(c => c.value === custom.category)?.label || '选择分类'}</Text></View>
            </Picker>
            <View className='form-grid'>
              <Input className='form-input half' type='digit' placeholder='热量(kcal/100g)'
                onInput={(e: any) => setCustom({ ...custom, calories: Number(e.detail.value) })} />
              <Input className='form-input half' type='digit' placeholder='蛋白质(g)'
                onInput={(e: any) => setCustom({ ...custom, protein: Number(e.detail.value) })} />
              <Input className='form-input half' type='digit' placeholder='碳水(g)'
                onInput={(e: any) => setCustom({ ...custom, carbs: Number(e.detail.value) })} />
              <Input className='form-input half' type='digit' placeholder='脂肪(g)'
                onInput={(e: any) => setCustom({ ...custom, fat: Number(e.detail.value) })} />
            </View>
            <View className='submit-btn' onClick={handleCustomSubmit}>
              <Text>{adding ? '添加中...' : '添加自定义食物'}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
