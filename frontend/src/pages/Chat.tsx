import { useState, useEffect, useRef, useCallback } from 'react'
import { sendChatMessage, getChatHistory, clearChatHistory, analyzeFoodImage, addFoodEntryFromImage } from '../services/api'
import type { ChatMessage, FoodImageAnalysis } from '../types'
import { toast } from '../components/Toast'

const MEAL_TYPES = [
  { key: 'breakfast', label: '早餐', icon: '🌅' },
  { key: 'lunch', label: '午餐', icon: '☀️' },
  { key: 'dinner', label: '晚餐', icon: '🌙' },
  { key: 'snack', label: '加餐', icon: '🍪' },
]

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [recordData, setRecordData] = useState<FoodImageAnalysis | null>(null)
  const [recordMealType, setRecordMealType] = useState('snack')
  const [recordQuantity, setRecordQuantity] = useState(200)
  const [recording, setRecording] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getChatHistory(50)
      .then((res) => setMessages(res.data.messages || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const compressImage = (file: File, maxWidth: number, quality: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas not supported'))
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Compression failed'))
            const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
            resolve(compressed)
          },
          'image/jpeg',
          quality,
        )
      }
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('图片大小不能超过 20MB')
      return
    }

    setError(null)
    try {
      const compressed = await compressImage(file, 1024, 0.7)
      setImageFile(compressed)
      setImagePreview(URL.createObjectURL(compressed))
    } catch {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
    inputRef.current?.focus()
  }

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRecordToDiary = (foodAnalysis: FoodImageAnalysis) => {
    setRecordData(foodAnalysis)
    setRecordMealType('snack')
    setRecordQuantity(foodAnalysis.estimated_quantity || 200)
    setShowRecordModal(true)
  }

  const confirmRecord = async () => {
    if (!recordData) return
    setRecording(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await addFoodEntryFromImage({
        food_name: recordData.food_name,
        food_category: recordData.category,
        calories_per_100g: recordData.calories_per_100g,
        protein: recordData.protein,
        carbs: recordData.carbs,
        fat: recordData.fat,
        entry_date: today,
        meal_type: recordMealType,
        quantity: recordQuantity,
      })
      toast('已记录到饮食日记', 'success')
      setShowRecordModal(false)
      setRecordData(null)
    } catch {
      toast('记录失败，请重试', 'error')
    } finally {
      setRecording(false)
    }
  }

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text && !imageFile) return
    if (sending) return

    setInput('')
    setError(null)
    setSending(true)

    if (imageFile) {
      const displayText = text || '📷 分析食物图片'
      const userMsg: ChatMessage = {
        id: Date.now(),
        role: 'user',
        content: displayText,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg])
      removeImage()

      try {
        const res = await analyzeFoodImage(imageFile, text || undefined)
        setMessages((prev) => [...prev, res.data])
      } catch (e) {
        const axiosErr = e as { response?: { data?: { detail?: string } } }
        setError(axiosErr.response?.data?.detail || '图片分析失败，请检查网络后重试')
      } finally {
        setSending(false)
      }
      return
    }

    // Text-only message
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await sendChatMessage(text)
      setMessages((prev) => [...prev, res.data])
    } catch (e) {
      const axiosErr = e as { response?: { data?: { detail?: string } } }
      setError(axiosErr.response?.data?.detail || '发送失败，请检查网络后重试')
    } finally {
      setSending(false)
    }
  }, [input, sending, imageFile])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = async () => {
    if (!confirm('确定要清空所有对话记录吗？')) return
    try {
      await clearChatHistory()
      setMessages([])
    } catch {
      // ignore
    }
  }

  const suggestedQuestions = [
    { icon: '🥗', text: '根据我的目标，今天应该吃多少卡路里？' },
    { icon: '📊', text: '帮我分析一下最近的饮食情况' },
    { icon: '🍽️', text: '给我推荐一份减脂食谱' },
    { icon: '💪', text: '我应该怎么安排运动计划？' },
    { icon: '🧐', text: '蛋白质摄入不足怎么办？' },
    { icon: '⚖️', text: '为什么最近体重没变化？' },
  ]

  return (
    <div className="w-full h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AI 助手</h1>
          <p className="text-gray-500 text-sm">基于你的身体数据，提供个性化的健身和饮食建议</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            清空对话
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-4 mb-4 space-y-4">
        {loadingHistory ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">你好，我是你的AI健身教练</h2>
            <p className="text-sm text-gray-500 mb-6">你可以向我提问关于饮食、运动、营养等方面的问题</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {suggestedQuestions.map((q) => (
                <button
                  key={q.text}
                  onClick={() => { setInput(q.text); inputRef.current?.focus() }}
                  className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-4 py-3 text-left text-sm text-gray-700 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <span>{q.icon}</span>
                  <span className="line-clamp-2">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold mr-2 flex-shrink-0 mt-1">
                  AI
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md border border-gray-100 shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
                {/* Record to diary buttons for each food */}
                {msg.role === 'assistant' && msg.food_analysis && msg.food_analysis.length > 0 && (
                  <div className="mt-2 ml-1 space-y-1.5">
                    {msg.food_analysis.map((food, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRecordToDiary(food)}
                          className="inline-flex items-center space-x-1 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          <span>记录到饮食日记</span>
                        </button>
                        <span className="text-xs text-gray-400">
                          {food.food_name} · 约{food.calories_per_100g}kcal/100g
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <p className={`text-xs text-gray-400 mt-1 ${msg.role === 'user' ? 'text-right mr-1' : 'ml-1'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-sm font-bold ml-2 flex-shrink-0 mt-1">
                  U
                </div>
              )}
            </div>
          ))
        )}

        {sending && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold mr-2 flex-shrink-0">
              AI
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center">
            <span className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-full">{error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Image preview bar */}
      {imagePreview && (
        <div className="flex-shrink-0 mb-2 bg-white rounded-xl shadow-md p-3 border border-gray-100 flex items-center space-x-3">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
          />
          <div className="flex-1 text-sm text-gray-600 truncate">
            {imageFile?.name || '图片预览'}
          </div>
          <button
            onClick={removeImage}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 flex items-end space-x-3 bg-white rounded-xl shadow-md p-3 border border-gray-100">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
            imageFile
              ? 'bg-green-100 text-green-600'
              : 'bg-gray-100 text-gray-500 hover:bg-primary-100 hover:text-primary-600'
          } disabled:opacity-50`}
          title="拍照或上传食物图片"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={imageFile ? '添加描述（可选），然后点击分析...' : '输入你的问题... (Enter 发送，Shift+Enter 换行)'}
          disabled={sending}
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50"
          style={{ maxHeight: '120px' }}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 120) + 'px'
          }}
        />
        <button
          onClick={handleSend}
          disabled={(!input.trim() && !imageFile) || sending}
          className="bg-primary-600 text-white px-5 py-2 rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium flex-shrink-0"
        >
          {sending ? '分析中...' : imageFile ? '分析' : '发送'}
        </button>
      </div>

      {/* Record to Diary Modal */}
      {showRecordModal && recordData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">记录到饮食日记</h3>
                <button onClick={() => setShowRecordModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="font-medium text-gray-800">{recordData.food_name}</p>
                <div className="flex space-x-4 text-xs text-gray-600 mt-1">
                  <span>🔥 {recordData.calories_per_100g} kcal/100g</span>
                  <span>🥩 蛋白 {recordData.protein}g</span>
                  <span>🍚 碳水 {recordData.carbs}g</span>
                  <span>🧈 脂肪 {recordData.fat}g</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">餐食类型</label>
                  <div className="grid grid-cols-4 gap-2">
                    {MEAL_TYPES.map((mt) => (
                      <button
                        key={mt.key}
                        onClick={() => setRecordMealType(mt.key)}
                        className={`py-2 px-2 text-xs rounded-lg border transition-colors ${
                          recordMealType === mt.key
                            ? 'bg-primary-50 border-primary-300 text-primary-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div>{mt.icon}</div>
                        <div>{mt.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-1 block">份量 (g)</label>
                  <input
                    type="number"
                    value={recordQuantity}
                    onChange={(e) => setRecordQuantity(Number(e.target.value))}
                    min={10}
                    max={2000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <button
                  onClick={confirmRecord}
                  disabled={recording}
                  className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm"
                >
                  {recording ? '记录中...' : '确认记录'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
