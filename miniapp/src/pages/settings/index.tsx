import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, Picker } from '@tarojs/components'
import { updateProfile } from '../../api'
import { getUser, setUser, clearAuth } from '../../utils/storage'
import './index.scss'

const ACTIVITY_OPTIONS = [
  { v: 'sedentary', l: '久坐' },
  { v: 'light', l: '轻度运动' },
  { v: 'moderate', l: '中度运动' },
  { v: 'active', l: '高度运动' },
  { v: 'very_active', l: '极高度' },
]

const GOAL_OPTIONS = [
  { v: 'lose', l: '减脂' },
  { v: 'gain', l: '增肌' },
  { v: 'maintain', l: '维持' },
]

export default function Settings() {
  const user = getUser()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ height: '', weight: '', age: '', gender: 'male', activity_level: 'moderate', goal: 'maintain' })
  const [saving, setSaving] = useState(false)

  const handleNumber = (field: string) => (e: any) => {
    setForm({ ...form, [field]: e.detail.value })
  }

  const handleSave = async () => {
    setSaving(true)
    const data: any = {}
    if (form.height) data.height = Number(form.height)
    if (form.weight) data.weight = Number(form.weight)
    if (form.age) data.age = Number(form.age)
    if (form.gender) data.gender = form.gender
    if (form.activity_level) data.activity_level = form.activity_level
    if (form.goal) data.goal = form.goal
    try {
      await updateProfile(data)
      // Update local user data
      if (user) {
        setUser({ ...user, ...data })
      }
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setShowForm(false)
    } catch { Taro.showToast({ title: '保存失败', icon: 'error' }) }
    setSaving(false)
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          clearAuth()
          Taro.redirectTo({ url: '/pages/login/index' })
        }
      },
    })
  }

  const navigateTo = (url: string) => {
    Taro.navigateTo({ url })
  }

  return (
    <View className='page-container settings-page'>
      {/* User Info */}
      <View className='card'>
        <Text className='section-title'>账号信息</Text>
        <View className='info-row'><Text className='info-label'>用户名</Text><Text className='info-val'>{user?.username || '--'}</Text></View>
        <View className='info-row'><Text className='info-label'>邮箱</Text><Text className='info-val'>{user?.email || user?.user?.email || '--'}</Text></View>
        <View className='info-row'><Text className='info-label'>注册时间</Text><Text className='info-val'>{user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '--'}</Text></View>
      </View>

      {/* Body Data */}
      <View className='card'>
        <View className='card-header'>
          <Text className='section-title'>身体数据</Text>
          <View className='edit-btn' onClick={() => setShowForm(!showForm)}>
            <Text className='edit-btn-text'>{showForm ? '取消' : '编辑'}</Text>
          </View>
        </View>

        {showForm ? (
          <View className='settings-form'>
            <View className='form-grid'>
              <View className='form-cell'>
                <Text className='cell-label'>身高(cm)</Text>
                <Input className='cell-input' type='digit' placeholder='170' value={form.height}
                  onInput={handleNumber('height')} />
              </View>
              <View className='form-cell'>
                <Text className='cell-label'>体重(kg)</Text>
                <Input className='cell-input' type='digit' placeholder='65' value={form.weight}
                  onInput={handleNumber('weight')} />
              </View>
              <View className='form-cell'>
                <Text className='cell-label'>年龄</Text>
                <Input className='cell-input' type='digit' placeholder='25' value={form.age}
                  onInput={handleNumber('age')} />
              </View>
              <View className='form-cell'>
                <Text className='cell-label'>性别</Text>
                <Picker mode='selector' range={['男', '女']} value={form.gender === 'male' ? 0 : 1}
                  onChange={(e: any) => setForm({ ...form, gender: e.detail.value === 0 ? 'male' : 'female' })}>
                  <View className='cell-picker'><Text>{form.gender === 'male' ? '男' : '女'}</Text></View>
                </Picker>
              </View>
            </View>
            <Text className='cell-label'>活动水平</Text>
            <Picker mode='selector' range={ACTIVITY_OPTIONS.map(o => o.l)} value={ACTIVITY_OPTIONS.findIndex(o => o.v === form.activity_level)}
              onChange={(e: any) => setForm({ ...form, activity_level: ACTIVITY_OPTIONS[e.detail.value].v })}>
              <View className='cell-picker full'><Text>{ACTIVITY_OPTIONS.find(o => o.v === form.activity_level)?.l}</Text></View>
            </Picker>
            <Text className='cell-label' style={{ marginTop: '16rpx' }}>目标</Text>
            <Picker mode='selector' range={GOAL_OPTIONS.map(o => o.l)} value={GOAL_OPTIONS.findIndex(o => o.v === form.goal)}
              onChange={(e: any) => setForm({ ...form, goal: GOAL_OPTIONS[e.detail.value].v })}>
              <View className='cell-picker full'><Text>{GOAL_OPTIONS.find(o => o.v === form.goal)?.l}</Text></View>
            </Picker>
            <View className='submit-btn' onClick={handleSave}>
              <Text>{saving ? '保存中...' : '保存'}</Text>
            </View>
          </View>
        ) : (
          <Text className='empty-hint'>点击编辑设置你的身体数据</Text>
        )}
      </View>

      {/* Links */}
      <View className='card link-list'>
        <View className='link-item' onClick={() => navigateTo('/pages/calculator/index')}>
          <Text className='link-text'>身体指标计算器</Text>
          <Text className='link-arrow'>›</Text>
        </View>
        <View className='link-item' onClick={() => navigateTo('/pages/recommendations/index')}>
          <Text className='link-text'>AI 饮食推荐</Text>
          <Text className='link-arrow'>›</Text>
        </View>
        <View className='link-item' onClick={() => navigateTo('/pages/reports/index')}>
          <Text className='link-text'>饮食报告</Text>
          <Text className='link-arrow'>›</Text>
        </View>
      </View>

      {/* Logout */}
      <View className='logout-btn' onClick={handleLogout}>
        <Text className='logout-text'>退出登录</Text>
      </View>
    </View>
  )
}
