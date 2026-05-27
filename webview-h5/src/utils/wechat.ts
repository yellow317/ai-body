// WeChat Mini Program web-view bridge utilities

declare global {
  interface Window {
    wx?: {
      miniProgram?: {
        navigateBack: (options?: { delta?: number }) => void
        navigateTo: (options: { url: string }) => void
        redirectTo: (options: { url: string }) => void
        postMessage: (options: { data: Record<string, unknown> }) => void
        getEnv: (cb: (env: { miniprogram: boolean }) => void) => void
        switchTab?: (options: { url: string }) => void
      }
      ready?: (cb: () => void) => void
      error?: (cb: (err: unknown) => void) => void
      config?: (options: Record<string, unknown>) => void
      checkJsApi?: (options: Record<string, unknown>) => void
    }
    __wxjs_environment?: string
  }
}

export function isInMiniProgram(): boolean {
  if (typeof window === 'undefined') return false
  if (window.__wxjs_environment === 'miniprogram') return true

  // Fallback: check user agent
  if (/miniprogram/i.test(navigator.userAgent)) return true

  return false
}

export function postMessageToMiniProgram(data: Record<string, unknown>) {
  if (window.wx?.miniProgram?.postMessage) {
    window.wx.miniProgram.postMessage({ data })
  }
}

export function navigateBackMiniProgram(delta = 1) {
  if (window.wx?.miniProgram?.navigateBack) {
    window.wx.miniProgram.navigateBack({ delta })
  } else {
    window.history.back()
  }
}

export function initWechatEnv(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.wx) {
      resolve(isInMiniProgram())
      return
    }

    window.wx.ready?.(() => {
      window.wx?.miniProgram?.getEnv?.((env) => {
        resolve(env.miniprogram)
      })
    })

    if (window.wx.error) {
      window.wx.error(() => {
        resolve(false)
      })
    }

    // Timeout fallback
    setTimeout(() => resolve(isInMiniProgram()), 3000)
  })
}
