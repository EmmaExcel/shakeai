/**
 * Shake Cursor Vision & Inspection Example
 * 
 * This example demonstrates how to set up Shake Cursor with:
 * - Vision-enabled image analysis
 * - Element inspection mode
 * - Region suggestions
 */

import { AIOverlay, ElementInspector } from '@emmaexcel/shakecursor'

// ============================================
// 1. BASIC SETUP WITH VISION MODE
// ============================================

const overlayConfig = {
  siteKey: 'pk_demo_vision', // Replace with your API key
  
  // Optional: Use your own API endpoint
  apiBaseUrl: 'https://api.openrouter.ai/v1', 
  
  trigger: {
    shake: true,           // Enable shake gesture activation
    keyboardShortcut: 'mod+k', // Cmd/Ctrl + K to toggle
  },
  
  selection: {
    text: true,            // Allow text selection
    images: true,          // Allow image selection (triggers vision analysis)
    elements: true,        // Allow element selection
    blockedSelectors: ['input[type="password"]', '[data-ai-private]'],
  },
  
  theme: {
    primaryColor: '#14b8a6',
    borderRadius: 8,
  },
  
  // 🎯 VISION MODEL CONFIGURATION
  model: {
    provider: 'openrouter',      // Or 'ollama', 'custom'
    endpoint: 'https://api.openrouter.ai/v1/chat/completions',
    model: 'gpt-4o',             // Vision-capable model
    
    // Vision-specific settings
    visionEnabled: true,         // Enable vision capabilities
    visionModel: 'gpt-4o',       // Can also use 'claude-3-opus' etc.
    
    // Region suggestions for image analysis
    suggestRegions: true,        // Enable bounding box suggestions
    
    // Screenshot capture (optional)
    screenshotCapture: {
      enabled: true,             // Enable automatic screenshots
      maxDimensions: {           // Maximum dimensions for captured images
        width: 1200,
        height: 800,
      },
      quality: 0.95,             // JPEG quality (0-1)
    }
  },
  
  theme: {
    primaryColor: '#14b8a6',
    borderRadius: 8,
  },

  // Event callbacks
  onActivate: ({ shakeCount = 0 }) => {
    console.log('✨ AI Vision Mode Activated!')
    console.log(`   Shakes this time: ${shakeCount}`)
    console.log('   Tip: Click images to analyze them with vision models!')
  },

  onSelection: (selection) => {
    if (selection.kind === 'image' && selection.data) {
      console.log(`\n🖼️ Image Selected:`)
      console.log(`   Label: ${selection.label}`)
      console.log(`   Dimensions: ${selection.width?.toFixed(0)}×${selection.height?.toFixed(0)}`)
      console.log(`   MIME Type: ${selection.mimeType}`)
    } else if (selection.kind === 'element') {
      console.log(`\n📐 Element Selected:`)
      console.log(`   Tag: ${selection.label.split(':')[0]}`)
    }
  },

  onAsk: ({ question, selection }) => {
    console.log(`\n❓ User asked: "${question}"`)
    
    if (selection.kind === 'image') {
      console.log('   Context: Image with vision analysis enabled')
    }
  },

  onResponse: (response) => {
    console.log('\n✅ Response received:')
    // Check for region suggestions in response
    const regions = Array.from(
      response.matchAll(/\[x:(\d+),y:(\d+),w:(\d+),h:(\d+)\]/g)
    )
    
    if (regions.length > 0) {
      console.log(`   🎯 Found ${regions.length} region(s):`)
      regions.forEach(([match, x, y, w, h], i) => {
        console.log(`      Region ${i+1}: [x:${x},y:${y},w:${w},h:${h}]`)
      })
    }
  },

  onError: (error) => {
    console.error('❌ Error:', error.message)
  },

  onInspect: ({ element, inspectionData }) => {
    if (element) {
      console.log('\n🔍 Element Inspected:')
      console.log(`   Tag: <${inspectionData.tagName}>`)
      console.log(`   Classes: ${inspectionData.className?.join(', ') || 'none'}`)
      console.log(`   ID: ${inspectionData.id || 'none'}`)
      
      // Show a few interesting styles
      const styleProps = Object.entries(inspectionData.computedStyle!)
        .filter(([key]) => 
          ['display', 'position', 'width', 'height', 'color', 'font-size'].includes(key)
        )
      styleProps.forEach(([prop, value]) => {
        console.log(`   Style ${prop}: ${value}`)
      })
    }
  },
}

// Initialize the overlay
AIOverlay.init(overlayConfig)

// ============================================
// 2. PROGRAMMATIC INSPECTION EXAMPLES
// ============================================

/**
 * Inspect an element at mouse coordinates
 */
document.addEventListener('click', async (event: MouseEvent) => {
  if (!AIOverlay.getInspectMode()) return
  
  try {
    const result = await AIOverlay.inspectAt(event)
    
    if (result?.inspectionData) {
      console.log('\n=== Inspected Element ===')
      console.log('Tag:', result.inspectionData.tagName)
      console.log('Classes:', result.inspectionData.className)
      console.log('ID:', result.inspectionData.id)
      
      // Get full style properties
      const inspector = ElementInspector
      const styles = inspector.getComputedStyles(
        result.element as HTMLElement
      )
      console.log('\nComputed Styles:')
      Object.entries(styles).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`)
      })
      
      // Get all attributes
      const attrs = inspector.getAttributes(result.element as HTMLElement)
      console.log('\nAttributes:')
      Object.entries(attrs).forEach(([key, value]) => {
        console.log(`  ${key}="${value}"`)
      })
    }
  } catch (error) {
    console.error('Inspection error:', error)
  }
})

// ============================================
// 3. STANDALONE INSPECTOR EXAMPLES
// ============================================

/**
 * Use ElementInspector directly for debugging or custom tools
 */
const inspectElement = async (selector: string) => {
  const element = document.querySelector(selector)
  if (!element) return console.log('Element not found')
  
  const analysis = ElementInspector.analyze(element as HTMLElement)
  
  console.log('\n=== Element Analysis ===')
  console.log('Tag:', analysis.data.tagName)
  console.log('Classes:', analysis.data.className?.join(', ') || 'none')
  console.log('ID:', analysis.data.id || 'none')
  
  // Show computed styles
  const styleProps = Object.entries(analysis.data.computedStyle!)
    .filter(([key]) => 
      ['display', 'position', 'width', 'height', 'background-color', 'color'].includes(key)
    )
  styleProps.forEach(([prop, value]) => {
    console.log(`Style ${prop}: ${value}`)
  })
  
  // Check for suggestions
  if (analysis.suggestions && analysis.suggestions.length > 0) {
    console.log('\n💡 Suggestions:')
    analysis.suggestions.forEach((suggestion, i) => {
      console.log(`  ${i+1}. ${suggestion.explanation}`)
    })
  }
  
  return analysis
}

// Example usage:
// inspectElement('#my-element')

/**
 * Get computed styles for any element
 */
const getComputedStyles = (element: HTMLElement) => {
  const styles = ElementInspector.getComputedStyles(element)
  console.log('Computed styles:', Object.keys(styles).join(', '))
}

/**
 * Get full style object (all properties)
 */
const getFullStyles = (element: HTMLElement) => {
  const styles = ElementInspector.getFullStyles(element)
  console.log('Full style object keys:', Object.keys(styles))
}

/**
 * Check if element matches selector groups
 */
const checkSelectors = (element: Element, selectors: string[]) => {
  const matches = ElementInspector.matchesSelector(element, selectors)
  console.log(`Matches "${selectors.join(', ')}":`, matches)
}

// ============================================
// 4. VISION MODEL PROVIDERS
// ============================================

/**
 * OpenRouter with GPT-4o Vision (Recommended for production)
 */
const openRouterConfig = {
  model: {
    provider: 'openrouter',
    endpoint: 'https://api.openrouter.ai/v1/chat/completions',
    model: 'gpt-4o',
    visionEnabled: true,
    suggestRegions: true,
    screenshotCapture: { enabled: false }, // Set to true if needed
  }
}

/**
 * Ollama with LLaVA Vision (Local/Low-cost option)
 */
const ollamaConfig = {
  model: {
    provider: 'ollama',
    endpoint: 'http://localhost:11434/api/chat',
    model: 'llava',          // or 'bakLLaVA', 'moondream'
    visionEnabled: true,
    suggestRegions: false,   // Not supported by LLaVA yet
  }
}

/**
 * Custom endpoint (Anthropic Claude Vision)
 */
const claudeConfig = {
  model: {
    provider: 'custom',
    endpoint: 'https://your-claude-endpoint.com/v1/chat/completions',
    model: 'claude-3-opus-20240229',
    visionEnabled: true,
    suggestRegions: true,
    headers: {
      'x-api-key': 'YOUR_API_KEY',
      'anthropic-version': '2023-06-01',
    },
  }
}

// ============================================
// 5. INSPECT MODE SHORTCUTS
// ============================================

/**
 * Press Ctrl+I (or configured shortcut) in AI mode to enter inspect mode
 */

// Custom keyboard shortcut setup (optional)
AIOverlay.init({
  ...overlayConfig,
  trigger: {
    shake: true,
    keyboardShortcut: 'mod+k', // Toggle overlay
  },
})

// ============================================
// 6. REGION SUGGESTION EXAMPLE
// ============================================

/**
 * When suggestRegions is enabled, vision models can return:
 */

type Region = {
  x: number
  y: number
  width: number
  height: number
  label: string
}

/**
 * Example response structure with regions:
 * "The image shows a building with:"
 * 
 * - [x:45,y:12,w:80,h:60] Top-left window, interior desk visible
 * - [x:150,y:90,w:75,h:55] Bottom-right window, garden outside  
 * - [x:320,y:45,w:120,h:90] Main entrance, doors open
 */

// ============================================
// 7. ERROR HANDLING
// ============================================

AIOverlay.init({
  ...overlayConfig,
  onError: (error) => {
    console.error('Vision API error:', error.message)
    
    // Common errors and fixes:
    if (error.message.includes('CORS')) {
      console.log('Fix: Ensure your API endpoint allows cross-origin requests')
    } else if (error.message.includes('timeout')) {
      console.log('Fix: Increase model timeout or use faster endpoint')
    } else if (error.message.includes('invalid image')) {
      console.log('Fix: Image may be too large or corrupted')
    }
  },
})

// ============================================
// 8. PERFORMANCE TIPS
// ============================================

/**
 * For production deployments:
 * 
 * 1. Enable vision only when needed (check selection.kind === 'image')
 * 2. Reduce screenshot maxDimensions if not capturing full page
 * 3. Use cached responses for common images
 * 4. Set appropriate model timeout based on image size
 * 5. Consider using smaller vision models (e.g., moondream) for quick analysis
 */

// ============================================
// EXPORT FOR USE IN OTHER FILES
// ============================================

export { overlayConfig }
export type { Region }
