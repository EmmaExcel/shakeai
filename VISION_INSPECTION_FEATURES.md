# Shake Cursor Enhanced Features: Vision & Element Inspection

## Overview

Shake Cursor now includes **vision-enabled AI analysis** and **element inspection/editing** capabilities that make it fundamentally different from standard ChatGPT wrappers.

---

## ✨ New Features

### 1. Vision-Enabled Image Analysis

When images are clicked/selected, Shake Cursor can use vision-capable models to:
- Analyze visual content in images
- Describe scenes, objects, and layouts
- Read text within images (OCR)
- Provide bounding box suggestions for specific regions
- Generate region-based analysis

**Supported Vision Models:**
- **GPT-4o** (via OpenRouter or custom endpoint)
- **Claude 3 Vision** (claude-3-opus/sonnet)  
- **LLaVA** / **bakLLaVA** (via Ollama)
- **Moondream** (via Ollama)

### 2. Element Inspection Mode

Press `Ctrl+I` (or configure a custom shortcut) while in AI mode to enter inspect mode:
- Highlights selected elements with crosshair cursor
- Shows computed CSS styles
- Displays element attributes
- Reveals class names and IDs
- Provides visual feedback for manipulation

### 3. Region Suggestions for Images

When vision analysis is enabled:
- The AI can suggest specific image regions to focus on
- Bounding boxes are drawn around suggested areas
- Each region has a descriptive label

### 4. Enhanced Selection Metadata

Images now include:
- Natural dimensions (`naturalWidth × naturalHeight`)
- Rendered dimensions  
- MIME type detection
- Base64 data capture (when CORS permits)

---

## 🚀 Usage Examples

### Basic Setup with Vision

```typescript
import { AIOverlay } from '@emmaexcel/shakecursor'

AIOverlay.init({
  siteKey: 'pk_your_key',
  apiBaseUrl: 'https://your-api.com',
  trigger: {
    shake: true,
    keyboardShortcut: 'mod+k',
  },
  selection: {
    text: true,
    images: true,
    elements: true,
  },
  theme: {
    primaryColor: '#14b8a6',
    borderRadius: 8,
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
  
  onActivate: () => {
    console.log('✨ AI vision mode activated!')
  },
  
  onSelection: (selection) => {
    if (selection.kind === 'image' && selection.data) {
      console.log(`🖼️ Image detected: ${selection.label}`)
    }
  },
})
```

### Programmatic Element Inspection

```typescript
// Inspect element at mouse coordinates
const result = await AIOverlay.inspectAt(event)
if (result?.inspectionData) {
  console.log('Tag:', result.inspectionData.tagName)
  console.log('Classes:', result.inspectionData.className)
  console.log('ID:', result.inspectionData.id)
  
  // View computed styles
  Object.entries(result.inspectionData.computedStyle).forEach(([prop, value]) => {
    if (['display', 'position', 'width', 'height'].includes(prop)) {
      console.log(`${prop}: ${value}`)
    }
  })
}

// Inspect element by querying selector
const inspector = AIOverlayInspector.create({})
await inspector.inspect(document.querySelector('#my-element'))
```

### Custom Vision API Integration

```typescript
// For custom vision endpoints (Anthropic, Azure, etc.)
AIOverlay.init({
  model: {
    provider: 'custom',
    endpoint: 'https://your-vision-api.com/v1/chat/completions',
    model: 'claude-3-opus-20240229',
    headers: {
      'x-api-key': 'your_api_key',
      'anthropic-version': '2023-06-01',
    },
  },
})
```

### Handling Vision Analysis Responses

The AI will respond with vision analysis when images are selected:

```javascript
// Response might include:
"- The image shows a modern building facade"
"- There are 3 visible windows (regions)"
"- Region 1: top-left window, contains interior desk view [bbox: x:45,y:12,w:80,h:60]"
"- Region 2: bottom-right window, shows garden outside [bbox: x:150,y:90,w:75,h:55]"

// The model automatically provides bounding boxes when suggestRegions is enabled
```

### Inspect Mode Visual Indicators

When inspect mode is active:
- Cursor changes to crosshair
- Highlighted element shows yellow outline
- Element tag and description appear in panel
- Computed styles are listed (display, position, width, height, etc.)
- Attributes are shown for inspection

---

## 🎨 Visual Features

### Custom Cursor in Inspect Mode

The custom cursor transforms to a crosshair when inspect mode is active:

```css
body.ai-inspect-mode * {
  cursor: crosshair !important;
}
```

This provides visual feedback that you're in inspection/editing mode.

### Element Highlighting

Selected elements get a distinctive border during inspection:

```css
.ai-inspect-highlight {
  outline: 3px solid #fbbf24;
  outline-offset: -3px;
  border-radius: 4px;
}
```

---

## 🔧 Configuration Options

### VisionModelConfig

```typescript
interface VisionModelConfig extends ModelConfig {
  visionEnabled: boolean              // Enable vision capabilities
  visionModel?: string                // Model name ('gpt-4o', 'claude-3-opus', etc.)
  suggestRegions?: boolean            // Enable bounding box suggestions
  screenshotCapture?: {
    enabled: boolean
    maxDimensions: { width: number; height: number }
    quality?: number                  // JPEG quality (0-1)
  }
}
```

---

## 🌟 Why This Is Different from ChatGPT Wrappers

| Feature | Standard ChatGPT Wrapper | Shake Cursor |
|---------|--------------------------|---------------|
| **Image Vision** | Requires manual upload | Automatic via click |
| **Element Context** | None | Full DOM context + computed styles |
| **Inspection Mode** | N/A | Crosshair cursor + computed styles display |
| **Region Suggestions** | N/A | AI provides bounding boxes |
| **Visual Feedback** | Basic UI | Glowing borders, custom cursor |
| **Edit Preview** | Manual copy/paste | Direct style inspection |
| **Multi-modal** | Limited | Native image + text + DOM context |

---

## 📥 Next Steps

1. Update your `App.tsx` with vision-enabled model config
2. Configure vision API endpoint (OpenRouter, custom, etc.)
3. Set up callbacks for selection events  
4. Test image clicks to trigger vision analysis
5. Use inspect mode with Ctrl+I shortcut

---

## 📦 Dependencies

No additional npm dependencies required. Vision and inspection use:
- Browser-native Canvas API for image capture
- Fetch API for model requests  
- Standard DOM APIs for element inspection

---

*Built with ❤️ by the Shake Cursor Team*
