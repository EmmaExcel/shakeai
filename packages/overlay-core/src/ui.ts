import type { AIOverlaySelection, AIOverlayThemeConfig } from './types'
import { clamp } from './utils'

type OverlayUIOptions = {
  theme: Required<AIOverlayThemeConfig>
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
}

export function createOverlayUI(options: OverlayUIOptions): OverlayUI {
  const host = document.createElement('div')
  host.dataset.aiOverlayRoot = 'true'
  const globalStyle = document.createElement('style')
  globalStyle.dataset.aiOverlayStyle = 'true'
  globalStyle.textContent = 'body.ai-overlay-active { cursor: crosshair; }'
  const shadow = host.attachShadow({ mode: 'open' })
  document.head.append(globalStyle)
  document.body.append(host)

  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        --ai-primary: ${options.theme.primaryColor};
        --ai-panel: ${options.theme.panelBackground};
        --ai-text: ${options.theme.textColor};
        --ai-radius: ${options.theme.borderRadius}px;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .toast {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 2147483645;
        display: none;
        align-items: center;
        gap: 10px;
        border: 1px solid color-mix(in srgb, var(--ai-primary), transparent 74%);
        border-radius: var(--ai-radius);
        background: var(--ai-panel);
        color: var(--ai-text);
        padding: 10px 12px;
        font: 700 13px/1 Inter, ui-sans-serif, system-ui, sans-serif;
        box-shadow: 0 16px 42px rgba(15, 23, 42, 0.18);
      }

      .toast.active {
        display: flex;
      }

      .pulse {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--ai-primary);
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--ai-primary), transparent 38%);
        animation: pulse-ring 1.3s infinite;
      }

      .count {
        border-left: 1px solid rgba(15, 23, 42, 0.12);
        padding-left: 10px;
        opacity: 0.72;
      }

      .hover {
        position: fixed;
        z-index: 2147483644;
        pointer-events: none;
        display: none;
        border: 2px solid var(--ai-primary);
        border-radius: var(--ai-radius);
        box-shadow:
          0 0 0 4px color-mix(in srgb, var(--ai-primary), transparent 88%),
          0 20px 52px rgba(15, 23, 42, 0.14);
      }

      .panel {
        position: fixed;
        z-index: 2147483646;
        width: 380px;
        display: none;
        border: 1px solid rgba(17, 24, 39, 0.14);
        border-radius: var(--ai-radius);
        background: var(--ai-panel);
        color: var(--ai-text);
        text-align: left;
        box-shadow: 0 26px 70px rgba(15, 23, 42, 0.22);
        overflow: hidden;
      }

      .panel.visible {
        display: block;
      }

      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        border-bottom: 1px solid rgba(17, 24, 39, 0.08);
        padding: 14px 14px 12px;
      }

      .kind {
        display: block;
        margin-bottom: 4px;
        color: var(--ai-primary);
        font: 800 11px/1 Inter, ui-sans-serif, system-ui, sans-serif;
        text-transform: uppercase;
      }

      .label {
        display: block;
        color: var(--ai-text);
        font: 700 14px/1.25 Inter, ui-sans-serif, system-ui, sans-serif;
      }

      button {
        border: 1px solid rgba(17, 24, 39, 0.12);
        border-radius: var(--ai-radius);
        min-height: 40px;
        background: #111827;
        color: #ffffff;
        font: 700 14px/1 Inter, ui-sans-serif, system-ui, sans-serif;
        cursor: pointer;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.56;
      }

      .close {
        min-width: 34px;
        min-height: 34px;
        padding: 0;
        background: #f3f4f6;
        color: #111827;
      }

      form {
        display: grid;
        gap: 10px;
        padding: 14px;
      }

      textarea {
        box-sizing: border-box;
        width: 100%;
        resize: vertical;
        min-height: 86px;
        max-height: 180px;
        border: 1px solid rgba(17, 24, 39, 0.16);
        border-radius: var(--ai-radius);
        padding: 12px;
        color: #111827;
        background: #ffffff;
        font: 15px/1.45 Inter, ui-sans-serif, system-ui, sans-serif;
      }

      textarea:focus {
        border-color: var(--ai-primary);
        outline: 3px solid color-mix(in srgb, var(--ai-primary), transparent 86%);
      }

      .error,
      .answer {
        display: none;
        margin: 0 14px 14px;
        border-radius: var(--ai-radius);
        padding: 12px;
        font: 14px/1.45 Inter, ui-sans-serif, system-ui, sans-serif;
        white-space: pre-wrap;
      }

      .error.visible,
      .answer.visible {
        display: block;
      }

      .error {
        background: #fef2f2;
        color: #991b1b;
      }

      .answer {
        max-height: 220px;
        overflow: auto;
        background: #f8fafc;
        color: #111827;
      }

      @media (max-width: 760px) {
        .panel {
          left: 12px !important;
          right: 12px;
          top: auto !important;
          bottom: 12px;
          width: auto;
        }
      }

      @keyframes pulse-ring {
        70% { box-shadow: 0 0 0 8px transparent; }
        100% { box-shadow: 0 0 0 0 transparent; }
      }
    </style>
    <div class="toast" role="status">
      <span class="pulse"></span>
      <span>AI mode active</span>
      <span class="count">shakes 0</span>
    </div>
    <div class="hover"></div>
    <section class="panel" aria-label="AI prompt">
      <div class="head">
        <div>
          <span class="kind"></span>
          <strong class="label"></strong>
        </div>
        <button class="close" type="button" aria-label="Close AI prompt">x</button>
      </div>
      <form>
        <textarea placeholder="Ask what to do with this selection..."></textarea>
        <button class="submit" type="submit">Ask AI</button>
      </form>
      <p class="error"></p>
      <div class="answer"></div>
    </section>
  `

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

  if (!toast || !count || !hover || !panel || !kind || !label || !form || !textarea || !submit || !close || !error || !answer) {
    throw new Error('AIOverlay UI failed to initialize')
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
      count.textContent = `shakes ${shakeCount}`
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
      const left = clamp(selection.rect.left + selection.rect.width / 2 - 190, 16, window.innerWidth - 396)
      const top = clamp(selection.rect.bottom + 14, 16, window.innerHeight - 380)
      kind.textContent = selection.kind
      label.textContent = selection.label
      textarea.value = ''
      submit.disabled = false
      submit.textContent = 'Ask AI'
      error.classList.remove('visible')
      answer.classList.remove('visible')
      panel.style.left = `${left}px`
      panel.style.top = `${top}px`
      panel.classList.add('visible')
      textarea.focus()
    },
    setThinking: (thinking) => {
      submit.disabled = thinking
      submit.textContent = thinking ? 'Thinking...' : 'Ask AI'
    },
    setAnswer: (value) => {
      answer.textContent = value
      answer.classList.toggle('visible', Boolean(value))
    },
    setError: (value) => {
      error.textContent = value
      error.classList.toggle('visible', Boolean(value))
    },
    clearSelection: () => {
      panel.classList.remove('visible')
      error.classList.remove('visible')
      answer.classList.remove('visible')
      textarea.value = ''
    },
    destroy: () => {
      globalStyle.remove()
      host.remove()
    },
  }
}
