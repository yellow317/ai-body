import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input } from '@tarojs/components'
import { register, login, getMe } from '../../api'
import { setToken, setUser } from '../../utils/storage'
import './index.scss'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!email || !username || !password) {
      setError('请填写所有字段')
      return
    }
    if (password !== confirm) {
      setError('两次密码不一致')
      return
    }
    setLoading(true)
    setError('')
    try {
      await register(email, username, password, confirm)
      const loginRes: any = await login(username, password)
      const token = loginRes.access_token || loginRes.token
      setToken(token)
      const userRes: any = await getMe()
      setUser(userRes)
      Taro.switchTab({ url: '/pages/index/index' })
    } catch (e: any) {
      setError(e.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const goLogin = () => {
    Taro.navigateBack()
  }

  return (
    <View className='register-page'>
      <View className='header-area'>
        <View className='header-title'>创建账号</View>
        <View className='header-sub'>开始你的健康之旅</View>
      </View>

      <View className='form-card card'>
        <View className='form-item'>
          <Text className='form-label'>邮箱</Text>
          <Input
            className='input-field'
            placeholder='请输入邮箱'
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
          />
        </View>

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

        <View className='form-item'>
          <Text className='form-label'>确认密码</Text>
          <Input
            className='input-field'
            type='password'
            placeholder='请再次输入密码'
            value={confirm}
            onInput={(e) => setConfirm(e.detail.value)}
          />
        </View>

        {error && <View className='error-msg'>{error}</View>}

        <View className='btn-primary' onClick={handleRegister}>
          {loading ? '注册中...' : '注 册'}
        </View>

        <View className='link-area' onClick={goLogin}>
          <Text className='link-text'>已有账号？返回登录</Text>
        </View>
      </View>
    </View>
  )
}
