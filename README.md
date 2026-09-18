# Shake Cursor

A framework-agnostic web overlay library that adds gesture-driven element inspection and multimodal context capture to browser applications.

Shake Cursor activates via mouse shake gesture or keyboard shortcut, allowing users to inspect DOM nodes, capture rendered images, extract text selections, and send structured contextual payloads to custom or hosted model endpoints.

## Features

- Gesture and shortcut activation: Configurable cursor shake detector with directional hysteresis and keyboard shortcuts.
- Multimodal selection capture: Captures text ranges, image elements, and DOM nodes with computed styles and selectors.
- In-browser element inspection: Interactive inspection mode with computed CSS property inspection, hierarchy traversal, and class extraction.
- Live DOM edits: Style manipulation and CSS rule injection with history tracking.
- Provider agnostic: Compatible with local models (Ollama), proxy gateways (OpenRouter), hosted APIs (Gemini), or custom backend services.
- Zero UI framework dependencies: Pure TypeScript and DOM implementation packaged as an ES module and global script.

## Installation

```bash
npm install @emmaexcel/shakecursor
```

## Quick Start

Initialize the overlay in your application entry point:

```typescript
import { AIOverlay } from '@emmaexcel/shakecursor'

AIOverlay.init({
  siteKey: 'pk_live_your_key',
  apiBaseUrl: 'https://api.yourdomain.com',
  trigger: {
    shake: true,
    keyboardShortcut: 'mod+k',
  },
  selection: {
    text: true,
    images: true,
    elements: true,
  },
  model: {
    provider: 'openrouter',
    endpoint: 'https://api.openrouter.ai/v1/chat/completions',
    model: 'gpt-4o',
    visionEnabled: true,
    suggestRegions: true,
  },
  theme: {
    primaryColor: '#14b8a6',
    borderRadius: 8,
  },
  onActivate: () => {
    console.log('Overlay activated')
  },
  onSelection: (selection) => {
    console.log('Selection:', selection)
  },
})
```

## Core Modules

### AIOverlay

Main controller for overlay lifecycle, input handling, and event routing.

| Method | Description |
| --- | --- |
| `init(config)` | Initialize the global overlay instance. |
| `activate()` | Programmatically activate the overlay. |
| `deactivate()` | Dismiss the overlay and clear active selection. |
| `toggleInspectMode()` | Toggle interactive DOM element inspection mode. |
| `inspectAt(event)` | Inspect an element at target mouse coordinates. |
| `getInspectMode()` | Return current inspection mode state. |
| `destroy()` | Clean up event listeners, UI elements, and styles. |

### ElementInspector

Utility class for programmatic DOM analysis and style inspection without requiring the UI overlay.

```typescript
import { ElementInspector } from '@emmaexcel/shakecursor'

const target = document.querySelector('#content')
if (target) {
  const analysis = ElementInspector.analyze(target as HTMLElement)
  console.log(analysis.data.tagName)
  console.log(analysis.data.computedStyle)
  console.log(analysis.suggestions)
}
```

| Method | Description |
| --- | --- |
| `analyze(element)` | Inspect an element and return tag, attributes, computed styles, and suggestions. |
| `getComputedStyles(element)` | Return normalized dictionary of computed styles. |
| `getAttributes(element)` | Extract element attributes as a key-value object. |
| `describeElement(element)` | Generate human-readable element summary. |
| `getHierarchy(element, maxDepth)` | Return an array of parent elements up to the specified depth. |
| `getFullStyles(element)` | Return all non-empty computed CSS properties. |
| `matchesSelector(element, selectors)` | Verify if an element matches any selector in a list. |

## Configuration Reference

```typescript
interface AIOverlayConfig {
  siteKey?: string
  apiBaseUrl?: string
  trigger?: {
    shake?: boolean
    keyboardShortcut?: string
    thresholds?: {
      windowMs?: number
      cooldownMs?: number
      minSamples?: number
      minReversals?: number
      minDistance?: number
      minDeltaX?: number
    }
  }
  selection?: {
    text?: boolean
    images?: boolean
    elements?: boolean
    blockedSelectors?: string[]
  }
  theme?: {
    primaryColor?: string
    borderRadius?: number
    fontFamily?: string[]
  }
  model?: {
    provider?: 'ollama' | 'openrouter' | 'gemini' | 'custom'
    endpoint?: string
    model?: string
    visionEnabled?: boolean
    visionModel?: string
    suggestRegions?: boolean
    temperature?: number
    maxTokens?: number
    timeout?: number
  }
  editEnabled?: boolean
  onActivate?: (options: { shakeCount?: number }) => void
  onDeactivate?: () => void
  onSelection?: (selection: AIOverlaySelection) => void
  onAsk?: (payload: { question: string; selection?: AIOverlaySelection }) => void
  onResponse?: (response: string, payload?: AIOverlayAskPayload) => void
  onError?: (error: Error) => void
  onInspect?: (result: { element: HTMLElement; inspectionData: ElementInspectionData }) => void
}
```

## Provider Examples

### OpenRouter

```typescript
AIOverlay.init({
  siteKey: 'pk_openrouter',
  apiBaseUrl: 'https://api.openrouter.ai/v1',
  model: {
    provider: 'openrouter',
    endpoint: 'https://api.openrouter.ai/v1/chat/completions',
    model: 'gpt-4o',
    visionEnabled: true,
  },
})
```

### Local Ollama

```typescript
AIOverlay.init({
  model: {
    provider: 'ollama',
    endpoint: 'http://localhost:11434/api/chat',
    model: 'llava',
    visionEnabled: true,
  },
})
```

### Custom Endpoint

```typescript
AIOverlay.init({
  model: {
    provider: 'custom',
    endpoint: 'https://api.example.com/v1/analyze',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
    },
    visionEnabled: true,
  },
})
```

## Architecture

Shake Cursor is organized into modular subsystems:

- `packages/overlay-core/src/shake.ts`: Pointer tracking algorithm analyzing delta vectors, direction changes, and velocity to distinguish intentional shake gestures from standard scrolling.
- `packages/overlay-core/src/selection.ts`: Selection interceptor capturing text ranges, canvas/image pixel buffers, and DOM coordinates.
- `packages/overlay-core/src/inspector.ts`: DOM traversal and computed CSS style extraction.
- `packages/overlay-core/src/editor.ts`: CSS rule generation, live stylesheet injection, and undo stack management.
- `packages/overlay-core/src/ui.ts`: Scoped DOM overlay interface with cursor feedback.
- `packages/overlay-core/src/transport.ts`: Request serialization and multi-provider client dispatch.

## Privacy and Data Handling

- No automatic telemetry: Data is only transmitted when an explicit selection prompt is submitted.
- Sensitive elements protection: Configurable `blockedSelectors` prevent selection of inputs, passwords, or elements marked with `[data-ai-private]`.
- Local execution: Compatible with local backends like Ollama to keep all interactions within the host network.

## License

MIT
