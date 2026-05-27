export function calcBMI(weight: number, height: number): number {
  const h = height / 100
  return weight / (h * h)
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return '偏瘦'
  if (bmi < 24) return '正常'
  if (bmi < 28) return '偏胖'
  return '肥胖'
}

export function calcBMR(weight: number, height: number, age: number, gender: string): number {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  }
  return 10 * weight + 6.25 * height - 5 * age - 161
}

export function calcTDEE(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  }
  return bmr * (multipliers[activityLevel] || 1.2)
}

export function calcTargetCalories(tdee: number, goal: string): number {
  if (goal === 'lose') return tdee * 0.8
  if (goal === 'gain') return tdee * 1.1
  return tdee
}

export function calcBodyFat(weight: number, height: number, age: number, gender: string): number {
  const bmi = calcBMI(weight, height)
  if (gender === 'male') {
    return 1.2 * bmi + 0.23 * age - 16.2
  }
  return 1.2 * bmi + 0.23 * age - 5.4
}

export function getMacroTargets(targetCalories: number) {
  return {
    protein: Math.round((targetCalories * 0.3) / 4),
    carbs: Math.round((targetCalories * 0.45) / 4),
    fat: Math.round((targetCalories * 0.25) / 9)
  }
}

export function getActivityLabel(level: string): string {
  const labels: Record<string, string> = {
    sedentary: '久坐不动',
    light: '轻度活动',
    moderate: '中度活动',
    active: '高度活动',
    very_active: '极高活动'
  }
  return labels[level] || level
}

export function getGoalLabel(goal: string): string {
  const labels: Record<string, string> = {
    lose: '减脂',
    gain: '增肌',
    maintain: '维持'
  }
  return labels[goal] || goal
}
