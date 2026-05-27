import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Picker } from '@tarojs/components'
import { calculate, updateProfile } from '../../api'
import { calcBMI, getBMICategory, calcBMR, calcTDEE, calcTargetCalories, calcBodyFat, getMacroTargets } from '../../utils/calc'
import './index.scss'

const ACTIVITY_OPTIONS = [
  { v: 'sedentary', l: '久坐不动' },
  { v: 'light', l: '轻度运动(1-3天/周)' },
  { v: 'moderate', l: '中度运动(3-5天/周)' },
  { v: 'active', l: '高度运动(6-7天/周)' },
  { v: 'very_active', l: '极高度(体力劳动)' },
]

const GOAL_OPTIONS = [
  { v: 'lose', l: '减脂' },
  { v: 'gain', l: '增肌' },
  { v: 'maintain', l: '维持体重' },
]

const GENDER_OPTIONS = ['男', '女']

export default function Calculator() {
  const [form, setForm] = useState({ height: 170, weight: 65, age: 25, gender: 'male', activity_level: 'moderate', goal: 'maintain' })
  const [result, setResult] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleNumber = (field: string) => (e: any) => {
    setForm({ ...form, [field]: Number(e.detail.value) || 0 })
  }

  const handleGenderChange = (e: any) => {
    setForm({ ...form, gender: e.detail.value === 0 ? 'male' : 'female' })
  }

  const handleActivityChange = (e: any) => {
    setForm({ ...form, activity_level: ACTIVITY_OPTIONS[e.detail.value].v })
  }

  const handleGoalChange = (e: any) => {
    setForm({ ...form, goal: GOAL_OPTIONS[e.detail.value].v })
  }

  const handleCalculate = async () => {
    try {
      const res: any = await calculate(form)
      setResult(res)
      setSaved(false)
    } catch {
      // Local fallback
      const bmi = calcBMI(form.weight, form.height)
      const bmr = calcBMR(form.weight, form.height, form.age, form.gender)
      const tdee = calcTDEE(bmr, form.activity_level)
      const target = calcTargetCalories(tdee, form.goal)
      const bodyFat = calcBodyFat(form.weight, form.height, form.age, form.gender)
      const macros = getMacroTargets(target)
      setResult({
        bmi: Math.round(bmi * 100) / 100,
        bmi_category: getBMICategory(bmi),
        body_fat: Math.round(Math.max(bodyFat, 3) * 100) / 100,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        target_calories: Math.round(target),
        ...macros,
      })
      setSaved(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile(form)
      setSaved(true)
      Taro.showToast({ title: '已保存', icon: 'success' })
    } catch { Taro.showToast({ title: '保存失败', icon: 'error' }) }
    setSaving(false)
  }

  return (
    <View className='page-container calc-page'>
      {/* Form */}
      <View className='card'>
        <Text className='section-title'>输入数据</Text>
        <View className='calc-form'>
          <View className='slider-item'>
            <View className='slider-label'><Text>身高</Text><Text className='slider-val'>{form.height} cm</Text></View>
            <View className='slider-track'>
              <View className='slider-fill' style={{ width: `${((form.height - 100) / 150) * 100}%` }} />
            </View>
          </View>
          <View className='slider-item'>
            <View className='slider-label'><Text>体重</Text><Text className='slider-val'>{form.weight} kg</Text></View>
            <View className='slider-track'>
              <View className='slider-fill' style={{ width: `${((form.weight - 30) / 220) * 100}%` }} />
            </View>
          </View>
          <View className='slider-item'>
            <View className='slider-label'><Text>年龄</Text><Text className='slider-val'>{form.age}</Text></View>
            <View className='slider-track'>
              <View className='slider-fill' style={{ width: `${((form.age - 10) / 90) * 100}%` }} />
            </View>
          </View>

          <View className='picker-item'>
            <Text className='picker-label'>性别</Text>
            <Picker mode='selector' range={GENDER_OPTIONS} value={form.gender === 'male' ? 0 : 1} onChange={handleGenderChange}>
              <View className='picker-val'><Text>{form.gender === 'male' ? '男' : '女'}</Text></View>
            </Picker>
          </View>

          <View className='picker-item'>
            <Text className='picker-label'>活动水平</Text>
            <Picker mode='selector' range={ACTIVITY_OPTIONS.map(o => o.l)} value={ACTIVITY_OPTIONS.findIndex(o => o.v === form.activity_level)} onChange={handleActivityChange}>
              <View className='picker-val'><Text>{ACTIVITY_OPTIONS.find(o => o.v === form.activity_level)?.l}</Text></View>
            </Picker>
          </View>

          <View className='picker-item'>
            <Text className='picker-label'>目标</Text>
            <Picker mode='selector' range={GOAL_OPTIONS.map(o => o.l)} value={GOAL_OPTIONS.findIndex(o => o.v === form.goal)} onChange={handleGoalChange}>
              <View className='picker-val'><Text>{GOAL_OPTIONS.find(o => o.v === form.goal)?.l}</Text></View>
            </Picker>
          </View>

          <View className='calc-btn' onClick={handleCalculate}>
            <Text className='calc-btn-text'>计算</Text>
          </View>
        </View>
      </View>

      {/* Results */}
      {result ? (
        <View>
          <View className='card'>
            <View className='card-header'>
              <Text className='section-title'>计算结果</Text>
              <View className={`save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
                <Text className='save-btn-text'>{saved ? '✓ 已保存' : saving ? '保存中...' : '保存到资料'}</Text>
              </View>
            </View>
            <View className='result-grid'>
              <View className='result-item'>
                <Text className='result-label'>BMI</Text>
                <Text className='result-value'>{result.bmi}</Text>
                <Text className='result-sub'>{result.bmi_category}</Text>
              </View>
              <View className='result-item'>
                <Text className='result-label'>体脂率</Text>
                <Text className='result-value'>{result.body_fat}%</Text>
              </View>
              <View className='result-item'>
                <Text className='result-label'>BMR</Text>
                <Text className='result-value'>{result.bmr}</Text>
                <Text className='result-sub'>kcal/天</Text>
              </View>
              <View className='result-item'>
                <Text className='result-label'>TDEE</Text>
                <Text className='result-value'>{result.tdee}</Text>
                <Text className='result-sub'>kcal/天</Text>
              </View>
              <View className='result-item highlight'>
                <Text className='result-label'>目标热量</Text>
                <Text className='result-value primary'>{result.target_calories}</Text>
                <Text className='result-sub'>kcal/天</Text>
              </View>
            </View>
          </View>

          {/* Macro targets */}
          <View className='card'>
            <Text className='section-title'>营养素目标 (克/天)</Text>
            <View className='macro-row'>
              <View className='macro-col'>
                <Text className='macro-num green'>{result.protein_target || Math.round((result.target_calories * 0.3) / 4)}g</Text>
                <Text className='macro-text'>蛋白质 30%</Text>
              </View>
              <View className='macro-col'>
                <Text className='macro-num blue'>{result.carbs_target || Math.round((result.target_calories * 0.45) / 4)}g</Text>
                <Text className='macro-text'>碳水 45%</Text>
              </View>
              <View className='macro-col'>
                <Text className='macro-num yellow'>{result.fat_target || Math.round((result.target_calories * 0.25) / 9)}g</Text>
                <Text className='macro-text'>脂肪 25%</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View className='card empty-result'>
          <Text className='empty-icon'>🧮</Text>
          <Text className='empty-text'>输入数据并点击计算查看结果</Text>
        </View>
      )}
    </View>
  )
}
