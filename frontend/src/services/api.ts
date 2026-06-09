import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const register = (data: { email: string; username: string; password: string; confirm_password: string }) =>
  api.post('/auth/register', data)

export const login = (data: { username: string; password: string }) =>
  api.post('/auth/login', data)

export const getMe = () => api.get('/users/me')

export const updateProfile = (data: Record<string, unknown>) =>
  api.put('/users/profile', data)

export const uploadAvatar = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.put('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const calculate = (params: Record<string, string | number>) =>
  api.get('/users/calculator', { params })

// Foods
export const searchFoods = (params: Record<string, string | number | undefined>) =>
  api.get('/foods/search', { params })

export const createCustomFood = (data: Record<string, unknown>) =>
  api.post('/foods/custom', data)

// Favorite Foods
export const getFavoriteFoods = () =>
  api.get('/foods/favorites')

export const addFavoriteFood = (foodId: number) =>
  api.post(`/foods/${foodId}/favorite`)

export const removeFavoriteFood = (foodId: number) =>
  api.delete(`/foods/${foodId}/favorite`)

// Food Entries
export const addFoodEntry = (data: { food_id: number; date: string; meal_type: string; quantity: number }) =>
  api.post('/food-entries', data)

export const addFoodEntryFromImage = (data: {
  food_name: string; food_category: string; calories_per_100g: number;
  protein: number; carbs: number; fat: number; entry_date: string;
  meal_type: string; quantity: number
}) => api.post('/food-entries/from-image', data)

export const getDailyEntries = (date: string) =>
  api.get(`/food-entries/daily/${date}`)

export const deleteFoodEntry = (id: number) =>
  api.delete(`/food-entries/${id}`)

export const getFoodStats = (start_date: string, end_date: string) =>
  api.get('/food-entries/stats', { params: { start_date, end_date } })

// Recommendations
export const getDailyRecommendations = (meal_type?: string, limit?: number) =>
  api.get('/recommendations/daily', { params: { meal_type, limit } })

export const getMealPlan = (target_calories?: number) =>
  api.get('/recommendations/meal-plan', { params: { target_calories } })

// AI Chat
export const sendChatMessage = (content: string) =>
  api.post('/chat/send', { content })

export const getChatHistory = (limit?: number) =>
  api.get('/chat/history', { params: { limit } })

export const clearChatHistory = () =>
  api.delete('/chat/history')

export const analyzeFoodImage = (image: File, description?: string) => {
  const formData = new FormData()
  formData.append('image', image)
  if (description) {
    formData.append('description', description)
  }
  return api.post('/chat/analyze-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  })
}

export default api
