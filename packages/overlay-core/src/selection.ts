import type { AIOverlaySelection, AIOverlaySelectionConfig } from './types'
import { matchesAnySelector, normalizeText } from './utils'
import { buildUniqueSelector, collectElementContext } from './editor'

export type SelectionControllerOptions = {
  config: Required<AIOverlaySelectionConfig>
  isActive: () => boolean
  isOverlayElement: (element: Element) => boolean
  onHover: (rect: DOMRect | null) => void
  onSelection: (selection: AIOverlaySelection) => void
}

function getSelectionRect(selection: Selection) {
  if (selection.rangeCount === 0) {
    return null
  }

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  if (rect.width > 0 || rect.height > 0) {
    return rect
  }

  return range.getClientRects()[0] ?? null
}

function baseSelection(rect: DOMRect) {
  return {
    rect,
    url: window.location.href,
    title: document.title,
  }
}

function describeElement(element: HTMLElement) {
  const text = normalizeText(element.innerText ?? '')
  const tag = element.tagName.toLowerCase()
  const aria = element.getAttribute('aria-label')
  const title = element.getAttribute('title')
  const descriptor = [aria, title, text].find(Boolean)

  return {
    label: descriptor ? `${tag}: ${descriptor.slice(0, 64)}` : tag,
    data: undefined,
    mimeType: undefined,
    content: [
      `Selected element: <${tag}>`,
      aria ? `ARIA label: ${aria}` : '',
      title ? `Title: ${title}` : '',
      text ? `Visible text: ${text.slice(0, 5000)}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

function describeImage(image: HTMLImageElement): Promise<{
  label: string
  data: string | undefined
  mimeType: string | undefined
  alt: string
  source: string
  content: string
}> {
  const src = image.currentSrc || image.src
  const alt = image.alt || 'No alt text'

  return new Promise((resolve) => {
    const result = {
      label: `image: ${alt.slice(0, 64)}`,
      data: undefined as string | undefined,
      mimeType: undefined as string | undefined,
      alt,
      source: src,
      content: [
        'Selected image',
        `Alt text: ${alt}`,
        `Source: ${src}`,
        `Rendered size: ${Math.round(image.width)}x${Math.round(image.height)}`,
        `Natural size: ${image.naturalWidth}x${image.naturalHeight}`,
      ].join('\n'),
    }

    // 1. Try direct capture first (fastest)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth || image.width || 100
      canvas.height = image.naturalHeight || image.height || 100
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(image, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        const [header, base64] = dataUrl.split(',')
        result.data = base64
        result.mimeType = header.split(':')[1].split(';')[0]
        resolve(result)
        return
      }
    } catch (e) {
      // Direct capture failed (likely CORS), proceed to fallback reload
    }

    // 2. Fallback: Reload with crossOrigin = anonymous to try and bypass CORS if the server supports it
    const imgCopy = new Image()
    imgCopy.crossOrigin = 'anonymous'

    imgCopy.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = imgCopy.naturalWidth || imgCopy.width || 100
        canvas.height = imgCopy.naturalHeight || imgCopy.height || 100
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(imgCopy, 0, 0)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
          const [header, base64] = dataUrl.split(',')
          result.data = base64
          result.mimeType = header.split(':')[1].split(';')[0]
        }
      } catch (err) {
        console.warn('CORS fallback failed to export canvas:', err)
      }
      resolve(result)
    }

    imgCopy.onerror = () => {
      console.warn('CORS fallback failed to load image copy')
      resolve(result)
    }

    // Use cache-busting parameter to prevent using a cached tainted image response
    if (src.startsWith('data:')) {
      imgCopy.src = src
    } else {
      const separator = src.includes('?') ? '&' : '?'
      imgCopy.src = `${src}${separator}crossorigin-bypass=true`
    }
  })
}

function canSelect(element: HTMLElement, config: Required<AIOverlaySelectionConfig>) {
  if (matchesAnySelector(element, config.blockedSelectors)) {
    return false
  }

  // Prevent selecting very large container elements (like <body> or full-screen wrappers)
  const rect = element.getBoundingClientRect()
  const viewportArea = window.innerWidth * window.innerHeight
  const elementArea = rect.width * rect.height
  
  if (elementArea > viewportArea * 0.5) {
    return false
  }

  if (config.allowedSelectors.length > 0 && !matchesAnySelector(element, config.allowedSelectors)) {
    return false
  }

  return true
}

export function createSelectionController(options: SelectionControllerOptions) {
  const onPointerOver = (event: PointerEvent) => {
    if (!options.isActive()) {
      return
    }

    const target = event.target
    if (!(target instanceof HTMLElement) || options.isOverlayElement(target)) {
      options.onHover(null)
      return
    }

    if (!canSelect(target, options.config)) {
      options.onHover(null)
      return
    }

    options.onHover(target.getBoundingClientRect())
  }

  const onMouseUp = () => {
    if (!options.isActive() || !options.config.text) {
      return
    }

    window.setTimeout(() => {
      const activeSelection = window.getSelection()
      const text = normalizeText(activeSelection?.toString() ?? '')

      if (!activeSelection || !text) {
        return
      }

      const rect = getSelectionRect(activeSelection)
      const container = activeSelection.anchorNode?.parentElement

      if (!rect || !container || !canSelect(container, options.config)) {
        return
      }

      options.onSelection({
        kind: 'text',
        label: 'highlighted text',
        content: text,
        ...baseSelection(rect),
      })
    }, 0)
  }

  const onClickCapture = async (event: MouseEvent) => {
    if (!options.isActive()) {
      return
    }

    const target = event.target
    if (!(target instanceof HTMLElement) || options.isOverlayElement(target)) {
      return
    }

    if (!canSelect(target, options.config)) {
      return
    }

    const textSelection = normalizeText(window.getSelection()?.toString() ?? '')
    if (textSelection) {
      return
    }

    const image = target instanceof HTMLImageElement ? target : target.querySelector('img')
    const isImageSelection = Boolean(image)

    if ((isImageSelection && !options.config.images) || (!isImageSelection && !options.config.elements)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const details = image ? await describeImage(image) : describeElement(target)
    const rect = image ? image.getBoundingClientRect() : target.getBoundingClientRect()
    const actualEl = image ?? target

    options.onSelection({
      kind: image ? 'image' : 'element',
      label: details.label,
      content: details.content,
      data: details.data,
      mimeType: details.mimeType,
      alt: (details as any).alt,
      source: (details as any).source,
      element: actualEl,
      cssSelector: buildUniqueSelector(actualEl),
      computedStyles: collectElementContext(actualEl),
      ...baseSelection(rect),
    })
  }

  document.addEventListener('pointerover', onPointerOver)
  document.addEventListener('mouseup', onMouseUp)
  document.addEventListener('click', onClickCapture, true)

  return () => {
    document.removeEventListener('pointerover', onPointerOver)
    document.removeEventListener('mouseup', onMouseUp)
    document.removeEventListener('click', onClickCapture, true)
  }
}
