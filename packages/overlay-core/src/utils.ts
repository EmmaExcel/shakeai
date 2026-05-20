/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Normalize whitespace in text
 */
export function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/**
 * Check if element matches any of the provided CSS selectors
 */
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

/**
 * Check if running on Mac-like platform (Mac, iOS devices)
 */
export function isMacLike(): boolean {
  return /Mac|iPhone|iPad|iPod/i.test(window.navigator.platform)
}

/**
 * Debounce a function to limit how often it can be called
 */
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

/**
 * Throttle a function to ensure it doesn't run more often than allowed
 */
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

/**
 * Create a unique ID for tracking sessions/events
 */
export function generateId(prefix = 'sc_'): string {
  const randomBytes = Math.random().toString(36).substring(2, 15)
  const timestamp = Date.now().toString(36).substring(0, 5)
  return `${prefix}${randomBytes}${timestamp}`
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    console.warn('Failed to parse JSON:', value)
    return null
  }
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${(bytes / Math.pow(k, i)).toFixed(dm)} ${sizes[i]}`
}

/**
 * Extract content from element including child text nodes
 */
export function extractElementContent(element: Element): string {
  const children = Array.from(element.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE || 
                   node.nodeType === Node.ELEMENT_NODE)
  
  return children.map(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      return child.textContent?.trim() || ''
    }
    // Recursively get text from element children
    return extractElementContent(child as Element)
  }).join(' ')
}
