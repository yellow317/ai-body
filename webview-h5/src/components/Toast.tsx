import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'

interface ToastContextType {
  show: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextType | null>(null)

// Global toast reference for use outside React components
const globalToast = { current: null as ToastContextType | null }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([])
  const nextId = useRef(0)

  const show = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = nextId.current++
    setToasts((prev) => [...prev.slice(-2), { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2500)
  }, [])

  // Expose to global
  useEffect(() => {
    globalToast.current = { show }
    return () => { globalToast.current = null }
  }, [show])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-5 py-2.5 rounded-full text-sm font-medium shadow-lg transition-all animate-[slideDown_0.3s_ease] ${
              t.type === 'success' ? 'bg-green-500 text-white' :
              t.type === 'error' ? 'bg-red-500 text-white' :
              'bg-gray-800 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-20px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// Global toast function for use in non-React code or callbacks
export const toast = {
  show(message: string, type?: 'success' | 'error' | 'info') {
    if (globalToast.current) {
      globalToast.current.show(message, type)
    } else {
      console.warn('Toast not initialized:', message)
    }
  },
}
