import type { AIOverlaySelection, AIOverlayThemeConfig } from './types'
import { clamp } from './utils'

type OverlayUIOptions = {
  theme: AIOverlayThemeConfig & Required<Pick<AIOverlayThemeConfig, 'primaryColor' | 'panelBackground' | 'textColor' | 'borderRadius'>>
  onSubmit: (question: string) => void
  onCancel: () => void
}

export type OverlayUI = {
  root: HTMLElement
  contains: (element: Element) => boolean
  setActive: (active: boolean, count: number) => void
  setHoverRect: (rect: DOMRect | null) => void
  showPrompt: (selection: AIOverlaySelection) => void
  setThinking: (thinking: boolean) => void
  setAnswer: (answer: string) => void
  setError: (error: string) => void
  clearSelection: () => void
  destroy: () => void
  setInspectMode: (active: boolean, element?: Element | null) => void
}

export function createOverlayUI(options: OverlayUIOptions): OverlayUI {
  const host = document.createElement('div')
  host.dataset.aiOverlayRoot = 'true'
  
  const globalStyle = document.createElement('style')
  globalStyle.dataset.aiOverlayStyle = 'true'
  globalStyle.textContent = `
    body.ai-overlay-active,
    body.ai-overlay-active * {
      cursor: none !important;
    }

    /* Inspect Mode Styles */
    .inspect-active .kind::after {
      content: ' [INSPECT]';
      color: #fbbf24;
      font-size: 0.7em;
    }
  `
  
  const shadow = host.attachShadow({ mode: 'open' })
  document.head.append(globalStyle)
  document.body.append(host)

  // Enhanced Styles with Inspect Mode Support
  const enhancedStyles = `
    :host {
      all: initial;
      --ai-blue: #4285F4;
      --ai-red: #DB4437;
      --ai-yellow: #F4B400;
      --ai-green: #0F9D58;
      
      /* Premium Dark Mode Colors */
      --ai-bg: #0f172a;
      --ai-bg-raised: #1e293b;
      --ai-text: #f1f5f9;
      --ai-text-muted: #94a3b8;
      --ai-primary: ${options.theme.primaryColor};
      --ai-radius: ${options.theme.borderRadius}px;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .custom-cursor {
      position: fixed;
      left: 0;
      top: 0;
      width: 24px;
      height: 24px;
      pointer-events: none;
      z-index: 2147483647;
      display: none;
      margin-left: -2px;
      margin-top: -2px;
      filter: drop-shadow(0 0 12px rgba(66, 133, 244, 0.8));
    }

    .custom-cursor.active {
      display: block;
    }

    .cursor-shape {
      width: 100%;
      height: 100%;
      fill: #ffffff;
      stroke: var(--ai-blue);
      stroke-width: 2.5px;
      stroke-linejoin: round;
    }

    /* Inspect Mode Highlight */
    .inspect-active {
      position: relative;
    }
    
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulse-ring {
      70% { box-shadow: 0 0 0 10px transparent; }
      100% { box-shadow: 0 0 0 0 transparent; }
    }

    .toast,
    .hover,
    .panel,
    .head,
    .kind,
    .label,
    .close,
    .content-area,
    .answer,
    .footer,
    form,
    textarea,
    .submit,
    .error {
      all: initial;
    }

    .toast {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 2147483645;
      display: none;
      align-items: center;
      gap: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 999px;
      background: var(--ai-bg-raised);
      color: var(--ai-text);
      padding: 10px 16px;
      font: 700 13px/1 Inter, ui-sans-serif, system-ui, sans-serif;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }

    .toast.active {
      display: flex;
    }

    .pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--ai-blue);
      box-shadow: 0 0 0 0 rgba(66, 133, 244, 0.4);
      animation: pulse-ring 1.3s infinite;
    }

    .count {
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      padding-left: 10px;
      opacity: 0.6;
    }

    .hover {
      position: fixed;
      z-index: 2147483644;
      pointer-events: none;
      display: none;
      border: 2px solid transparent;
      border-radius: var(--ai-radius);
      background: none !important;
      border-image: conic-gradient(var(--ai-blue), var(--ai-red), var(--ai-yellow), var(--ai-green), var(--ai-blue)) 1;
      box-shadow: 0 0 20px rgba(66, 133, 244, 0.3);
      transition: all 0.08s ease-out;
    }

    /* Premium Dark Panel with Unique Border */
    .panel {
      position: absolute;
      z-index: 2147483646;
      width: 420px;
      display: none;
      flex-direction: column;
      background: var(--ai-bg);
      color: var(--ai-text);
      box-shadow: 0 30px 100px rgba(0, 0, 0, 0.6);
      border: 2px solid transparent;
      border-radius: 16px;
      /* Glowing Unique Border */
      background-image: linear-gradient(var(--ai-bg), var(--ai-bg)), 
                        conic-gradient(var(--ai-blue), var(--ai-red), var(--ai-yellow), var(--ai-green), var(--ai-blue));
      background-origin: border-box;
      background-clip: padding-box, border-box;
      overflow: hidden;
    }

    .panel.visible {
      display: flex;
      animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Inspect Mode Panel Styles */
    .panel.inspect-mode {
      width: 520px;
    }

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding: 20px 20px;
      background: rgba(255, 255, 255, 0.02);
    }

    .kind {
      display: block;
      margin-bottom: 2px;
      color: var(--ai-blue);
      font: 800 10px/1 Inter, ui-sans-serif, system-ui, sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .label {
      display: block;
      color: var(--ai-text);
      font: 700 15px/1.3 Inter, ui-sans-serif, system-ui, sans-serif;
      word-break: break-word;
    }

    .close {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: #f1f5f9;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .close:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .content-area {
      padding: 20px;
      max-height: 400px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .answer {
      font: 15px/1.6 Inter, ui-sans-serif, system-ui, sans-serif;
      color: #e2e8f0;
      white-space: pre-wrap;
      line-height: 1.6;
    }

    /* Inspect Data Styles */
    .inspect-data {
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 12px;
      color: #cbd5e1;
    }

    .inspect-tag {
      color: #fbbf24;
      font-weight: 600;
    }

    .inspect-attr {
      display: block;
      margin: 4px 0;
      padding-left: 8px;
      border-left: 2px solid rgba(251, 191, 36, 0.3);
    }

    .inspect-style {
      color: #94a3b8;
      font-size: 11px;
    }

    .inspect-value {
      color: #cbd5e1;
      background: rgba(255, 255, 255, 0.05);
      padding: 2px 4px;
      border-radius: 3px;
    }

    .footer {
      padding: 16px 20px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(0, 0, 0, 0.2);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    textarea {
      box-sizing: border-box;
      width: 100%;
      resize: none;
      min-height: 90px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 14px;
      color: #ffffff;
      background: rgba(255, 255, 255, 0.03);
      font: 14px/1.5 Inter, ui-sans-serif, system-ui, sans-serif;
      transition: all 0.2s;
    }

    textarea:focus {
      border-color: var(--ai-blue);
      background: rgba(255, 255, 255, 0.06);
      outline: none;
      box-shadow: 0 0 0 4px rgba(66, 133, 244, 0.15);
    }

    .submit {
      background: #ffffff;
      color: #0f172a;
      border: none;
      border-radius: 10px;
      min-height: 44px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: transform 0.1s;
    }

    .submit:hover {
      transform: scale(0.98);
    }

    .submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error {
      color: #fb7185;
      font-size: 13px;
      padding: 12px;
      background: rgba(244, 63, 94, 0.1);
      border-radius: 8px;
      display: none;
      border: 1px solid rgba(244, 63, 94, 0.2);
    }

    .error.visible {
      display: block;
    }

    /* Vision Analysis Badge */
    .vision-badge {
      display: inline-block;
      padding: 4px 8px;
      background: linear-gradient(135deg, #0f9d58, #14b8a6);
      color: white;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }

    /* Region Suggestion */
    .region-suggestion {
      position: relative;
      padding: 12px;
      background: rgba(6, 78, 59, 0.3);
      border-radius: 8px;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .region-tag {
      font-size: 11px;
      color: #10b981;
      font-weight: 600;
      margin-bottom: 4px;
    }

    @media (max-width: 450px) {
      .panel {
        width: calc(100vw - 32px);
        left: 16px !important;
      }
    }
  `

  shadow.innerHTML = `
    <style>
      ${enhancedStyles}
    </style>
    <div class="custom-cursor">
      <svg viewBox="0 0 28 32" class="cursor-shape">
        <path d="M4,2 L4,26 L10,20 L15,30 L19,27 L14,18 L24,18 Z" stroke-linejoin="round" stroke-linecap="round" />
      </svg>
    </div>
    <div class="toast" role="status">
      <span class="pulse"></span>
      <span>AI mode active</span>
      <span class="count">shakes 0</span>
    </div>
    <div class="hover"></div>
    
    <section class="panel" aria-label="AI prompt">
      <header class="head">
        <div>
          <span class="kind"></span>
          <strong class="label"></strong>
        </div>
        <button class="close" type="button" aria-label="Close">×</button>
      </header>

      <div class="content-area">
        <div class="answer"></div>
        <p class="error"></p>
      </div>

      <footer class="footer">
        <form>
          <textarea placeholder="Ask anything about this selection... (Ctrl+I for inspect element)"></textarea>
          <button class="submit" type="submit">Ask AI</button>
        </form>
      </footer>
    </section>
  `

  const cursor = shadow.querySelector<HTMLElement>('.custom-cursor')
  const toast = shadow.querySelector<HTMLElement>('.toast')
  const count = shadow.querySelector<HTMLElement>('.count')
  const hover = shadow.querySelector<HTMLElement>('.hover')
  const panel = shadow.querySelector<HTMLElement>('.panel')
  const kind = shadow.querySelector<HTMLElement>('.kind')
  const label = shadow.querySelector<HTMLElement>('.label')
  const form = shadow.querySelector<HTMLFormElement>('form')
  const textarea = shadow.querySelector<HTMLTextAreaElement>('textarea')
  const submit = shadow.querySelector<HTMLButtonElement>('.submit')
  const close = shadow.querySelector<HTMLButtonElement>('.close')
  const error = shadow.querySelector<HTMLElement>('.error')
  const answer = shadow.querySelector<HTMLElement>('.answer')

  if (!cursor || !toast || !count || !hover || !panel || !kind || !label || !form || !textarea || !submit || !close || !error || !answer) {
    throw new Error('AIOverlay UI failed to initialize')
  }

  const onMouseMove = (e: MouseEvent) => {
    cursor.style.left = `${e.clientX}px`
    cursor.style.top = `${e.clientY}px`
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const question = textarea.value.trim()
    if (question) {
      options.onSubmit(question)
    }
  })

  close.addEventListener('click', () => {
    options.onCancel()
  })

  return {
    root: host,
    contains: (element) => element === host || host.contains(element),
    setActive: (active, shakeCount) => {
      toast.classList.toggle('active', active)
      cursor.classList.toggle('active', active)
      count.textContent = `shakes ${shakeCount}`
      
      if (active) {
        window.addEventListener('mousemove', onMouseMove)
      } else {
        window.removeEventListener('mousemove', onMouseMove)
      }
    },
    setHoverRect: (rect) => {
      if (!rect) {
        hover.style.display = 'none'
        return
      }

      hover.style.display = 'block'
      hover.style.left = `${rect.left}px`
      hover.style.top = `${rect.top}px`
      hover.style.width = `${rect.width}px`
      hover.style.height = `${rect.height}px`
    },
    showPrompt: (selection) => {
      kind.textContent = selection.kind
      label.textContent = selection.label

      textarea.value = ''
      submit.disabled = false
      submit.textContent = 'Ask AI'
      error.classList.remove('visible')
      answer.textContent = ''
      
      // Smart Absolute Positioning relative to selection
      const left = clamp(selection.rect.left + selection.rect.width / 2 - 190, 16, window.innerWidth - 396)
      const top = selection.rect.bottom + window.scrollY + 12
      
      panel.style.left = `${left}px`
      panel.style.top = `${top}px`
      panel.classList.add('visible')
      
      // Add vision badge if image selection with vision model
      if (selection.kind === 'image' && selection.mimeType) {
        const kindEl = kind as HTMLElement
        const existingBadge = kindEl.querySelector('.vision-badge')
        if (!existingBadge) {
          const badge = document.createElement('span')
          badge.className = 'vision-badge'
          badge.textContent = 'Vision Enabled'
          kindEl.insertBefore(badge, kindEl.firstChild)
        }
      }
      
      textarea.focus()
    },
    setThinking: (thinking) => {
      submit.disabled = thinking
      submit.textContent = thinking ? 'Analyzing...' : 'Ask AI'
    },
    setAnswer: (value) => {
      answer.textContent = value
    },
    setError: (value) => {
      error.textContent = value
      error.classList.toggle('visible', Boolean(value))
    },
    clearSelection: () => {
      panel.classList.remove('visible')
      error.classList.remove('visible')
      answer.textContent = ''
      textarea.value = ''
      // Remove vision badge on clear
      const kindEl = kind as HTMLElement
      const existingBadge = kindEl.querySelector('.vision-badge')
      if (existingBadge) {
        existingBadge.remove()
      }
    },
    destroy: () => {
      globalStyle.remove()
      host.remove()
      window.removeEventListener('mousemove', onMouseMove)
    },
    setInspectMode: (active, element) => {
      if (active) {
        document.body.classList.add('ai-inspect-mode')
        host.classList.add('inspect-active')
        
        // Update panel for inspect mode
        if (element && panel) {
          panel.classList.remove('visible')
          panel.classList.add('inspect-mode')
          showInspectInfo(panel, element as HTMLElement)
        }
      } else {
        document.body.classList.remove('ai-inspect-mode')
        host.classList.remove('inspect-active')
        clearInspectInfo(panel)
        if (panel) {
          panel.classList.add('visible')
          panel.classList.remove('inspect-mode')
          textarea.focus()
        }
      }
    },
  }
}

/**
 * Show inspect mode element information in the panel
 */
function showInspectInfo(container: HTMLElement, element: HTMLElement) {
  const infoContent = document.createElement('div')
  infoContent.className = 'inspect-data'
  
  // Element tag
  const tagLabel = document.createElement('div')
  tagLabel.innerHTML = `<span class="inspect-tag">&lt;${element.tagName}&gt;</span> ${getElementDescription(element)}`
  infoContent.appendChild(tagLabel)

  // Class names
  if (element.className) {
    const cls = element.className.split(' ').filter(Boolean).slice(0, 3).join(', ')
    const clsLabel = document.createElement('div')
    clsLabel.textContent = `Classes: ${cls}`
    infoContent.appendChild(clsLabel)
  }

  // ID if present
  if (element.id) {
    const idLabel = document.createElement('div')
    idLabel.innerHTML = `<span class="inspect-attr">ID:</span> <code class="inspect-value">${escapeHtml(element.id)}</code>`
    infoContent.appendChild(idLabel)
  }

  // Selected state
  if (element.classList.contains('selected')) {
    const selLabel = document.createElement('div')
    selLabel.innerHTML = `<span class="inspect-attr">Status:</span> <strong style="color:#10b981">● Selected</strong>`
    infoContent.appendChild(selLabel)
  }

  // Computed styles (show a few interesting ones)
  const computedStyles: Record<string, string> = {};
  ['display', 'position', 'width', 'height', 'margin', 'padding', 'font-size', 'color'].forEach(prop => {
    const value = getComputedStyle(element).getPropertyValue(prop)
    if (value && !computedStyles[prop]) {
      computedStyles[prop] = value
    }
  })

  if (Object.keys(computedStyles).length > 0) {
    const styleLabel = document.createElement('div')
    styleLabel.innerHTML = '<strong>Computed Styles:</strong>'
    infoContent.appendChild(styleLabel)
    
    Object.entries(computedStyles).slice(0, 5).forEach(([prop, value]) => {
      const styleAttr = document.createElement('div')
      styleAttr.className = 'inspect-style'
      styleAttr.innerHTML = `<span class="inspect-attr">${escapeHtml(prop)}:</span> <code class="inspect-value">${escapeHtml(value)}</code>`
      infoContent.appendChild(styleAttr)
    })
  }

  // Attributes
  const attrs: Record<string, string> = {}
  element.getAttributeNames()?.forEach(name => {
    const value = element.getAttribute(name)
    if (value && !attrs[name]) {
      attrs[name] = value
    }
  })

  if (Object.keys(attrs).length > 0) {
    const attrLabel = document.createElement('div')
    attrLabel.innerHTML = '<strong>Attributes:</strong>'
    infoContent.appendChild(attrLabel)
    
    Object.entries(attrs).slice(0, 5).forEach(([name, value]) => {
      const attrItem = document.createElement('div')
      attrItem.className = 'inspect-attr'
      attrItem.innerHTML = `<span class="inspect-attr">${escapeHtml(name)}:</span> <code class="inspect-value">${escapeHtml(value)}</code>`
      infoContent.appendChild(attrItem)
    })
  }

  // Make container scrollable if needed
  const contentArea = container.querySelector('.content-area') as HTMLElement
  if (contentArea) {
    contentArea.appendChild(infoContent)
  }
}

/**
 * Clear inspect mode information
 */
function clearInspectInfo(container: HTMLElement | null) {
  if (!container) return
  
  // Remove inspect data section and revert back
  const existingInfo = container.querySelector('.inspect-data') as HTMLElement
  if (existingInfo) {
    existingInfo.remove()
  }
}

/**
 * Get human-readable element description
 */
function getElementDescription(element: HTMLElement): string {
  const ariaLabel = element.getAttribute('aria-label')?.slice(0, 50)
  const title = element.getAttribute('title')?.slice(0, 40)
  
  const parts = [ariaLabel, title]
  const text = (element.innerText || '').slice(0, 80).trim()
  if (text && !parts.some(p => p)) {
    parts.push(text)
  }
  
  return parts.find(Boolean) || ''
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
