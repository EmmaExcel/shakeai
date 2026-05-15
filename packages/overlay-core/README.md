# Shake Cursor Overlay Core

Framework-agnostic browser SDK for contextual AI selection overlays.

## NPM-style usage

```ts
import { AIOverlay } from '@emmaexcel/shakecursor'

const overlay = AIOverlay.init({
  siteKey: 'pk_demo_shakecursor',
  apiBaseUrl: 'https://shakeai.onrender.com',
})

overlay.activate()
```

## Script tag usage

```html
<script src="/overlay.global.js"></script>
<script>
  window.AIOverlay.init({
    siteKey: 'pk_live_xxx',
    apiBaseUrl: 'https://api.yourproduct.com'
  })
</script>
```

## Current capabilities

- Cursor shake activation
- Cmd/Ctrl + K activation
- Text selection capture
- Image metadata capture
- DOM element text capture
- Shadow DOM prompt UI
- Ollama and custom endpoint transports
- Hosted API transport with `siteKey`
- Theme, selector rules, and lifecycle callbacks
