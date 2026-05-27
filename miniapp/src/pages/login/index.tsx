import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input } from '@tarojs/components'
import { login, getMe } from '../../api'
import { setToken, setUser } from '../../utils/storage'
import './index.scss'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username || !password) {
      setError('请输入用户名和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res: any = await login(username, password)
      const token = res.access_token || res.token
      setToken(token)
      const userRes: any = await getMe()
      setUser(userRes)
      Taro.switchTab({ url: '/pages/index/index' })
    } catch (e: any) {
      setError(e.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const goRegister = () => {
    Taro.navigateTo({ url: '/pages/register/index' })
  }

  return (
    <View className='login-page'>
      <View className='logo-area'>
        <View className='logo-emoji'>🏋️</View>
        <View className='logo-title'>AI 健康饮食</View>
        <View className='logo-sub'>科学饮食 · 健康生活</View>
      </View>

      <View className='form-card card'>
        <View className='form-item'>
          <Text className='form-label'>用户名</Text>
          <Input
            className='input-field'
            placeholder='请输入用户名'
            value={username}
            onInput={(e) => setUsername(e.detail.value)}
          />
        </View>

        <View className='form-item'>
          <Text className='form-label'>密码</Text>
          <Input
            className='input-field'
            type='password'
            placeholder='请输入密码'
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>

        {error && <View className='error-msg'>{error}</View>}

        <View className='btn-primary' onClick={handleLogin}>
          {loading ? '登录中...' : '登 录'}
        </View>

        <View className='link-area' onClick={goRegister}>
          <Text className='link-text'>没有账号？立即注册</Text>
        </View>
      </View>
    </View>
  )
}
