# Shake Cursor - AI Vision & Inspection SDK

A framework-agnostic AI overlay SDK that brings **vision-enabled image analysis** and **element inspection/editing** directly into your browser. Unlike standard ChatGPT wrappers, Shake Cursor provides deep contextual understanding of web pages through visual analysis and DOM inspection.

![Shake Cursor Logo](./assets/hero.png)

## ✨ What Makes This Different

```
┌─────────────────────────────────────────────────────────────┐
│                    Shaked Cursor                             │
│  ┌──────────────────┐   ┌─────────────────────────────────┐ │
│  │    Vision AI     │   │      Element Inspection          │ │
│  │  • Image analysis│   │  • Crosshair cursor mode         │ │
│  │  • OCR text read │   │  • Computed style inspection      │ │
│  │  • Region boxes  │   │  • Attribute reveal               │ │
│  └──────────────────┘   │  • Visual feedback                │ │
│                         │  • Edit preview                   │ │
│                         └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 🎯 Vision-Enabled Analysis

When you click on an image, Shake Cursor automatically uses vision-capable models (GPT-4o, Claude 3, LLaVA) to:

- **Analyze visual content** - Describe scenes, objects, and layouts
- **Read text in images** - OCR for diagrams, charts, and screenshots
- **Suggest regions** - AI highlights important image sections
- **Multi-modal context** - Combine visual + DOM + selection data

```typescript
AIOverlay.init({
  model: {
    provider: 'openrouter',
    model: 'gpt-4o',
    visionEnabled: true,        // Enable vision mode
    suggestRegions: true,       // Show bounding box suggestions
    screenshotCapture: {        // Optional full-page capture
      enabled: true,
      maxDimensions: { width: 1200, height: 800 },
      quality: 0.95,
    }
  }
})
```

### 🔍 Element Inspection Mode

Press `Ctrl+I` (or configure custom shortcut) to enter inspection mode:

- **Crosshair cursor** - Visual feedback for element targeting
- **Computed style inspector** - See actual CSS values (display, position, width, height, etc.)
- **Attribute viewer** - Reveal all element attributes
- **Class/ID navigator** - Quick identification of targets
- **Edit preview mode** - Temporary style changes for testing

```typescript
// Inspect element at cursor position
const result = await AIOverlay.inspectAt(event)
if (result?.inspectionData) {
  console.log('Tag:', result.inspectionData.tagName)
  console.log('Classes:', result.inspectionData.className)
  console.log('Styles:', Object.keys(result.inspectionData.computedStyle))
}

// Standalone inspector (no AI needed)
const element = document.querySelector('#my-element')
const analysis = ElementInspector.analyze(element as HTMLElement)
console.log(analysis.data)           // Inspection data
console.log(analysis.suggestions)    // Suggested edits
```

## 🚀 Quick Start

### Installation

```bash
npm install @emmaexcel/shakecursor
```

### Basic Setup

```typescript
import { AIOverlay, ElementInspector } from '@emmaexcel/shakecursor'

// Initialize with vision-enabled model
AIOverlay.init({
  siteKey: 'pk_your_api_key',
  apiBaseUrl: 'https://your-api-endpoint.com',
  
  trigger: {
    shake: true,
    keyboardShortcut: 'mod+k',
  },
  
  selection: {
    text: true,
    images: true,      // Enable image vision analysis
    elements: true,
  },
  
  model: {
    provider: 'openrouter',
    endpoint: 'https://api.openrouter.ai/v1/chat/completions',
    model: 'gpt-4o',
    
    // Vision capabilities
    visionEnabled: true,
    visionModel: 'gpt-4o',
    suggestRegions: true,
    
    screenshotCapture: {
      enabled: true,
      maxDimensions: { width: 1200, height: 800 },
      quality: 0.95,
    }
  },
  
  theme: {
    primaryColor: '#14b8a6',
    borderRadius: 8,
  },
  
  // Callbacks
  onActivate: () => console.log('AI vision mode activated!'),
  onSelection: (selection) => {
    if (selection.kind === 'image') {
      console.log('🖼️ Image ready for vision analysis:', selection.label)
    }
  },
  onAsk: ({ question, selection }) => {
    // Vision model will analyze image + text automatically
  },
})

// Or use standalone inspector for debugging
ElementInspector.analyze(document.querySelector('.target'))
```

## 📋 API Reference

### AIOverlay

| Method | Description |
|--------|-------------|
| `init(config)` | Initialize the overlay with your configuration |
| `inspectAt(event)` | Inspect element at mouse coordinates |
| `inspectMode` | Toggle inspect mode programmatically |

### Vision Model Config

```typescript
interface VisionModelConfig {
  visionEnabled: boolean              // Enable vision capabilities
  visionModel?: string                // 'gpt-4o', 'claude-3-opus', 'llava'
  suggestRegions?: boolean            // Show bounding box suggestions
  screenshotCapture?: {
    enabled: boolean
    maxDimensions: { width: number; height: number }
    quality?: number                  // 0-1 JPEG quality
  }
}
```

### ElementInspector

| Method | Description |
|--------|-------------|
| `getComputedStyles(element)` | Get normalized computed styles |
| `getAttributes(element)` | Get element attributes object |
| `describeElement(element)` | Get human-readable element description |
| `getHierarchy(element, depth)` | Get parent chain (up to N levels) |
| `getFullStyles(element)` | Get all computed style properties |
| `matchesSelector(element, selectors)` | Check selector matching |
| `analyze(element)` | Get data + edit suggestions |

## 🎨 Visual Features

### Custom Cursor Animation

```typescript
// The SDK includes a custom animated cursor that:
// • Glows and pulses when active
// • Transforms to crosshair in inspect mode
// • Shows shake count on activation
```

### Unique Panel Design

The AI panel features:
- **Glowing conic-gradient border** with 4-color palette
- **Dark premium aesthetic** with translucent backgrounds
- **Smooth animations** for appear/disappear
- **Smart positioning** that follows selections

## 🔄 Comparison: ChatGPT Wrapper vs Shake Cursor

| Feature | Standard Wrapper | Shake Cursor |
|---------|------------------|--------------|
| Image analysis | Manual upload ❌ | Click → Auto-analyze ✅ |
| DOM context | None ⚠️ | Full selection + styles ✅ |
| Inspect mode | N/A ❌ | Crosshair + computed styles ✅ |
| Region suggestions | N/A ❌ | AI provides bounding boxes ✅ |
| Visual feedback | Basic ⚠️ | Glowing borders, custom cursor ✅ |
| Edit preview | Copy/paste required ✅ | Direct inspection ✅ |
| Multi-modal input | Limited ⚠️ | Image + DOM + text ✅ |

## 🛠️ Use Cases

### 1. E-commerce Product Analysis
- Click product image → AI analyzes features
- Get region suggestions for close-ups
- Extract specs from diagrams with OCR

### 2. Web Accessibility Audit
- Inspect mode reveals computed styles
- Identify color contrast issues
- Review ARIA and role attributes

### 3. Content Moderation
- Vision models detect inappropriate content
- Region highlighting flags problematic areas
- Automated text extraction for review

### 4. Debugging & Development
- Crosshair inspection of any element
- View computed styles directly
- Get attribute hierarchy instantly

### 5. Research & Documentation
- Analyze charts, graphs, and diagrams
- Extract labels and annotations from images
- Multi-modal analysis of complex layouts

## 🔒 Privacy & Security

Shake Cursor respects user privacy:
- **No telemetry** by default
- All processing local-first when using Ollama/self-hosted endpoints
- Image data only sent when visionEnabled is true
- Optional screenshot capture (opt-in)
- Respects `data-ai-overlay-ignore` markers

## 📦 Configuration Examples

### OpenRouter with GPT-4o Vision
```typescript
AIOverlay.init({
  siteKey: 'pk_openrouter_demo',
  apiBaseUrl: 'https://api.openrouter.ai/v1',
  model: {
    provider: 'openrouter',
    model: 'gpt-4o',
    visionEnabled: true,
    suggestRegions: true,
  }
})
```

### Ollama with LLaVA Vision
```typescript
AIOverlay.init({
  siteKey: 'pk_ollama_demo',
  apiBaseUrl: 'http://localhost:11434/api/chat',
  model: {
    provider: 'ollama',
    model: 'llava',  // or 'bakLLaVA', 'moondream'
    visionEnabled: true,
  }
})
```

### Custom Vision API (Anthropic Claude)
```typescript
AIOverlay.init({
  siteKey: 'pk_custom_demo',
  apiBaseUrl: 'https://your-api.com/v1/chat/completions',
  model: {
    provider: 'custom',
    endpoint: 'https://your-claude-endpoint.com',
    model: 'claude-3-opus-20240229',
    headers: {
      'x-api-key': 'your_key',
      'anthropic-version': '2023-06-01',
    },
    visionEnabled: true,
  }
})
```

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ by the Shake Cursor Team**

*Vision-enabled AI inspection SDK that goes beyond ChatGPT wrappers*
