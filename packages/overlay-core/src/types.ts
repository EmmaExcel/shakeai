// ==================== Selection Types ====================

export type AIOverlaySelectionKind = 'text' | 'image' | 'element' | 'file'
export type SelectionKind = AIOverlaySelectionKind

export interface AIOverlaySelection {
  kind: AIOverlaySelectionKind
  label: string
  url: string
  rect: DOMRect
  content?: string
  title?: string
  mimeType?: string
  data?: string // Base64 encoded image data
  width?: number
  height?: number
  alt?: string
  source?: string
  // Edit mode: reference to the original DOM element
  element?: HTMLElement
  // Edit mode: computed styles snapshot for context
  computedStyles?: Record<string, string>
  // Edit mode: generated unique CSS selector for this element
  cssSelector?: string
}
export type SelectionData = AIOverlaySelection

// ==================== Edit Types ====================

export interface AIOverlayEditResult {
  selector: string
  css: Record<string, string>
  description: string
}

// ==================== Event Callbacks ====================

export interface OnActivateOptions {
  shakeCount?: number
  duration?: number
  triggerSource?: 'shake' | 'keyboard' | 'gesture'
}

export type OnActivate = (options: OnActivateOptions) => void

export interface SelectionEventPayload {
  kind: AIOverlaySelectionKind
  label: string
  content?: string
  url: string
  title?: string
  mimeType?: string
  data?: string
  width?: number
  height?: number
  alt?: string
  source?: string
}

export type OnSelection = (selection: SelectionEventPayload) => void

export interface AIOverlayAskPayload {
  question: string
  selection: AIOverlaySelection
  sessionId?: string
  imageData?: string
  imageMimeType?: string
}

export type OnAsk = ({ question, selection }: AIOverlayAskPayload) => void

export interface ResponsePayload {
  answer: string
  sessionId?: string
  timestamp: number
}

export type OnResponse = (response: ResponsePayload) => void

export interface ErrorPayload {
  message: string
  code?: string
  stack?: string
}

export type OnError = (error: ErrorPayload) => void

// ==================== Theme Configuration ====================

export interface AIOverlayThemeConfig {
  primaryColor?: string
  panelBackground?: string
  textColor?: string
  borderRadius?: number
  fontFamily?: string[]
  fontSize?: {
    small: number
    medium: number
    large: number
  }
  accentColor?: string
  borderColor?: string
  backgroundColor?: string
}
export type ThemeConfig = AIOverlayThemeConfig

// ==================== Site Configuration ====================

export interface AIOverlayModelConfig {
  provider?: 'ollama' | 'openrouter' | 'gemini' | 'custom'
  endpoint?: string
  model?: string
  headers?: Record<string, string>
  timeout?: number
  temperature?: number
  maxTokens?: number
  visionEnabled?: boolean
  visionModel?: string
  suggestRegions?: boolean
  screenshotCapture?: {
    enabled: boolean
    maxDimensions: { width: number; height: number }
    quality?: number // 0-1 for JPEG quality
  }
}
export type ModelConfig = AIOverlayModelConfig

export interface VisionModelConfig extends AIOverlayModelConfig {
  /** Vision-enabled model for image analysis */
  visionEnabled: boolean
  /** Vision-specific model name (e.g., 'gpt-4o', 'claude-3-opus-20240229', 'llava') */
  visionModel?: string
  /** Whether to enable bounding box region suggestions */
  suggestRegions?: boolean
  /** Screenshot capture settings */
  screenshotCapture?: {
    enabled: boolean
    maxDimensions: { width: number; height: number }
    quality?: number // 0-1 for JPEG quality
  }
}

export interface RagConfig {
  enabled: boolean
  topK: number
  indexPath: string
  embeddingModel?: string
}

export interface SiteConfig {
  siteId: string
  name: string
  allowedOrigins: string[]
  model: AIOverlayModelConfig
  rag?: RagConfig & { enabled: boolean }
  metadata?: Record<string, any>
}

// ==================== Admin API Types ====================

export interface QueryLogEntry {
  siteId: string
  question: string
  pageUrl: string
  selectionKind: AIOverlaySelectionKind
  retrievedChunkIds: string[]
  responseTimeMs?: number
  error?: string
  at: string
}

// ==================== Analytics Types ====================

export interface ElementInspectionData {
  tagName: string
  className?: string[]
  id?: string
  computedStyle?: Record<string, string>
  attributes?: Record<string, string>
  isEditable?: boolean
}

export interface InspectElementResult {
  element: Element | null
  inspectionData: ElementInspectionData | null
  suggestedChanges?: Array<{
    type: 'style' | 'attribute' | 'content'
    selector: string
    currentValue?: string
    proposedValue: string
    explanation: string
  }>
}

export type AIOverlayInspectElementResult = InspectElementResult

export type OnInspectElement = (result: AIOverlayInspectElementResult) => void

export type OnEditComplete = (element: Element, action: string) => void

export interface EventLog {
  eventType: 'activation' | 'selection' | 'ask' | 'response' | 'error' | 'inspect' | 'edit'
  timestamp: number
  details: Record<string, any>
}

// ==================== SDK Top Level Types ====================

export interface AIOverlayTriggerConfig {
  shake?: boolean
  keyboardShortcut: string
}

export interface AIOverlaySelectionConfig {
  text?: boolean
  images?: boolean
  elements?: boolean
  blockedSelectors?: string[]
  allowedSelectors?: string[]
}

export interface AIOverlayConfig {
  siteKey?: string
  apiBaseUrl?: string
  model?: AIOverlayModelConfig
  trigger?: AIOverlayTriggerConfig
  selection?: AIOverlaySelectionConfig
  theme?: AIOverlayThemeConfig
  /** Enable AI Edit Mode — lets users ask the AI to apply live CSS changes to elements */
  editEnabled?: boolean
  analytics?: {
    enabled?: boolean
  }
  onActivate?: () => void
  onDeactivate?: () => void
  onSelection?: (selection: AIOverlaySelection) => void
  onAsk?: (payload: AIOverlayAskPayload) => void
  onResponse?: (response: string, payload: AIOverlayAskPayload) => void
  onError?: (error: Error) => void
  onInspect?: (result: AIOverlayInspectElementResult) => void
  onEdit?: (result: AIOverlayEditResult) => void
}

export interface AIOverlayInstance {
  activate(): void
  deactivate(): void
  destroy(): void
  isActive(): boolean
  getInspectMode(): boolean
  toggleInspectMode(): void
}

export type AIOverlayInspectElement = (target: Element) => Promise<AIOverlayInspectElementResult | null>
