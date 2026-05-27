import Taro from '@tarojs/taro'
import { getToken, clearAuth } from '../utils/storage'

const BASE_URL = 'https://aibody.vercel.app'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  timeout?: number
}

const MAX_RETRIES = 2

function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', data, header = {}, timeout = 30000 } = options
  const token = getToken()

  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }
  header['Content-Type'] = header['Content-Type'] || 'application/json'

  const doRequest = (attempt: number): Promise<T> => {
    return new Promise((resolve, reject) => {
      Taro.request({
        url: `${BASE_URL}${url}`,
        method,
        data,
        header,
        timeout,
        success: (res) => {
          if (res.statusCode === 401) {
            clearAuth()
            Taro.redirectTo({ url: '/pages/login/index' })
            reject(new Error('未授权，请重新登录'))
            return
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data as T)
          } else {
            const detail = (res.data as any)?.detail
            let msg = '请求失败'
            if (typeof detail === 'string') {
              msg = detail
            } else if (Array.isArray(detail) && detail.length) {
              msg = detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ')
            } else if (detail) {
              msg = JSON.stringify(detail)
            }
            reject(new Error(msg))
          }
        },
        fail: (err) => {
          const isTimeout = err.errMsg?.includes('timeout')
          if (isTimeout && attempt < MAX_RETRIES) {
            setTimeout(() => {
              doRequest(attempt + 1).then(resolve).catch(reject)
            }, 1000)
            return
          }
          reject(new Error(err.errMsg || '网络错误'))
        }
      })
    })
  }
  return doRequest(0)
}

// Auth
export function login(username: string, password: string) {
  return request('/api/auth/login', {
    method: 'POST',
    data: { username, password }
  })
}

export function register(email: string, username: string, password: string, confirmPassword: string) {
  return request('/api/auth/register', {
    method: 'POST',
    data: { email, username, password, confirm_password: confirmPassword }
  })
}

export function getMe() {
  return request('/api/users/me')
}

export function updateProfile(data: any) {
  return request('/api/users/profile', { method: 'PUT', data })
}

export function calculate(params: {
  height: number; weight: number; age: number;
  gender: string; activity_level: string; goal: string
}) {
  return request('/api/users/calculator', { data: params })
}

// Foods
export function searchFoods(params: { q?: string; category?: string; page?: number; limit?: number }) {
  const clean: any = {}
  if (params.q) clean.q = params.q
  if (params.category) clean.category = params.category
  if (params.page) clean.page = params.page
  if (params.limit) clean.limit = params.limit
  return request('/api/foods/search', { data: clean })
}

export function createCustomFood(data: any) {
  return request('/api/foods/custom', { method: 'POST', data })
}

// Food Entries
export function addFoodEntry(data: {
  food_id: number; date: string; meal_type: string; quantity: number
}) {
  return request('/api/food-entries', { method: 'POST', data })
}

export function getDailyEntries(date: string) {
  return request(`/api/food-entries/daily/${date}`)
}

export function deleteFoodEntry(id: number) {
  return request(`/api/food-entries/${id}`, { method: 'DELETE' })
}

export function getFoodStats(startDate: string, endDate: string) {
  return request('/api/food-entries/stats', {
    data: { start_date: startDate, end_date: endDate }
  })
}

// Recommendations
export function getDailyRecommendations(mealType?: string, limit?: number) {
  const params: any = {}
  if (mealType) params.meal_type = mealType
  if (limit) params.limit = limit
  return request('/api/recommendations/daily', { data: params })
}

export function getMealPlan(targetCalories?: number) {
  const params: any = {}
  if (targetCalories) params.target_calories = targetCalories
  return request('/api/recommendations/meal-plan', { data: params })
}

// Chat
export function sendChatMessage(content: string) {
  return request('/api/chat/send', { method: 'POST', data: { content } })
}

export function getChatHistory(limit?: number) {
  return request('/api/chat/history', { data: { limit: limit || 50 } })
}

export function clearChatHistory() {
  return request('/api/chat/history', { method: 'DELETE' })
}

export function analyzeFoodImage(imagePath: string, description?: string) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    Taro.uploadFile({
      url: `${BASE_URL}/api/chat/analyze-image`,
      filePath: imagePath,
      name: 'image',
      formData: description ? { description } : {},
      header: {
        Authorization: token ? `Bearer ${token}` : ''
      },
      timeout: 120000,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(res.data))
        } else {
          reject(new Error('图片分析失败'))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '上传失败'))
      }
    })
  })
}
