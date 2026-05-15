import { createSelectionController } from './selection'
import { createShakeDetector } from './shake'
import { askHostedApi, askModel } from './transport'
import type {
  AIOverlayConfig,
  AIOverlayInstance,
  AIOverlaySelection,
  AIOverlaySelectionConfig,
  AIOverlayThemeConfig,
  AIOverlayTriggerConfig,
} from './types'
import { createOverlayUI } from './ui'
import { isMacLike } from './utils'

export type {
  AIOverlayAskPayload,
  AIOverlayConfig,
  AIOverlayInstance,
  AIOverlayModelConfig,
  AIOverlaySelection,
  AIOverlaySelectionConfig,
  AIOverlaySelectionKind,
  AIOverlayThemeConfig,
  AIOverlayTriggerConfig,
} from './types'

const defaultTheme: Required<AIOverlayThemeConfig> = {
  primaryColor: '#14b8a6',
  panelBackground: 'rgba(255, 255, 255, 0.96)',
  textColor: '#111827',
  borderRadius: 8,
}

const defaultTrigger: Required<AIOverlayTriggerConfig> = {
  shake: true,
  keyboardShortcut: 'mod+k',
}

const defaultSelection: Required<AIOverlaySelectionConfig> = {
  text: true,
  images: true,
  elements: true,
  blockedSelectors: ['input[type="password"]', '[data-ai-private]', '[data-ai-overlay-ignore]'],
  allowedSelectors: [],
}

class AIOverlayController implements AIOverlayInstance {
  private active = false
  private shakeCount = 0
  private selection: AIOverlaySelection | null = null
  private disposers: Array<() => void> = []
  private ui: ReturnType<typeof createOverlayUI>
  private config: AIOverlayConfig
  private trigger: Required<AIOverlayTriggerConfig>

  constructor(config: AIOverlayConfig) {
    this.config = config
    this.trigger = { ...defaultTrigger, ...config.trigger }
    const selectionConfig = { ...defaultSelection, ...config.selection }

    this.ui = createOverlayUI({
      theme: { ...defaultTheme, ...config.theme },
      onSubmit: (question) => {
        void this.ask(question)
      },
      onCancel: () => {
        this.clearSelection()
      },
    })

    if (this.trigger.shake) {
      this.disposers.push(
        createShakeDetector({
          onShake: () => {
            this.shakeCount += 1
            this.activate()
          },
        }),
      )
    }

    this.disposers.push(
      createSelectionController({
        config: selectionConfig,
        isActive: () => this.active,
        isOverlayElement: (element) => this.ui.contains(element),
        onHover: (rect) => {
          this.ui.setHoverRect(this.selection ? null : rect)
        },
        onSelection: (selection) => {
          this.selection = selection
          this.ui.setHoverRect(null)
          this.ui.showPrompt(selection)
          this.config.onSelection?.(selection)
        },
      }),
    )

    this.disposers.push(this.bindKeyboardShortcut())
  }

  activate() {
    if (this.active) {
      this.ui.setActive(true, this.shakeCount)
      return
    }

    this.active = true
    document.body.classList.add('ai-overlay-active')
    this.ui.setActive(true, this.shakeCount)
    this.config.onActivate?.()
  }

  deactivate() {
    if (!this.active) {
      return
    }

    this.active = false
    this.clearSelection()
    this.ui.setHoverRect(null)
    this.ui.setActive(false, this.shakeCount)
    document.body.classList.remove('ai-overlay-active')
    this.config.onDeactivate?.()
  }

  destroy() {
    for (const dispose of this.disposers) {
      dispose()
    }
    this.disposers = []
    this.deactivate()
    this.ui.destroy()
  }

  isActive() {
    return this.active
  }

  private clearSelection() {
    this.selection = null
    this.ui.clearSelection()
    window.getSelection()?.removeAllRanges()
  }

  private async ask(question: string) {
    if (!this.selection) {
      return
    }

    const payload = {
      question,
      selection: this.selection,
    }

    this.config.onAsk?.(payload)
    this.ui.setThinking(true)
    this.ui.setAnswer('')
    this.ui.setError('')

    try {
      const response = this.config.siteKey
        ? await askHostedApi({
            apiBaseUrl: this.config.apiBaseUrl,
            siteKey: this.config.siteKey,
            payload,
          })
        : await askModel(this.config.model ?? {}, payload)
      this.ui.setAnswer(response)
      this.config.onResponse?.(response, payload)
    } catch (caughtError) {
      const error = caughtError instanceof Error ? caughtError : new Error('Unknown AIOverlay error')
      this.ui.setError(error.message)
      this.config.onError?.(error)
    } finally {
      this.ui.setThinking(false)
    }
  }

  private bindKeyboardShortcut() {
    const shortcut = this.trigger.keyboardShortcut.toLowerCase()

    const onKeyDown = (event: KeyboardEvent) => {
      const expectedMod = shortcut.includes('mod+')
      const key = shortcut.split('+').at(-1)
      const modPressed = isMacLike() ? event.metaKey : event.ctrlKey

      if (expectedMod && !modPressed) {
        return
      }

      if (key && event.key.toLowerCase() === key) {
        event.preventDefault()
        if (this.active) {
          this.deactivate()
        } else {
          this.activate()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }
}

export const AIOverlay = {
  init(config: AIOverlayConfig = {}) {
    return new AIOverlayController(config)
  },
}

declare global {
  interface Window {
    AIOverlay?: typeof AIOverlay
  }
}

if (typeof window !== 'undefined') {
  window.AIOverlay = AIOverlay
}
