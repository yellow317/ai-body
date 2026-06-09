export interface User {
  id: number
  email: string
  username: string
  is_active?: boolean
  created_at: string
}

export interface UserProfile {
  id?: number
  user_id?: number
  height?: number
  weight?: number
  age?: number
  gender?: string
  activity_level?: string
  goal?: string
  bmi?: number
  bmr?: number
  tdee?: number
  target_calories?: number
  body_fat?: number
  avatar_url?: string | null
}

export interface Food {
  id: number
  name: string
  category: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  serving_size: number
  is_custom?: boolean
  created_by?: number | null
  is_favorited?: boolean
}

export interface FoodEntry {
  id: number
  food_id: number
  food?: Food
  date: string
  meal_type: string
  quantity: number
  calories: number
  created_at: string
}

export interface DailySummary {
  entries: FoodEntry[]
  total: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

export interface DailyStats {
  date: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
}

export interface CalculationResult {
  bmi: number
  bmi_category: string
  body_fat: number
  bmr: number
  tdee: number
  target_calories: number
  protein_target: number
  carbs_target: number
  fat_target: number
}

export interface FoodImageAnalysis {
  food_name: string
  food_category: string
  calories_per_100g: number
  protein: number
  carbs: number
  fat: number
  estimated_quantity: number
  category: string
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  food_analysis?: FoodImageAnalysis[] | null
  created_at: string
}

export interface ChatHistoryResponse {
  messages: ChatMessage[]
}

export interface MealPlanItem {
  food_id: number
  name: string
  quantity: number
  calories: number
}

export interface MealPlan {
  breakfast: { items: MealPlanItem[]; total_calories: number }
  lunch: { items: MealPlanItem[]; total_calories: number }
  dinner: { items: MealPlanItem[]; total_calories: number }
  snack: { items: MealPlanItem[]; total_calories: number }
}
