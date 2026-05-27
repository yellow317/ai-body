import { useState, useMemo } from 'react'
import { calculate, updateProfile } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import type { CalculationResult } from '../types'

export default function Calculator() {
  const { refreshProfile } = useAuth()
  const [form, setForm] = useState({
    height: 170, weight: 65, age: 25,
    gender: 'male', activity_level: 'moderate', goal: 'maintain',
  })
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const canCalculate = form.height > 0 && form.weight > 0 && form.age > 0

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: field === 'height' || field === 'weight' || field === 'age' ? Number(e.target.value) : e.target.value })

  const handleCalculate = async () => {
    if (!canCalculate) return
    try {
      const res = await calculate(form)
      setResult(res.data)
      setSaved(false)
    } catch {
      // Local calculation fallback
      const bmi = form.weight / ((form.height / 100) ** 2)
      let bmr: number
      if (form.gender === 'male') {
        bmr = 88.362 + (13.397 * form.weight) + (4.799 * form.height) - (5.677 * form.age)
      } else {
        bmr = 447.593 + (9.247 * form.weight) + (3.098 * form.height) - (4.330 * form.age)
      }
      const multipliers: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }
      const tdee = bmr * (multipliers[form.activity_level] || 1.55)
      let target = tdee
      if (form.goal === 'lose') target = tdee * 0.8
      else if (form.goal === 'gain') target = tdee * 1.1

      let bmiCat = '正常'
      if (bmi < 18.5) bmiCat = '偏瘦'
      else if (bmi >= 24 && bmi < 28) bmiCat = '超重'
      else if (bmi >= 28) bmiCat = '肥胖'

      const bodyFat = form.gender === 'male'
        ? (1.20 * bmi) + (0.23 * form.age) - 16.2
        : (1.20 * bmi) + (0.23 * form.age) - 5.4

      setResult({
        bmi: Math.round(bmi * 100) / 100,
        bmi_category: bmiCat,
        body_fat: Math.round(Math.max(bodyFat, 3) * 100) / 100,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        target_calories: Math.round(target),
        protein_target: Math.round(target * 0.30 / 4),
        carbs_target: Math.round(target * 0.45 / 4),
        fat_target: Math.round(target * 0.25 / 9),
      })
      setSaved(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile(form)
      await refreshProfile()
      setSaved(true)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  // BMI gauge needle position (degree for -90 to 90 range)
  const gaugeAngle = useMemo(() => {
    if (!result) return -90
    const bmi = result.bmi
    // Map BMI 10-40 to -90 to 90 degrees
    const clamped = Math.max(10, Math.min(40, bmi))
    return ((clamped - 10) / 30) * 180 - 90
  }, [result])

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">身体指标计算器</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">输入数据</h2>
          <div className="space-y-4">
            <DoubleField label="身高 (cm)" value={form.height} onChange={handleChange('height')} min={100} max={250} />
            <DoubleField label="体重 (kg)" value={form.weight} onChange={handleChange('weight')} min={30} max={250} />
            <DoubleField label="年龄" value={form.age} onChange={handleChange('age')} min={10} max={100} />
            <SelectField label="性别" value={form.gender} onChange={handleChange('gender')}
              options={[{ v: 'male', l: '男' }, { v: 'female', l: '女' }]} />
            <SelectField label="活动水平" value={form.activity_level} onChange={handleChange('activity_level')}
              options={[
                { v: 'sedentary', l: '久坐' }, { v: 'light', l: '轻度运动(1-3天/周)' },
                { v: 'moderate', l: '中度运动(3-5天/周)' }, { v: 'active', l: '高度运动(6-7天/周)' },
                { v: 'very_active', l: '极高度(体力劳动)' },
              ]} />
            <SelectField label="目标" value={form.goal} onChange={handleChange('goal')}
              options={[{ v: 'lose', l: '减脂' }, { v: 'gain', l: '增肌' }, { v: 'maintain', l: '维持体重' }]} />
            <button
              onClick={handleCalculate}
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 text-lg font-medium"
            >
              计算
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">计算结果</h2>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      saved ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                    }`}
                  >
                    {saved ? '✓ 已保存' : saving ? '保存中...' : '保存到资料'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ResultCard label="BMI" value={result.bmi} unit="" sub={result.bmi_category} />
                  <ResultCard label="体脂率" value={result.body_fat} unit="%" sub="" />
                  <ResultCard label="BMR" value={result.bmr} unit="kcal/天" sub="基础代谢" />
                  <ResultCard label="TDEE" value={result.tdee} unit="kcal/天" sub="每日总消耗" />
                  <ResultCard label="目标热量" value={result.target_calories} unit="kcal/天" sub="" highlight />
                </div>
              </div>

              {/* BMI Gauge */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">BMI 仪表盘</h3>
                <svg viewBox="0 0 200 120" className="w-full">
                  {/* Background arcs */}
                  <path d="M 20 110 A 90 90 0 0 1 110 20" stroke="#3b82f6" strokeWidth="12" fill="none" opacity={0.2} />
                  <path d="M 110 20 A 90 90 0 0 1 155 46" stroke="#22c55e" strokeWidth="12" fill="none" opacity={0.4} />
                  <path d="M 155 46 A 90 90 0 0 1 180 88" stroke="#eab308" strokeWidth="12" fill="none" opacity={0.4} />
                  <path d="M 180 88 A 90 90 0 0 1 180 110" stroke="#ef4444" strokeWidth="12" fill="none" opacity={0.4} />
                  {/* Needle */}
                  <line x1="100" y1="105" x2={100 + 70 * Math.cos((gaugeAngle * Math.PI) / 180)}
                    y2={105 + 70 * Math.sin((gaugeAngle * Math.PI) / 180)}
                    stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="100" cy="105" r="5" fill="#1e293b" />
                  {/* Labels */}
                  <text x="30" y="105" fontSize="9" fill="#6b7280">偏瘦</text>
                  <text x="72" y="28" fontSize="9" fill="#6b7280">正常</text>
                  <text x="140" y="28" fontSize="9" fill="#6b7280">超重</text>
                  <text x="170" y="105" fontSize="9" fill="#6b7280">肥胖</text>
                  <text x="100" y="80" fontSize="14" fontWeight="bold" fill="#1e293b" textAnchor="middle">{result.bmi}</text>
                </svg>
              </div>

              {/* Macro pie chart */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">三大营养素分配 (克/天)</h3>
                <div className="flex items-center justify-center space-x-4">
                  <MacroBar label="蛋白质" value={result.protein_target} pct={30} color="bg-green-500" />
                  <MacroBar label="碳水" value={result.carbs_target} pct={45} color="bg-blue-500" />
                  <MacroBar label="脂肪" value={result.fat_target} pct={25} color="bg-yellow-500" />
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-400">
              <div className="text-6xl mb-4">🧮</div>
              <p>输入数据并点击"计算"查看结果</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DoubleField({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; min: number; max: number
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <label className="font-medium text-gray-700">{label}</label>
        <span className="text-gray-500">{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={onChange}
        className="w-full accent-primary-600" />
      <input type="number" value={value} onChange={onChange} min={min} max={max}
        className="w-full mt-1 px-3 py-1 border border-gray-300 rounded text-sm" />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { v: string; l: string }[]
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select value={value} onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )
}

function ResultCard({ label, value, unit, sub, highlight }: {
  label: string; value: number | null; unit: string; sub: string; highlight?: boolean
}) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-primary-700' : 'text-gray-800'}`}>
        {value ?? '--'} <span className="text-xs font-normal text-gray-500">{unit}</span>
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function MacroBar({ label, value, pct, color }: {
  label: string; value: number; pct: number; color: string
}) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-800">{value}g</div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="w-12 h-24 bg-gray-100 rounded-lg overflow-hidden">
        <div className={`${color} w-full rounded-b-lg transition-all`} style={{ height: `${pct * 1.5}%` }} />
      </div>
      <div className="text-xs text-gray-400 mt-1">{pct}%</div>
    </div>
  )
}
