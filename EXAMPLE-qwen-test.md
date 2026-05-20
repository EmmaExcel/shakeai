# Testing Shake Cursor with Qwen/Qwen3.5-9b

## Quick Start Guide

### Prerequisites

1. **Qwen Model Running** - Make sure your Qwen vision model is loaded:
   ```bash
   ollama pull qwen-vision-max-latest
   # Or for Qwen2.5 with vision:
   ollama pull qwen2.5-vision
   # Or Qwen3.5-9b specifically:
   ollama pull qwen3.5-9b
   ```

2. **Server Running** - Verify your endpoint is accessible:
   ```bash
   curl http://127.0.0.1:1234/api/chat
   ```

### Testing Steps

#### Step 1: Build the Project

```bash
cd /Users/excelemma-okerhe/Desktop/shakecursor
npm run build
```

Or use Vite dev server for hot reload:
```bash
npm run dev
```

#### Step 2: Open in Browser

Open `http://localhost:5173` (or your vite port) and interact with the page.

#### Step 3: Activate AI Mode

- **Shake**: Move cursor quickly in a zigzag pattern
- **Keyboard**: Press `Cmd/Ctrl + K`
- You should see: "AI mode activated!" toast notification

#### Step 4: Click an Image to Test Vision

Click any image on the page and you'll see:
1. Image selection detected
2. Vision badge appears on the prompt panel
3. Base64 image data captured (or error if CORS blocks)
4. AI processes image + your question
5. Response appears with region suggestions

#### Step 5: Enter Inspect Mode

Press `i` key while in AI mode to enter inspect mode:
1. Cursor changes to crosshair
2. Highlight elements to see computed styles
3. View element attributes and computed properties

### Common Model Names for Qwen

Try these model names if the default doesn't work:

```typescript
model: {
  provider: 'ollama',
  endpoint: 'http://127.0.0.1:1234/api/chat',
  model: 'qwen-vision-max-latest',    // Official vision model
  // OR try:
  model: 'qwen2.5-vision',             // Qwen2.5 with vision
  // OR try:
  model: 'qwen3.5-9b',                 // Your specific model
}
```

### Test Configuration File

The file `test-qwen-vision.ts` contains a ready-to-use configuration for Qwen.

**To use it in your App:**

1. Copy the config object from `test-qwen-vision.ts`
2. Replace the model config in your main initialization
3. Start testing immediately!

### Debugging Tips

#### If images don't trigger vision analysis:

```typescript
// Check that image selection is enabled
selection: {
  images: true, // Must be true!
},

// And verify CORS is not blocking canvas.toDataURL()
console.log('Image data captured:', !!selection.data)
```

#### If model errors occur:

1. **404 Error**: Model not loaded
   ```bash
   ollama pull qwen-vision-max-latest
   ```

2. **503 Service Unavailable**: Server overloaded
   - Wait and retry
   - Or disable screenshot capture temporarily

3. **Timeout Error**: 
   Add to model config:
   ```typescript
   model: {
     // ... other settings
     timeout: 120000, // 120 seconds
   }
   ```

4. **Invalid image format**:
   - Use smaller images (<5MB)
   - Enable `visionEnabled: true` only for images

### Quick Test Commands

```bash
# Check if model is loaded
ollama list | grep qwen

# Show model details (check vision capability)
ollama show qwen-vision-max-latest

# Test endpoint directly
curl http://127.0.0.1:1234/api/chat

# Interactive test using Qwen
ollama run qwen-vision-max-latest "Describe this image: [base64 data]"
```

### Vision Response Format

Qwen returns responses like:

```json
{
  "message": {
    "role": "assistant",
    "content": "This image shows a beautiful sunset over mountains..."
  }
}
```

The SDK automatically parses this and displays it in the panel.

### Customizing for Qwen3.5-9b

If your model is specifically Qwen3.5-9b, configure:

```typescript
model: {
  provider: 'ollama',
  endpoint: 'http://127.0.0.1:1234/api/chat',
  model: 'qwen3.5-9b',         // Your exact model name
  
  // Optional: Adjust parameters for Qwen
  temperature: 0.7,           // Creative vs conservative
  maxTokens: 2000,            // Response length
  timeout: 60000,             // Timeout in ms
  
  visionEnabled: true,        // Required for image analysis
}
```

### Testing Region Suggestions

To enable bounding box suggestions:

```typescript
model: {
  suggestRegions: false,      // Disable if not supported by model
  screenshotCapture: {
    enabled: false,           // Reduce bandwidth
  }
}
```

If your Qwen model doesn't support region suggestions, set `suggestRegions: false` to avoid errors.

### Success Indicators

You'll know vision is working when:

1. ✅ Image click shows "Vision badge" in panel header
2. ✅ Console logs show image data being captured
3. ✅ AI response contains visual descriptions
4. ✅ Region suggestions appear (if supported)
5. ✅ Panel shows analysis results with proper formatting

### Troubleshooting

**No response when clicking images:**
- Check browser console for errors
- Verify model is loaded: `ollama list`
- Test endpoint directly with curl
- Enable verbose logging in onAsk/onResponse callbacks

**Canvas draw fails (CORS error):**
```javascript
// Add this before image clicks (in test mode):
const originalToDataURL = HTMLCanvasElement.prototype.toDataURL
HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
  // Disable CORS check for local testing
  if (!type.startsWith('image/')) return ''
  try {
    return originalToDataURL.call(this, type, quality)
  } catch (e) {
    console.warn('CORS error:', e.message)
    return this.toDataURL(type, quality)
  }
}
```

---

**Need more help?** Check the full documentation in:
- `packages/overlay-core/src/` - Source files
- `VISION_INSPECTION_FEATURES.md` - Feature docs
- `test-qwen-vision.ts` - Example configuration

