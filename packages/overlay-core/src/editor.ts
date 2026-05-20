import type { AIOverlayEditResult } from './types'

// The key CSS properties we send as context to the AI
const CONTEXT_STYLE_PROPS = [
  'color', 'background-color', 'background', 'font-size', 'font-weight',
  'font-family', 'line-height', 'letter-spacing', 'text-align',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'border', 'border-radius', 'width', 'height', 'max-width', 'min-height',
  'display', 'flex-direction', 'align-items', 'justify-content', 'gap',
  'opacity', 'transform', 'box-shadow', 'text-shadow',
]

const STYLE_TAG_ID = 'shakecursor-edits'

// ── History Stack ─────────────────────────────────────────────────────────────

type HistoryEntry = {
  selector: string
  previousCSS: string   // the full rule block before this edit
  nextCSS: string       // the full rule block after this edit
  description: string
}

const history: HistoryEntry[] = []
let historyIndex = -1

// ── Style Tag Management ──────────────────────────────────────────────────────

function getOrCreateStyleTag(): HTMLStyleElement {
  let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null
  if (!tag) {
    tag = document.createElement('style')
    tag.id = STYLE_TAG_ID
    tag.setAttribute('data-shakecursor', 'true')
    document.head.appendChild(tag)
  }
  return tag
}

function getCurrentRuleForSelector(selector: string): string {
  const tag = document.getElementById(STYLE_TAG_ID)
  if (!tag) return ''
  const sheet = (tag as HTMLStyleElement).sheet
  if (!sheet) return ''
  for (let i = 0; i < sheet.cssRules.length; i++) {
    const rule = sheet.cssRules[i] as CSSStyleRule
    if (rule.selectorText === selector) {
      return rule.cssText
    }
  }
  return ''
}

function writeRule(selector: string, css: Record<string, string>) {
  const tag = getOrCreateStyleTag()
  const sheet = tag.sheet!

  // Remove any existing rule for this selector
  for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
    const rule = sheet.cssRules[i] as CSSStyleRule
    if (rule.selectorText === selector) {
      sheet.deleteRule(i)
    }
  }

  if (Object.keys(css).length === 0) return

  const declarations = Object.entries(css)
    .map(([prop, val]) => `${prop}: ${val} !important`)
    .join('; ')

  sheet.insertRule(`${selector} { ${declarations} }`, sheet.cssRules.length)
}

// ── Unique CSS Selector Builder ───────────────────────────────────────────────

export function buildUniqueSelector(el: HTMLElement): string {
  // ID is the most specific — use it directly if available
  if (el.id) return `#${CSS.escape(el.id)}`

  const parts: string[] = []
  let current: HTMLElement | null = el

  while (current && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase()

    if (current.id) {
      parts.unshift(`#${CSS.escape(current.id)}`)
      break
    }

    if (current.className) {
      const classes = Array.from(current.classList)
        .filter(c => !c.startsWith('ai-') && c.length > 0)
        .slice(0, 2)
        .map(c => `.${CSS.escape(c)}`)
        .join('')
      selector += classes
    }

    // Add nth-child if there are siblings with the same tag
    const parent = current.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        s => s.tagName === current!.tagName
      )
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1
        selector += `:nth-child(${idx})`
      }
    }

    parts.unshift(selector)
    current = current.parentElement
  }

  return parts.join(' > ')
}

// ── Element Style Context ─────────────────────────────────────────────────────

export function collectElementContext(el: HTMLElement): Record<string, string> {
  const computed = window.getComputedStyle(el)
  const result: Record<string, string> = {}
  for (const prop of CONTEXT_STYLE_PROPS) {
    const value = computed.getPropertyValue(prop)
    if (value) result[prop] = value
  }
  return result
}

// ── Apply Edit ────────────────────────────────────────────────────────────────

export function applyEdit(result: AIOverlayEditResult) {
  const prevRule = getCurrentRuleForSelector(result.selector)

  writeRule(result.selector, result.css)

  const nextRule = getCurrentRuleForSelector(result.selector)

  // Trim history forward if we're mid-stack
  history.splice(historyIndex + 1)

  history.push({
    selector: result.selector,
    previousCSS: prevRule,
    nextCSS: nextRule,
    description: result.description,
  })
  historyIndex = history.length - 1
}

// ── Undo / Redo ───────────────────────────────────────────────────────────────

export function undoEdit(): string | null {
  if (historyIndex < 0) return null

  const entry = history[historyIndex]
  historyIndex--

  const tag = getOrCreateStyleTag()
  const sheet = tag.sheet!

  // Remove the rule we wrote
  for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
    const rule = sheet.cssRules[i] as CSSStyleRule
    if (rule.selectorText === entry.selector) {
      sheet.deleteRule(i)
    }
  }

  // Restore previous rule if there was one
  if (entry.previousCSS) {
    sheet.insertRule(entry.previousCSS, sheet.cssRules.length)
  }

  return `Undid: ${entry.description}`
}

export function redoEdit(): string | null {
  if (historyIndex >= history.length - 1) return null

  historyIndex++
  const entry = history[historyIndex]

  const tag = getOrCreateStyleTag()
  const sheet = tag.sheet!

  for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
    const rule = sheet.cssRules[i] as CSSStyleRule
    if (rule.selectorText === entry.selector) {
      sheet.deleteRule(i)
    }
  }

  if (entry.nextCSS) {
    sheet.insertRule(entry.nextCSS, sheet.cssRules.length)
  }

  return `Redid: ${entry.description}`
}

export function canUndo() { return historyIndex >= 0 }
export function canRedo() { return historyIndex < history.length - 1 }

// ── Export Generated CSS ──────────────────────────────────────────────────────

export function exportGeneratedCSS(): string {
  const tag = document.getElementById(STYLE_TAG_ID)
  if (!tag) return ''
  const sheet = (tag as HTMLStyleElement).sheet
  if (!sheet) return ''
  return Array.from(sheet.cssRules)
    .map(r => r.cssText)
    .join('\n')
}
