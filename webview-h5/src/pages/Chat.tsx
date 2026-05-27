import { useState, useEffect, useRef, useCallback } from 'react'
import { sendChatMessage, getChatHistory, clearChatHistory, analyzeFoodImage } from '../services/api'
import type { ChatMessage } from '../types'

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getChatHistory(50).then(res => setMessages(res.data.messages || [])).catch(() => {}).finally(() => setLoadingHistory(false))
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const compressImage = (file: File, maxWidth: number, quality: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth }
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas not supported'))
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Compression failed'))
          resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
        }, 'image/jpeg', quality)
      }
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('请选择图片文件'); return }
    if (file.size > 20 * 1024 * 1024) { setError('图片大小不能超过 20MB'); return }
    setError(null)
    try {
      const compressed = await compressImage(file, 1024, 0.7)
      setImageFile(compressed); setImagePreview(URL.createObjectURL(compressed))
    } catch {
      setImageFile(file); setImagePreview(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null); setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text && !imageFile) return
    if (sending) return
    setInput(''); setError(null); setSending(true)

    if (imageFile) {
      const userMsg: ChatMessage = { id: Date.now(), role: 'user', content: text || '分析食物图片', created_at: new Date().toISOString() }
      setMessages(prev => [...prev, userMsg])
      removeImage()
      try {
        const res = await analyzeFoodImage(imageFile, text || undefined)
        setMessages(prev => [...prev, res.data])
      } catch { setError('图片分析失败') }
      setSending(false)
      return
    }

    const userMsg: ChatMessage = { id: Date.now(), role: 'user', content: text, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    try {
      const res = await sendChatMessage(text)
      setMessages(prev => [...prev, res.data])
    } catch { setError('发送失败') }
    setSending(false)
  }, [input, sending, imageFile])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleClear = async () => {
    if (!confirm('确定要清空所有对话记录吗？')) return
    try { await clearChatHistory(); setMessages([]) } catch {}
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
    <div className="max-w-lg mx-auto h-[calc(100vh-7rem)] flex flex-col px-4">
      <div className="flex items-center justify-between py-3 flex-shrink-0">
        <div><h1 className="text-xl font-bold text-gray-800">AI 助手</h1><p className="text-gray-500 text-xs">智能健身与饮食顾问</p></div>
        {messages.length > 0 && <button onClick={handleClear} className="text-xs text-gray-400 active:text-red-500">清空</button>}
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-3 mb-3 space-y-3 hide-scrollbar">
        {loadingHistory ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3">💬</div>
            <h2 className="text-base font-semibold text-gray-700 mb-1">你好，我是你的AI健身教练</h2>
            <p className="text-xs text-gray-500 mb-4">向我提问关于饮食、运动、营养的问题</p>
            <div className="grid grid-cols-1 gap-1.5">
              {suggestedQuestions.map(q => (
                <button key={q.text} onClick={() => setInput(q.text)}
                  className="flex items-center space-x-2 bg-white border border-gray-100 rounded-lg px-3 py-2.5 text-left text-xs text-gray-700 active:bg-primary-50 active:border-primary-200">
                  <span>{q.icon}</span><span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">AI</div>
              )}
              <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' ? 'bg-primary-600 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md border border-gray-100 shadow-sm'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-bold ml-2 flex-shrink-0 mt-1">U</div>
              )}
            </div>
          ))
        )}

        {sending && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold mr-2">AI</div>
            <div className="bg-white border rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        {error && <div className="text-center"><span className="text-sm text-red-500 bg-red-50 px-3 py-1.5 rounded-full">{error}</span></div>}

        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="flex-shrink-0 bg-white rounded-xl shadow-sm p-2 mb-2 flex items-center space-x-3 border border-gray-100">
          <img src={imagePreview} alt="Preview" className="w-14 h-14 object-cover rounded-lg" />
          <span className="flex-1 text-xs text-gray-600 truncate">{imageFile?.name || '图片预览'}</span>
          <button onClick={removeImage} className="text-gray-400 active:text-red-500 p-1">✕</button>
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 flex items-end space-x-2 bg-white rounded-xl shadow-sm p-2 border border-gray-100 mb-2">
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} disabled={sending}
          className={`p-2.5 rounded-xl flex-shrink-0 ${imageFile ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 active:bg-primary-100 active:text-primary-600'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="输入问题... (Enter 发送)"
          disabled={sending} rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          style={{ maxHeight: '100px' }}
          onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 100) + 'px' }} />
        <button onClick={handleSend} disabled={(!input.trim() && !imageFile) || sending}
          className="bg-primary-600 text-white px-4 py-2 rounded-xl active:bg-primary-700 disabled:opacity-40 text-sm font-medium flex-shrink-0">
          {sending ? '...' : imageFile ? '分析' : '发送'}
        </button>
      </div>
    </div>
  )
}
