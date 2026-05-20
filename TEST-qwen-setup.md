# Testing Shake Cursor with Qwen/Qwen3.5-9b - Step by Step

## 🚀 Quick Test Guide

### Step 1: Install and Pull the Model

```bash
# Check if Ollama is running
ps aux | grep ollama

# If not running, start it (Mac/Linux)
ollama serve &

# Pull Qwen vision model (choose one):
ollama pull qwen-vision-max-latest
# OR
ollama pull qwen2.5-vision  
# OR your specific model name:
ollama pull qwen3.5-9b

# Verify installation
ollama list | grep qwen
```

### Step 2: Confirm Your Endpoint is Ready

```bash
# Test the endpoint (replace with your actual server path)
curl http://127.0.0.1:1234/api/chat

# Or test model info
ollama show qwen-vision-max-latest --multiline
```

### Step 3: Build Shake Cursor SDK

```bash
cd /Users/excelemma-okerhe/Desktop/shakecursor/packages/overlay-core
npm run build
# Returns to main directory
cd ../..
```

### Step 4: Start Your App in Development Mode

```bash
# Using Vite (recommended for testing)
npm run dev

# Output will be at: http://localhost:5173
# OR use your configured port: http://localhost:<port>
```

### Step 5: Test Vision Capabilities

#### Method A: Direct Image Click Test

1. Open `http://localhost:5173` in browser
2. Shake cursor or press `Cmd/Ctrl + K` to activate AI mode
3. Click any image on the page
4. Watch for:
   - "Vision Enabled" badge appear
   - Console logs showing image data capture
   - AI analyzing the image

#### Method B: Programmatic Image Test

```javascript
// In browser console, run this:
const testImage = document.querySelector('img[src*="sample"]'); // Pick any image
AIOverlay.init({
  model: {
    provider: 'ollama',
    endpoint: 'http://127.0.0.1:1234/api/chat',
    model: 'qwen-vision-max-latest',
    visionEnabled: true,
  },
});

// Manually trigger vision analysis on selected image
testImage.click(); // If already selected and click again
```

#### Method C: Console Test Function

Open browser console and run:

```javascript
// Copy this test function from example-qwen-test.md
async function quickTestVision() {
  const img = document.querySelector('img')?.firstElementChild;
  
  if (!img) {
    console.log('No image found - select one first');
    return;
  }
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Canvas context failed');
    
    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const [header, base64] = dataUrl.split(',');
    
    console.log('\n=== Qwen Vision Test ===\n');
    console.log(`Image dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
    console.log(`MIME type: ${header.split(':')[1].split(';')[0]}`);
    console.log(`Base64 length: ${base64.length} chars`);
    
    const formData = new FormData();
    formData.append('model', 'qwen-vision-max-latest');
    formData.append('prompt', 'Describe this image in detail. What do you see?');
    formData.append('image', base64, `image.${header.split(':')[1].split(';')[0]}`);
    
    const response = await fetch('http://127.0.0.1:1234/api/chat', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      return;
    }
    
    const result = await response.json();
    console.log('\nAI Response:\n');
    console.log(result.message?.content || JSON.stringify(result, null, 2));
    
    // Check for region suggestions
    const regions = result.message?.content.matchAll(/\[x:\d+,y:\d+,w:\d+,h:\d+\]/g);
    if (regions.length > 0) {
      console.log('\n📍 Region Suggestions:');
      Array.from(regions).forEach(([match]) => console.log('   ', match));
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
  
  return result;
}

// Run the test
quickTestVision();
```

### Step 6: Inspect Mode Test

```javascript
// In browser console, enter inspect mode manually:
AIOverlay.init({
  siteKey: 'pk_test',
  model: {
    provider: 'ollama',
    endpoint: 'http://127.0.0.1:1234/api/chat',
    model: 'qwen-vision-max-latest',
    visionEnabled: true,
  },
}).inspectAt({ clientX: 50, clientY: 50 }); // Click on any element

// Or use keyboard shortcut once active:
document.addEventListener('keydown', (e) => {
  if (e.key === 'i' && AIOverlay.getInspectMode()) {
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (target) {
      AIOverlay.inspectAt(e);
    }
  }
});
```

### Step 7: Inspect Mode Visual Test

1. Activate AI mode (`Cmd/Ctrl + K`)
2. Click on a page element
3. Press `i` key to enter inspect mode
4. Mouse over different elements
5. Verify you see:
   - Crosshair cursor
   - Element tag info in panel
   - Computed styles listed

---

## 🔧 Configuration Files for Qwen Testing

### File 1: test-qwen-vision.ts
Located at: `/Users/excelemma-okerhe/Desktop/shakecursor/test-qwen-vision.ts`

This file contains the complete configuration and test functions.

### File 2: .qwen-test.config.js  
Located at: `/Users/excelemma-okerhe/Desktop/shakecursor/.qwen-test.config.js`

Quick config for Qwen-specific settings.

### File 3: EXAMPLE-qwen-test.md
Located at: `/Users/excelemma-okerhe/Desktop/shakecursor/EXAMPLE-qwen-test.md`

Comprehensive guide with multiple testing approaches.

---

## 🐛 Troubleshooting

### No Response When Clicking Images

**Problem:** Image click doesn't trigger vision analysis

**Fixes:**
1. Check image selection is enabled:
   ```typescript
   selection: { images: true, } // Must be true!
   ```

2. Verify CORS isn't blocking:
   - Check browser console for CORS errors
   - May need to disable CORS in dev environment

3. Verify model is loaded:
   ```bash
   ollama list | grep qwen
   ```

### Canvas Draw Fails with "Invalid Image Format"

**Problem:** `canvas.toDataURL()` throws error

**Fixes:**
1. Add CORS headers temporarily for testing
2. Use smaller images (<5MB)
3. Test with simple image formats (JPEG/PNG only)

### Timeout Errors

**Problem:** Model request takes too long

**Fixes:**
```typescript
model: {
  timeout: 120000, // Increase to 120 seconds
}
```

### 404 Not Found Error

**Problem:** Endpoint or model not accessible

**Fixes:**
1. Verify endpoint is running: `curl http://127.0.0.1:1234/api/chat`
2. Check model is loaded: `ollama list`
3. Pull the correct model name used in endpoint

### 503 Service Unavailable

**Problem:** Server overloaded or unavailable

**Fixes:**
1. Wait and retry
2. Reduce concurrent requests
3. Disable screenshot capture for testing

---

## 📊 Expected Response Format

Qwen responses look like:

```json
{
  "message": {
    "role": "assistant",
    "content": "This image shows a beautiful landscape with mountains in the background, featuring a serene lake in the foreground reflecting the sky and snow-capped peaks. The colors are vibrant with blues, whites, and greens..."
  }
}
```

The SDK automatically parses this into a formatted panel display.

---

## ✅ Success Checklist

You'll know everything is working when:

- [ ] `ollama list` shows your Qwen model
- [ ] Endpoint responds to curl requests
- [ ] AI mode activates (shake or keyboard shortcut)
- [ ] Image clicks show vision badge
- [ ] Console logs image data capture
- [ ] AI returns formatted responses
- [ ] Inspect mode changes cursor to crosshair
- [ ] Element inspection shows computed styles

---

## 📝 Example Questions for Testing

```javascript
// Once vision is working, try these questions:

"What objects are visible in this image?"
"Describe the colors and their arrangement"
"What is happening in the scene?"
"Are there any text elements or labels?"
"Do you see any people or animals?"
"Is there anything unusual or notable about this image?"
```

---

## 🚀 Next Steps After Testing

Once you've confirmed vision works:

1. **Save your working configuration** in `App.tsx`
2. **Document your Qwen model name** exactly as it appears
3. **Test with different images** to verify reliability
4. **Try text-only questions** to confirm full capability
5. **Test inspect mode** thoroughly for editing features

---

**Questions?** Check:
- `packages/overlay-core/src/inspector.ts` - Element inspection API
- `packages/overlay-core/src/transport.ts` - Vision model handling
- `VISION_INSPECTION_FEATURES.md` - Full feature documentation

EOF
echo "Created TEST-qwen-setup.md"