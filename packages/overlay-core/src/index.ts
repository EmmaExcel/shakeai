import { createSelectionController } from './selection'
import { createShakeDetector } from './shake'
import { askHostedApi, askModel, askVision, askEdit } from './transport'
import { buildUniqueSelector, collectElementContext, applyEdit, undoEdit, canUndo, exportGeneratedCSS } from './editor'
import type {
  AIOverlayConfig,
  AIOverlayInspectElementResult,
  AIOverlayInstance,
  AIOverlaySelection,
  AIOverlaySelectionConfig,
  AIOverlayThemeConfig,
  AIOverlayTriggerConfig,
} from './types'
import { createOverlayUI } from './ui'
import { isMacLike } from './utils'
import { ElementInspector } from './inspector'

export type {
  AIOverlayAskPayload,
  AIOverlayConfig,
  AIOverlayInspectElementResult,
  AIOverlayInstance,
  AIOverlayModelConfig,
  AIOverlaySelection,
  AIOverlaySelectionConfig,
  AIOverlaySelectionKind,
  AIOverlayThemeConfig,
  AIOverlayTriggerConfig,
  ElementInspectionData,
  InspectElementResult,
  VisionModelConfig,
} from './types'
export { ElementInspector }

const defaultTheme: AIOverlayThemeConfig = {
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
  private inspectMode = false
  private disposers: Array<() => void> = []
  private ui: ReturnType<typeof createOverlayUI>
  private config: AIOverlayConfig
  private trigger: Required<AIOverlayTriggerConfig>

  constructor(config: AIOverlayConfig) {
    this.config = config
    this.trigger = { ...defaultTrigger, ...config.trigger }
    const selectionConfig = { ...defaultSelection, ...config.selection }

    this.ui = createOverlayUI({
      theme: { ...defaultTheme, ...config.theme } as any,
      editEnabled: config.editEnabled ?? false,
      onSubmit: (question, inEditMode) => {
        if (inEditMode) {
          void this.applyAIEdit(question)
        } else {
          void this.ask(question)
        }
      },
      onCancel: () => {
        this.clearSelection()
        if (!this.inspectMode) {
          return
        }

        this.deactivateInspectMode()
      },
      onUndo: () => {
        const msg = undoEdit()
        if (msg) this.ui.setAnswer(msg)
      },
      onCopyCSS: () => {
        const css = exportGeneratedCSS()
        navigator.clipboard.writeText(css).then(() => {
          this.ui.setAnswer('CSS copied to clipboard!')
        })
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
          
          if (selection.kind === 'image' && config.model?.visionEnabled) {
          }
          
          this.ui.showPrompt(selection)
          this.config.onSelection?.(selection)
        },
      }),
    )

    this.disposers.push(this.bindKeyboardShortcut())
    
    const inspectShortcut = 'i'
    document.addEventListener('keydown', (event) => {
      if (!this.active || event.key !== inspectShortcut) return
      this.toggleInspectMode()
    })
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

  getInspectMode() {
    return this.inspectMode
  }

  toggleInspectMode() {
    this.inspectMode = !this.inspectMode
    if (this.inspectMode) {
      document.body.classList.add('ai-inspect-mode')
      this.config.onInspect?.({ element: null, inspectionData: null })
    } else {
      document.body.classList.remove('ai-inspect-mode')
      this.deactivateInspectMode()
    }
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
      let response: string

      if (this.selection.kind === 'image' && this.config.model?.visionEnabled) {
        response = await askVision(this.config.model ?? {}, payload)
      } else if (this.config.siteKey) {
        response = await askHostedApi({
          apiBaseUrl: this.config.apiBaseUrl,
          siteKey: this.config.siteKey,
          payload,
        })
      } else {
        response = await askModel(this.config.model ?? {}, payload)
      }

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

  private async applyAIEdit(request: string) {
    if (!this.selection) return

    const el = this.selection.element
    if (!el) {
      this.ui.setError('No element selected for editing.')
      return
    }

    this.ui.setThinking(true)
    this.ui.setAnswer('')
    this.ui.setError('')

    try {
      const selector = this.selection.cssSelector ?? buildUniqueSelector(el)
      const computedStyles = this.selection.computedStyles ?? collectElementContext(el)

      const editResult = await askEdit(
        this.config.model ?? {},
        {
          selector,
          tagName: el.tagName.toLowerCase(),
          classes: el.className || '',
          computedStyles,
          innerTextSnippet: (el.innerText ?? '').slice(0, 200),
        },
        request
      )

      applyEdit(editResult)
      this.ui.setAnswer(`✅ ${editResult.description}`)
      this.ui.showEditControls(canUndo())
      this.config.onEdit?.(editResult)
    } catch (caughtError) {
      const error = caughtError instanceof Error ? caughtError : new Error('Edit failed')
      this.ui.setError(error.message)
      this.config.onError?.(error)
    } finally {
      this.ui.setThinking(false)
    }
  }

  async inspectElement(target: Element): Promise<AIOverlayInspectElementResult | null> {
    try {

      const inspectionData = {
        tagName: target.tagName.toLowerCase(),
        className: target.className?.split(' ').filter(Boolean),
        id: target.id || undefined,
        computedStyle: ElementInspector.getComputedStyles(target as HTMLElement),
        attributes: ElementInspector.getAttributes(target as HTMLElement),
        isEditable: (target as HTMLElement).isContentEditable || ['INPUT', 'TEXTAREA'].includes(target.tagName),
      }

      const result = { element: target, inspectionData }

      this.config.onInspect?.(result)
      
      setTimeout(() => {
        if (!this.active) return
        this.deactivateInspectMode()
      }, 10000)

      return result
    } catch (error) {
      console.warn('Inspection failed:', error)
      return null
    }
  }

  private deactivateInspectMode() {
    this.inspectMode = false
    document.body.classList.remove('ai-inspect-mode')
    this.config.onDeactivate?.()
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
  
  async inspectAt(event: MouseEvent): Promise<AIOverlayInspectElementResult | null> {
    const target = document.elementFromPoint(event.clientX, event.clientY)
    if (!target || !document.contains(target)) return null
    
    const controller = new AIOverlayController({ model: {} })
    return controller.inspectElement(target)
  },
  
  inspector: ElementInspector,
}

declare global {
  interface Window {
    AIOverlay?: typeof AIOverlay
  }
}

if (typeof window !== 'undefined') {
  window.AIOverlay = AIOverlay
}

const inspectStyle = document.createElement('style')
inspectStyle.textContent = `
  body.ai-inspect-mode * {
    cursor: crosshair !important;
  }
  
  .ai-inspect-highlight {
    outline: 3px solid #fbbf24 !important;
    outline-offset: -3px;
    border-radius: 4px;
  }
`
document.head.append(inspectStyle)
