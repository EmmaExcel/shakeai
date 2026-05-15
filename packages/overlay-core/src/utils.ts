export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

export function matchesAnySelector(element: Element, selectors: string[] = []) {
  return selectors.some((selector) => {
    try {
      return element.matches(selector) || Boolean(element.closest(selector))
    } catch {
      return false
    }
  })
}

export function isMacLike() {
  return /Mac|iPhone|iPad|iPod/i.test(window.navigator.platform)
}
