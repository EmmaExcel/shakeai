# Shake Cursor Enhanced Features - Visual Guide

## 📸 Vision Analysis Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Click on Image                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│   Selection detected:                                        │
│   • kind: 'image'                                            │
│   • mimeType: 'image/jpeg'                                   │
│   • data: [base64 image data]                                │
│   • width: 800, height: 600                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│   Vision Model Activated:                                    │
│   • Model: gpt-4o (or configured model)                      │
│   • Input: image + context + user question                   │
│   • Region suggestions enabled if config says so              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│   AI Response Example:                                       │
│                                                               │
│   "This image shows a modern office building with           │
│    the following features:                                   │
│                                                               │
│    • Glass facade (Region 1: [x:45,y:12,w:80,h:60])         │
│    • Interior visible in windows                             │
│      - Desk area visible in top-left window                  │
│      - Garden outside bottom-right window                    │
│                                                               │
│    The building has a contemporary architectural style with  │
│    extensive use of glass and steel."                        │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 Element Inspection Flow

```
┌─────────────────────────────────────────────────────────────┐
│   Press Ctrl+I while in AI mode                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│   Cursor transforms to crosshair                             │
│   Body class: 'ai-inspect-mode' added                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│   Click on element or hover (optional)                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│   Element Inspected:                                         │
│                                                               │
│   <div class="product-card highlighted">                     │
│     ID: product-123                                          │
│     aria-label="Buy Now"                                     │
│                                                               │
│   Computed Styles:                                           │
│     • display: flex                                           │
│     • width: 300px                                           │
│     • padding: 16px                                          │
│     • background-color: white                                 │
│     • border-radius: 8px                                     │
│   -------------------------------------------------------   │
│                                                               │
│   Inspect Mode Features:                                     │
│     ✅ Yellow outline on element                              │
│     ✅ Computed styles visible                                │
│     ✅ Attribute list shown                                   │
│     ✅ Crosshair cursor                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓ (Press ESC or click elsewhere)
┌─────────────────────────────────────────────────────────────┐
│   Inspect mode closes                                        │
│   Normal AI prompt returns                                   │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 UI Components

### Prompt Panel States

**1. Selection State (text/image/element)**
```
┌──────────────────────────────┐
│ kind: IMAGE                   │ ← Glowing blue border
│ label: Product Image          │
├──────────────────────────────┤
│                              │
│  [Image preview]             │
│                              │
│  AI analysis here...         │
│                              │
├──────────────────────────────┤
│ ✗ Ask           ┌─×─ Close ─ │
└──────────────────────────────┘
```

**2. Vision Analysis State**
```
┌──────────────────────────────┐
│  ✨ Vision Enabled           │ ← Green badge for image selection
│ kind: IMAGE (vision)         │
│ label: Product Image         │
├──────────────────────────────┤
│                              │
│  Analyzing image...          │
│                              │
├──────────────────────────────┤
│ ✗ Ask           ┌─×─ Close ─ │
└──────────────────────────────┘
```

**3. Inspect Mode State**
```
┌──────────────────────────────┐
│ kind: DIV                    │ ← Yellow badge for inspect mode
│ label: .product-card         │
├──────────────────────────────┤
│                              │
│  <div>                       │ ← Tag name highlighted
│    Classes: product-card     │
│                             │
│    ID: product-123          │
│    Status: ● Selected       │
│                             │
│    Computed Styles:         │
│      • display: flex        │
│      • width: 300px         │
│    Attributes:              │
│      • aria-label="Buy Now" │
└──────────────────────────────┘
```

### Custom Cursor Evolution

**Idle State:**
```css
.cursor-shape {
  display: none;
}
```

**AI Active State:**
```css
.custom-cursor.active {
  display: block;
}
```
- Glowing SVG cursor
- Follows mouse with smooth animation
- Shows shake count when activated

**Inspect Mode State:**
```css
body.ai-inspect-mode * {
  cursor: crosshair !important;
}
```
- Crosshair overlay for precision selection
- Visual feedback element highlighting

### Region Suggestion Overlay

When `suggestRegions: true`:
```css
.region-suggestion {
  position: relative;
  padding: 12px;
  background: rgba(6, 78, 59, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.region-tag {
  color: #10b981;
  font-weight: 600;
}
```

Example region annotation:
```
🎯 Region 1: [x:45,y:12,w:80,h:60]
   "Top-left window shows interior desk area"
   
🎯 Region 2: [x:150,y:90,w:75,h:55]  
   "Bottom-right window shows garden outside"
```

## 🚀 Keyboard Shortcuts

| Key | Action | Description |
|-----|--------|-------------|
| `Cmd/Ctrl+K` | Toggle AI | Activate/deactivate overlay |
| `I` (while active) | Inspect Mode | Crosshair + element inspection |
| `Escape` | Close/Exit | Exit inspect mode or close panel |

## 🎯 Selection Types

### Text Selection
```typescript
{
  kind: 'text',
  label: 'highlighted text',
  content: 'Selected paragraph text...',
  rect: { left, top, width, height },
}
```

### Image Selection (with vision)
```typescript
{
  kind: 'image',
  label: 'Product Hero Image',
  data: [base64 image data],
  mimeType: 'image/jpeg',
  width: 800,
  height: 600,
  // Vision model will analyze this automatically!
}
```

### Element Selection
```typescript
{
  kind: 'element',
  label: 'button: Buy Now',
  content: '<button aria-label="Buy Now">Buy...</button>',
  rect: { left, top, width, height },
}
```

## 📊 Performance Characteristics

| Operation | Typical Latency | Notes |
|-----------|-----------------|-------|
| Shake detection | ~650ms window | Zigzag pattern required |
| Text selection | <100ms | Instant capture |
| Image capture | 100-300ms | Canvas draw + base64 |
| Vision analysis | 2-15s | Depends on model/image size |
| Element inspection | <10ms | Pure DOM API |
| Region suggestions | ~500ms | Model-dependent |

## 🔐 Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Shake detection | ✅ | ✅ | ✅ | ✅ |
| Element inspection | ✅ | ✅ | ✅ | ✅ |
| Vision models (OpenRouter) | ✅ | ✅ | ✅ | ✅ |
| Vision models (Ollama/LLaVA) | ✅ | ⚠️ Partial | ✅ | ✅ |
| Canvas image capture | ✅ | ✅ | ✅ | ✅ |

*⚠️ = May require specific model support or configuration*

---

**Need more help?** Check out the full documentation in `VISION_INSPECTION_FEATURES.md`
