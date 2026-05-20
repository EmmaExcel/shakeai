/**
 * Shake Cursor Test Configuration for Qwen/Qwen3.5-9b Vision Model
 * 
 * This file demonstrates testing vision capabilities with a local Qwen model
 */

import { AIOverlay } from '@emmaexcel/shakecursor'

// ============================================
// OPTION 1: Using Ollama-style API (most likely)
// ============================================

const testConfig = {
  siteKey: 'pk_qwen_vision_test', // Demo key - replace with your own
  
  apiBaseUrl: 'http://127.0.0.1:1234/api/chat',
  
  trigger: {
    shake: true,
    keyboardShortcut: 'mod+k',
  },
  
  selection: {
    text: true,
    images: true,     // Enable image vision analysis
    elements: true,
    blockedSelectors: [
      'input[type="password"]',
      '[data-ai-private]',
      '[data-ai-overlay-ignore]',
      '.no-selection',
    ],
  },
  
  theme: {
    primaryColor: '#ff6b6b',   // Pink to match Qwen branding
    borderRadius: 12,
    fontFamily: ['Monaco', 'Menlo', 'Consolas', 'sans-serif'],
  },

  // 🎯 QWEN VISION MODEL CONFIGURATION
  model: {
    provider: 'ollama',              // Ollama-compatible endpoint
    endpoint: 'http://127.0.0.1:1234/api/chat',
    model: 'qwen-vision-max-latest', // Qwen vision model name
    
    // Vision capabilities
    visionEnabled: true,
    suggestRegions: false,           // May not be supported by Qwen
    screenshotCapture: {
      enabled: false,                // Disable for now to reduce load
    }
  },
  
  theme: {
    primaryColor: '#ff6b6b',
    borderRadius: 12,
  },

  // Event callbacks for debugging
  onActivate: ({ shakeCount = 0 }) => {
    console.log('🚀 Qwen Vision Mode Activated!')
    console.log(`   Shakes: ${shakeCount}`)
    console.log(`   Model: qwen-vision-max-latest`)
    console.log('   Tip: Click any image to test vision analysis')
  },

  onSelection: (selection) => {
    if (selection.kind === 'image') {
      console.log('\n🖼️ Image Selected for Vision Analysis:')
      console.log(`   Label: ${selection.label}`)
      console.log(`   Dimensions: ${selection.width?.toFixed(0)}×${selection.height?.toFixed(0)}`)
      
      // Show image metadata
      if (selection.data) {
        const header = selection.data.split(',')[0]
        const mimeType = header.split(':')[1].split(';')[0]
        console.log(`   MIME Type: ${mimeType}`)
      }
    } else if (selection.kind === 'text') {
      console.log('\n📝 Text Selected:')
      console.log(`   First 200 chars: ${selection.content?.substring(0, 200)}...`)
    } else if (selection.kind === 'element') {
      console.log('\n📐 Element Selected:')
      const tagMatch = selection.label.match(/^(button|div|h1|h2|h3|span|img|a):/i)
      console.log(`   Type: ${tagMatch ? tagMatch[0] : selection.label}`)
    }
  },

  onAsk: ({ question, selection }) => {
    console.log('\n❓ User Question:', question)
    
    if (selection.kind === 'image') {
      console.log('   Context: Image vision analysis requested')
      console.log(`   Model will analyze image + text`)
    }
  },

  onResponse: (response, payload) => {
    console.log('\n✅ AI Response:')
    const lines = response.split('\n')
    lines.forEach(line => {
      if (line.trim()) {
        // Highlight region suggestions
        if (/\[x:\d+,y:\d+,w:\d+,h:\d+\]/.test(line)) {
          console.log(`   🎯 ${line}`)
        } else {
          console.log(`   ${line}`)
        }
      }
    })
    
    // Check for region suggestions
    const regions = Array.from(response.matchAll(/\[x:(\d+),y:(\d+),w:(\d+),h:(\d+)\]/g))
    if (regions.length > 0) {
      console.log(`\n📍 Found ${regions.length} region(s):`)
      regions.forEach(([match, x, y, w, h], i) => {
        console.log(`   Region ${i+1}: [x:${x},y:${y},w:${w},h:${h}]`)
      })
    }
  },

  onError: (error) => {
    console.error('\n❌ Error:', error.message)
    
    // Common Qwen errors and fixes
    if (error.message.includes('404')) {
      console.log('\n   🔧 Fix: Check that the model is loaded in Ollama')
      console.log('   Run: ollama pull qwen-vision-max-latest')
    } else if (error.message.includes('503')) {
      console.log('\n   🔧 Fix: Server may be overloaded, try again later')
    } else if (error.message.includes('timeout')) {
      console.log('\n   🔧 Fix: Consider increasing timeout in model config')
      console.log('   Add: timeout: 120000 (120 seconds)')
    } else if (error.message.includes('invalid image')) {
      console.log('\n   🔧 Fix: Image may be too large or corrupted')
    }
  },
}

// Initialize with Qwen configuration
AIOverlay.init(testConfig)

console.log('\n========================================')
console.log('Qwen Vision Test Mode Started!')
console.log('========================================\n')
console.log('📋 How to Test:')
console.log('   1. Open this page in your browser')
console.log('   2. Shake cursor or press Cmd/Ctrl+K')
console.log('   3. Click any image to test vision analysis')
console.log('   4. Press "i" key while active for inspect mode')
console.log('========================================\n')

// ============================================
// TEST MODE: Quick function calls
// ============================================

/**
 * Test vision model directly without overlay
 */
async function testVisionModel() {
  const formData = new FormData()
  
  // Add your Qwen API parameters
  formData.append('model', 'qwen-vision-max-latest')
  formData.append('stream', 'false')
  
  // Your question about an image
  formData.append('prompt', 'Please describe this image in detail.')
  
  const endpoint = 'http://127.0.0.1:1234/api/chat'
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error(`Qwen API returned ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Direct vision model test:')
    console.log(JSON.stringify(data, null, 2))
    
    return data
  } catch (error) {
    console.error('Direct test failed:', error.message)
    throw error
  }
}

/**
 * Test with custom image upload
 */
async function testWithImage(imageElement: HTMLImageElement) {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = imageElement.naturalWidth
    canvas.height = imageElement.naturalHeight
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      console.error('Could not get canvas context')
      return
    }
    
    ctx.drawImage(imageElement, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    
    const formData = new FormData()
    formData.append('model', 'qwen-vision-max-latest')
    formData.append('prompt', 'Describe this image')
    
    // Extract base64 data
    const [header, base64Data] = dataUrl.split(',')
    formData.append('image', base64Data, `image.${header.split(':')[1].split(';')[0]}`)
    
    const response = await fetch('http://127.0.0.1:1234/api/chat', {
      method: 'POST',
      body: formData,
    })
    
    if (response.ok) {
      return await response.json()
    } else {
      throw new Error(`Failed: ${response.status}`)
    }
  } catch (error) {
    console.error('Image test failed:', error)
    throw error
  }
}

/**
 * Test with specific question about an image
 */
async function testWithQuestion(
  imageElement: HTMLImageElement, 
  question: string
) {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = imageElement.naturalWidth
    canvas.height = imageElement.naturalHeight
    const ctx = canvas.getContext('2d')
    
    if (!ctx) throw new Error('No canvas context')
    
    ctx.drawImage(imageElement, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    const [header, base64Data] = dataUrl.split(',')
    
    const formData = new FormData()
    formData.append('model', 'qwen-vision-max-latest')
    formData.append('prompt', question)
    formData.append('image', base64Data, `image.${header.split(':')[1].split(';')[0]}`)
    
    const response = await fetch('http://127.0.0.1:1234/api/chat', {
      method: 'POST',
      body: formData,
    })
    
    if (response.ok) {
      const result = await response.json()
      return result
    }
    
  } catch (error) {
    console.error('Question test failed:', error)
  }
  
  return null
}

export { testConfig, testVisionModel, testWithImage, testWithQuestion }
