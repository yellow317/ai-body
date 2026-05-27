import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import { sendChatMessage, getChatHistory, clearChatHistory, analyzeFoodImage } from '../../api'
import './index.scss'

const SUGGESTIONS = [
  { icon: '🥗', text: '根据我的目标，今天应该吃多少卡路里？' },
  { icon: '📊', text: '帮我分析一下最近的饮食情况' },
  { icon: '🍽️', text: '给我推荐一份减脂食谱' },
  { icon: '💪', text: '我应该怎么安排运动计划？' },
  { icon: '🧐', text: '蛋白质摄入不足怎么办？' },
  { icon: '⚖️', text: '为什么最近体重没变化？' },
]

export default function Chat() {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [imagePath, setImagePath] = useState('')
  const scrollViewRef = useRef<any>(null)

  useEffect(() => {
    getChatHistory(50)
      .then((res: any) => setMessages(res.messages || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollIntoView?.({ behavior: 'smooth' })
    }, 100)
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text && !imagePath) return
    if (sending) return

    setInput('')
    setSending(true)

    // Image analysis
    if (imagePath) {
      const userMsg = { id: Date.now(), role: 'user', content: text || '分析食物图片', created_at: new Date().toISOString() }
      setMessages(prev => [...prev, userMsg])
      try {
        const res: any = await analyzeFoodImage(imagePath, text || undefined)
        setMessages(prev => [...prev, res])
      } catch {
        Taro.showToast({ title: '图片分析失败', icon: 'error' })
      }
      setImagePath('')
      setSending(false)
      return
    }

    // Text message
    const userMsg = { id: Date.now(), role: 'user', content: text, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    try {
      const res: any = await sendChatMessage(text)
      setMessages(prev => [...prev, res])
    } catch {
      Taro.showToast({ title: '发送失败', icon: 'error' })
    }
    setSending(false)
  }

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        setImagePath(res.tempFilePaths[0])
      },
    })
  }

  const handleClear = async () => {
    const res = await Taro.showModal({ title: '确认', content: '确定要清空所有对话记录吗？' })
    if (res.confirm) {
      try { await clearChatHistory(); setMessages([]) } catch {}
    }
  }

  return (
    <View className='page-container chat-page'>
      {/* Header */}
      <View className='chat-header'>
        <View>
          <Text className='chat-title'>AI 助手</Text>
          <Text className='chat-sub'>智能健身与饮食顾问</Text>
        </View>
        {messages.length > 0 && (
          <View className='clear-btn' onClick={handleClear}>
            <Text className='clear-btn-text'>清空</Text>
          </View>
        )}
      </View>

      {/* Messages */}
      <ScrollView scrollY className='msg-area' scrollTop={99999}>
        {loadingHistory ? (
          <View className='spinner-wrap'><View className='spinner'></View></View>
        ) : messages.length === 0 ? (
          <View className='welcome-area'>
            <Text className='welcome-icon'>💬</Text>
            <Text className='welcome-title'>你好，我是你的AI健身教练</Text>
            <Text className='welcome-sub'>向我提问关于饮食、运动、营养的问题</Text>
            <View className='suggestion-grid'>
              {SUGGESTIONS.map((s, i) => (
                <View key={i} className='suggestion-item' onClick={() => setInput(s.text)}>
                  <Text>{s.icon} {s.text}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <>
            {messages.map((msg: any) => (
              <View key={msg.id} className={`msg-row ${msg.role === 'user' ? 'user-msg' : 'ai-msg'}`}>
                {msg.role === 'assistant' && (
                  <View className='msg-avatar ai-avatar'><Text>AI</Text></View>
                )}
                <View className={`msg-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}>
                  <Text className='msg-text'>{msg.content}</Text>
                </View>
                {msg.role === 'user' && (
                  <View className='msg-avatar user-avatar'><Text>U</Text></View>
                )}
              </View>
            ))}
          </>
        )}

        {sending && (
          <View className='msg-row ai-msg'>
            <View className='msg-avatar ai-avatar'><Text>AI</Text></View>
            <View className='msg-bubble bubble-ai typing-bubble'>
              <View className='dot' /><View className='dot' /><View className='dot' />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Image preview */}
      {imagePath && (
        <View className='image-preview'>
          <Image src={imagePath} className='preview-img' mode='aspectFill' />
          <View className='remove-img' onClick={() => setImagePath('')}><Text>✕</Text></View>
        </View>
      )}

      {/* Input */}
      <View className='input-row'>
        <View className='img-btn' onClick={handleChooseImage}>
          <Text>📷</Text>
        </View>
        <Input className='msg-input' placeholder='输入问题...' value={input}
          onInput={(e: any) => setInput(e.detail.value)}
          onConfirm={handleSend}
          confirmType='send' />
        <View className='send-btn' onClick={handleSend}>
          <Text className='send-btn-text'>{imagePath ? '分析' : '发送'}</Text>
        </View>
      </View>
    </View>
  )
}
