import Taro from '@tarojs/taro'

const TOKEN_KEY = 'ai_health_diet_token'
const USER_KEY = 'ai_health_diet_user'
const PROFILE_KEY = 'ai_health_diet_profile'

export function getToken(): string {
  return Taro.getStorageSync(TOKEN_KEY) || ''
}

export function setToken(token: string) {
  Taro.setStorageSync(TOKEN_KEY, token)
}

export function removeToken() {
  Taro.removeStorageSync(TOKEN_KEY)
}

export function getUser(): any {
  const data = Taro.getStorageSync(USER_KEY)
  return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null
}

export function setUser(user: any) {
  Taro.setStorageSync(USER_KEY, JSON.stringify(user))
}

export function removeUser() {
  Taro.removeStorageSync(USER_KEY)
}

export function getProfile(): any {
  const data = Taro.getStorageSync(PROFILE_KEY)
  return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null
}

export function setProfile(profile: any) {
  Taro.setStorageSync(PROFILE_KEY, JSON.stringify(profile))
}

export function removeProfile() {
  Taro.removeStorageSync(PROFILE_KEY)
}

export function clearAuth() {
  removeToken()
  removeUser()
  removeProfile()
}
