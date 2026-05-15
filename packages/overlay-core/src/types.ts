export type AIOverlaySelectionKind = 'text' | 'image' | 'element'

export type AIOverlaySelection = {
  kind: AIOverlaySelectionKind
  label: string
  content: string
  rect: DOMRect
  url: string
  title: string
}

export type AIOverlayAskPayload = {
  question: string
  selection: AIOverlaySelection
}

export type AIOverlayModelConfig = {
  provider?: 'ollama' | 'custom'
  endpoint?: string
  model?: string
  headers?: Record<string, string>
}

export type AIOverlayThemeConfig = {
  primaryColor?: string
  panelBackground?: string
  textColor?: string
  borderRadius?: number
}

export type AIOverlayTriggerConfig = {
  shake?: boolean
  keyboardShortcut?: string
}

export type AIOverlaySelectionConfig = {
  text?: boolean
  images?: boolean
  elements?: boolean
  blockedSelectors?: string[]
  allowedSelectors?: string[]
}

export type AIOverlayConfig = {
  siteKey?: string
  apiBaseUrl?: string
  model?: AIOverlayModelConfig
  trigger?: AIOverlayTriggerConfig
  selection?: AIOverlaySelectionConfig
  theme?: AIOverlayThemeConfig
  analytics?: {
    enabled?: boolean
  }
  onActivate?: () => void
  onDeactivate?: () => void
  onSelection?: (selection: AIOverlaySelection) => void
  onAsk?: (payload: AIOverlayAskPayload) => void
  onResponse?: (response: string, payload: AIOverlayAskPayload) => void
  onError?: (error: Error) => void
}

export type AIOverlayInstance = {
  activate: () => void
  deactivate: () => void
  destroy: () => void
  isActive: () => boolean
}
