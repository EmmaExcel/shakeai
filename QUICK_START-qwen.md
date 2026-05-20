# 🚀 Quick Start: Testing Qwen Vision with Shake Cursor

## 3-Step Setup for Qwen/Qwen3.5-9b Testing

### Step 1: Verify Model is Ready

```bash
# Pull your Qwen vision model (choose one)
ollama pull qwen-vision-max-latest
# OR
ollama pull qwen2.5-vision
# OR your exact model name:
ollama pull qwen3.5-9b

# Verify it's loaded
ollama list | grep qwen
```

### Step 2: Build the SDK

```bash
cd /Users/excelemma-okerhe/Desktop/shakecursor/packages/overlay-core
npm run build
cd ../..
```

### Step 3: Copy Example App to Your Project

```bash
# Replace your App.tsx with this test version:
cp example-app-qwen.tsx src/App.tsx

# OR if you prefer, modify your existing App.tsx
# See the configuration comments in example-app-qwen.tsx
```

### Step 4: Run Development Server

```bash
npm run dev
```

Open browser at `http://localhost:5173`

---

## How to Test Vision Immediately

### Method A: Shake Gesture

1. Load the page
2. Move your cursor quickly in a zigzag pattern (~650ms window)
3. Toast notification: "AI mode activated!"
4. **Click any image** on the page
5. AI automatically analyzes it with Qwen!

### Method B: Keyboard Shortcut

1. Load the page
2. Press `Cmd/Ctrl + K` to activate AI mode
3. Click any image
4. AI analyzes the image automatically

### Method C: Inspect Mode (Ctrl+I)

1. Activate AI mode first
2. **Press "i" key** to enter inspect mode
3. Hover over elements to see computed styles
4. Press `Escape` or click elsewhere to exit

---

## What You'll See When It Works

### Visual Indicators

- 🎨 **Glowing border** around AI panel (conic-gradient animation)
- 🌟 **"Vision Enabled" badge** when image is selected
- 🔭 **Crosshair cursor** in inspect mode
- ✨ **Smooth animations** on appearance/disappearance

### Console Logs

When you click an image:
```
🖼️ Image Selected for Vision Analysis:
   Label: Sample cat image for vision testing
   Dimensions: 400×300
   
❓ User Question: (your prompt)
   Context: Image vision analysis requested

✅ AI Response:
   This is a beautiful picture of... (Qwen's analysis)
```

---

## Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| "Model not found" error | `ollama pull qwen-vision-max-latest` |
| No response when clicking image | Check browser console for errors |
| CORS error on canvas | Use smaller images (<5MB) |
| Slow responses | Disable screenshot capture temporarily |

---

## Test Commands

### Direct Model Test (Browser Console)

```javascript
// Run this in browser DevTools:
async function quickVisionTest() {
  const img = document.querySelector('img')?.firstElementChild;
  
  // Get image data
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  const [header, base64] = dataUrl.split(',');
  
  // Send to Qwen
  const response = await fetch('http://127.0.0.1:1234/api/chat', {
    method: 'POST',
    body: new FormData([
      ['model', 'qwen-vision-max-latest'],
      ['prompt', 'Describe this image in detail.'],
      ['image', base64, `image.${header.split(':')[1].split(';')[0]}`],
    ]),
  });
  
  const result = await response.json();
  console.log(result.message?.content);
}

quickVisionTest();
```

---

## Recommended Questions for Testing

Once vision is working, try asking:

```
"What objects are visible in this image?"
"Describe the colors and their arrangement"
"What is happening in the scene?"
"Do you see any people or animals?"
"Are there any text elements or labels?"
```

---

## Files Created for Qwen Testing

| File | Purpose |
|------|---------|
| `example-app-qwen.tsx` | Copy to App.tsx for immediate testing |
| `TEST-qwen-setup.md` | Step-by-step testing guide |
| `EXAMPLE-qwen-test.md` | Comprehensive examples |
| `test-qwen-vision.ts` | Configuration reference |
| `setup-qwen.sh` | Automated setup script |
| `.qwen-test.config.js` | Quick config file |

---

## Expected Response Format

Qwen will return:

```json
{
  "message": {
    "content": "This image shows a beautiful landscape..."
  }
}
```

Shake Cursor automatically formats and displays this in the panel.

---

**Need help?** Check `TEST-qwen-setup.md` for detailed guides!

EOF
echo "Created QUICK_START-qwen.md"