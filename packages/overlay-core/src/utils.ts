export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function matchesAnySelector(
  element: Element, 
  selectors: string[] = []
): boolean {
  return selectors.some((selector) => {
    try {
      return element.matches(selector) || Boolean(element.closest(selector))
    } catch {
      return false
    }
  })
}

export function isMacLike(): boolean {
  return /Mac|iPhone|iPad|iPod/i.test(window.navigator.platform)
}

export function debounce<T extends (...args: any[]) => void>(
  fn: T, 
  delay: number = 50
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }) as (...args: Parameters<T>) => void
}

export function throttle<T extends (...args: any[]) => void>(
  fn: T, 
  limit: number = 200
): (...args: Parameters<T>) => void {
  let lastCallTime = 0

  return ((...args: Parameters<T>) => {
    const now = performance.now()
    
    if (now - lastCallTime >= limit) {
      fn(...args)
      lastCallTime = now
    }
  }) as (...args: Parameters<T>) => void
}

export function generateId(prefix = 'sc_'): string {
  const randomBytes = Math.random().toString(36).substring(2, 15)
  const timestamp = Date.now().toString(36).substring(0, 5)
  return `${prefix}${randomBytes}${timestamp}`
}

export function safeJsonParse<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    console.warn('Failed to parse JSON:', value)
    return null
  }
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${(bytes / Math.pow(k, i)).toFixed(dm)} ${sizes[i]}`
}

export function extractElementContent(element: Element): string {
  const children = Array.from(element.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE || 
                   node.nodeType === Node.ELEMENT_NODE)
  
  return children.map(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      return child.textContent?.trim() || ''
    }
    return extractElementContent(child as Element)
  }).join(' ')
}
