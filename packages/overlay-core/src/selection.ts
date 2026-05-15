import type { AIOverlaySelection, AIOverlaySelectionConfig } from './types'
import { matchesAnySelector, normalizeText } from './utils'

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

function describeImage(image: HTMLImageElement) {
  const src = image.currentSrc || image.src
  const alt = image.alt || 'No alt text'

  return {
    label: `image: ${alt.slice(0, 64)}`,
    content: [
      'Selected image',
      `Alt text: ${alt}`,
      `Source: ${src}`,
      `Rendered size: ${Math.round(image.width)}x${Math.round(image.height)}`,
      `Natural size: ${image.naturalWidth}x${image.naturalHeight}`,
    ].join('\n'),
  }
}

function canSelect(element: HTMLElement, config: Required<AIOverlaySelectionConfig>) {
  if (matchesAnySelector(element, config.blockedSelectors)) {
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

  const onClickCapture = (event: MouseEvent) => {
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

    const details = image ? describeImage(image) : describeElement(target)
    const rect = image ? image.getBoundingClientRect() : target.getBoundingClientRect()

    options.onSelection({
      kind: image ? 'image' : 'element',
      label: details.label,
      content: details.content,
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
