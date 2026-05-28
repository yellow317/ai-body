import { useState, useMemo } from 'react'
import { calculate, updateProfile } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import type { CalculationResult } from '../types'

export default function Calculator() {
  const { refreshUser } = useAuth()
  const { show: toast } = useToast()
  const [form, setForm] = useState({ height: 170, weight: 65, age: 25, gender: 'male', activity_level: 'moderate', goal: 'maintain' })
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const canCalculate = form.height > 0 && form.weight > 0 && form.age > 0

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: ['height', 'weight', 'age'].includes(field) ? Number(e.target.value) : e.target.value })

  const handleCalculate = async () => {
    if (!canCalculate) return
    try {
      const res = await calculate(form)
      setResult(res.data)
      setSaved(false)
    } catch {
      // Local fallback
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

      const bodyFat = form.gender === 'male' ? (1.20 * bmi) + (0.23 * form.age) - 16.2 : (1.20 * bmi) + (0.23 * form.age) - 5.4

      setResult({
        bmi: Math.round(bmi * 100) / 100, bmi_category: bmiCat,
        body_fat: Math.round(Math.max(bodyFat, 3) * 100) / 100,
        bmr: Math.round(bmr), tdee: Math.round(tdee), target_calories: Math.round(target),
        protein_target: Math.round(target * 0.30 / 4), carbs_target: Math.round(target * 0.45 / 4), fat_target: Math.round(target * 0.25 / 9),
      })
      setSaved(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try { await updateProfile(form); await refreshUser(); setSaved(true); toast('已保存', 'success') }
    catch { toast('保存失败', 'error') }
    setSaving(false)
  }

  return (
    <div className="max-w-lg lg:max-w-4xl xl:max-w-6xl mx-auto px-4 lg:px-6 pb-24">
      <h1 className="text-xl font-bold text-gray-800 py-3">身体指标计算器</h1>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">输入数据</h2>
        <div className="space-y-3">
          <DualField label="身高 (cm)" value={form.height} onChange={(v) => setForm({ ...form, height: v })} min={100} max={250} />
          <DualField label="体重 (kg)" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} min={30} max={250} />
          <DualField label="年龄" value={form.age} onChange={(v) => setForm({ ...form, age: v })} min={10} max={100} />
          <SelectField label="性别" value={form.gender} onChange={handleChange('gender')} options={[{ v: 'male', l: '男' }, { v: 'female', l: '女' }]} />
          <SelectField label="活动水平" value={form.activity_level} onChange={handleChange('activity_level')}
            options={[
              { v: 'sedentary', l: '久坐' }, { v: 'light', l: '轻度运动(1-3天/周)' },
              { v: 'moderate', l: '中度运动(3-5天/周)' }, { v: 'active', l: '高度运动(6-7天/周)' }, { v: 'very_active', l: '极高度' },
            ]} />
          <SelectField label="目标" value={form.goal} onChange={handleChange('goal')} options={[{ v: 'lose', l: '减脂' }, { v: 'gain', l: '增肌' }, { v: 'maintain', l: '维持体重' }]} />
          <button onClick={handleCalculate} className="w-full bg-primary-600 text-white py-3 rounded-xl text-base font-medium active:bg-primary-700">
            计算
          </button>
        </div>
      </div>

      {/* Results */}
      {result ? (
        <div className="space-y-3">
          {/* BMI Gauge */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center">
            <BMIGauge bmi={result.bmi} category={result.bmi_category} />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-sm font-semibold text-gray-600">计算结果</h3>
              <button onClick={handleSave} disabled={saving}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  saved ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-700 active:bg-primary-200'
                }`}>
                {saved ? '✓ 已保存' : saving ? '保存中...' : '保存到资料'}
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              <ResultCard label="BMI" value={result.bmi} sub={result.bmi_category} />
              <ResultCard label="体脂率" value={result.body_fat} unit="%" />
              <ResultCard label="BMR" value={result.bmr} unit="kcal/天" sub="基础代谢" />
              <ResultCard label="TDEE" value={result.tdee} unit="kcal/天" sub="每日消耗" />
              <ResultCard label="目标热量" value={result.target_calories} unit="kcal/天" highlight />
              <ResultCard label="" value={0} unit="" />
            </div>
          </div>

          {/* Macro targets with bars */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">营养素目标 (克/天)</h3>
            <div className="space-y-3">
              <MacroBar label="蛋白质" value={result.protein_target} pct={30} color="bg-green-500" />
              <MacroBar label="碳水" value={result.carbs_target} pct={45} color="bg-blue-500" />
              <MacroBar label="脂肪" value={result.fat_target} pct={25} color="bg-yellow-500" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">
          <div className="text-5xl mb-3">🧮</div>
          <p className="text-sm">输入数据并点击"计算"查看结果</p>
        </div>
      )}
    </div>
  )
}

function DualField({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{label}</span></div>
      <div className="flex items-center gap-3">
        <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-primary-600" />
        <input type="number" value={value} onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
          className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center font-semibold text-gray-800" />
      </div>
    </div>
  )
}

function MacroBar({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label} ({pct}%)</span>
        <span className="font-semibold text-gray-800">{value}g</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div className={`h-3 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { v: string; l: string }[]
}) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <select value={value} onChange={onChange} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )
}

function BMIGauge({ bmi, category }: { bmi: number; category: string }) {
  const bmiRanges = [
    { max: 18.5, label: '偏瘦', color: '#3b82f6' },
    { max: 24, label: '正常', color: '#22c55e' },
    { max: 28, label: '超重', color: '#eab308' },
    { max: 40, label: '肥胖', color: '#ef4444' },
  ]
  const clamped = Math.max(10, Math.min(40, bmi))
  const angle = ((clamped - 10) / 30) * 180
  const needleRad = (angle - 90) * (Math.PI / 180)
  const cx = 80; const cy = 70; const r = 60
  const nx = cx + Math.cos(needleRad) * r * 0.7
  const ny = cy + Math.sin(needleRad) * r * 0.7

  return (
    <div className="text-center">
      <svg viewBox="0 0 160 120" className="w-56 h-40">
        {/* Colored arcs */}
        {bmiRanges.map((range, i) => {
          const startAngle = ((i === 0 ? 0 : bmiRanges[i-1].max - 10) / 30) * 180
          const endAngle = ((range.max - 10) / 30) * 180
          const startRad = (startAngle - 90) * (Math.PI / 180)
          const endRad = (endAngle - 90) * (Math.PI / 180)
          const x1 = cx + Math.cos(startRad) * r; const y1 = cy + Math.sin(startRad) * r
          const x2 = cx + Math.cos(endRad) * r; const y2 = cy + Math.sin(endRad) * r
          const largeArc = (endAngle - startAngle) > 90 ? 1 : 0
          return (
            <path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
              stroke={range.color} strokeWidth="14" fill="none" strokeLinecap="butt" />
          )
        })}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill="#1e293b" />
      </svg>
      <p className="text-xl font-bold text-gray-800">{bmi}</p>
      <p className="text-sm text-gray-500">{category}</p>
    </div>
  )
}

function ResultCard({ label, value, unit, sub, highlight }: {
  label: string; value: number; unit?: string; sub?: string; highlight?: boolean
}) {
  if (!label) return <div />
  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-primary-700' : 'text-gray-800'}`}>
        {value}{unit && <span className="text-xs font-normal text-gray-500 ml-0.5">{unit}</span>}
      </p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  )
}
