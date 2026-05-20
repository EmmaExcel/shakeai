/**
 * Shake Cursor - App Component for Testing Qwen Vision
 * 
 * Replace this content in your App.tsx to test with Qwen/Qwen3.5-9b
 */

import { AIOverlay } from '@emmaexcel/shakecursor'

function App() {
  // ============================================
  // QWEN VISION MODEL CONFIGURATION FOR TESTING
  // ============================================
  
  AIOverlay.init({
    // API endpoint - your local server
    siteKey: 'pk_test_qwen_vision',
    apiBaseUrl: 'http://127.0.0.1:1234/api/chat',
    
    trigger: {
      shake: true,              // Enable shake activation
      keyboardShortcut: 'mod+k',// Cmd/Ctrl+K to toggle AI
    },
    
    selection: {
      text: true,               // Allow text selection
      images: true,             // Enable image vision analysis
      elements: true,           // Allow element selection
      blockedSelectors: [
        'input[type="password"]',
        '[data-ai-private]',
        '.no-selection',
      ],
    },
    
    theme: {
      primaryColor: '#ff6b6b',  // Pink for Qwen branding
      borderRadius: 12,
      fontFamily: ['Monaco', 'Menlo', 'Consolas', 'sans-serif'],
    },
    
    // ============================================
    // 🎯 IMPORTANT: QWEN VISION MODEL CONFIG
    // ============================================
    
    model: {
      provider: 'ollama',              // Ollama-compatible endpoint
      endpoint: 'http://127.0.0.1:1234/api/chat',
      
      // Change this to your specific Qwen model name:
      model: 'qwen-vision-max-latest', // Or: qwen2.5-vision, qwen3.5-9b
      
      // Vision capabilities - must be enabled for image analysis
      visionEnabled: true,
      
      // Region suggestions (disable if not supported by your model)
      suggestRegions: false,           // Set to true if supported
      
      // Screenshot capture (optional - disable for testing)
      screenshotCapture: {
        enabled: false,                // Disable to reduce load during testing
      },
      
      // Model parameters (adjust based on your needs)
      temperature: 0.7,               // Creativity level
      maxTokens: 2000,                 // Response length
      timeout: 60000,                  // Timeout in ms
    },
    
    theme: {
      primaryColor: '#ff6b6b',
      borderRadius: 12,
    },

    // ============================================
    // EVENT CALLBACKS FOR TESTING
    // ============================================
    
    onActivate: ({ shakeCount = 0 }) => {
      console.log('🚀 Qwen Vision Mode Activated!')
      console.log(`   Shakes this time: ${shakeCount}`)
      console.log(`   Model: qwen-vision-max-latest`)
      console.log(`   Endpoint: http://127.0.0.1:1234/api/chat`)
    },

    onSelection: (selection) => {
      if (selection.kind === 'image') {
        console.log('\n🖼️ Image Selected for Vision Analysis:')
        console.log(`   Label: ${selection.label}`)
        console.log(`   Dimensions: ${selection.width?.toFixed(0)}×${selection.height?.toFixed(0)}`)
      } else if (selection.kind === 'text') {
        console.log('\n📝 Text Selected:')
        console.log(`   Length: ${selection.content?.length || 0} chars`)
      } else if (selection.kind === 'element') {
        console.log('\n📐 Element Selected:')
        console.log(selection.label)
      }
    },

    onAsk: ({ question, selection }) => {
      console.log('\n❓ User Question:', question)
      
      if (selection?.kind === 'image') {
        console.log('   Context: Image vision analysis requested')
        console.log(`   Model will analyze image + text prompt`)
      }
    },

    onResponse: (response, payload) => {
      console.log('\n✅ AI Response:')
      
      // Pretty print if response is object
      if (typeof response === 'string') {
        const lines = response.split('\n').filter(line => line.trim())
        lines.forEach(line => {
          // Highlight region suggestions
          if (/\[x:\d+,y:\d+,w:\d+,h:\d+\]/.test(line)) {
            console.log('   🎯 Region:', line)
          } else {
            console.log('   ', line)
          }
        })
      } else {
        console.log(JSON.stringify(response, null, 2))
      }
    },

    onError: (error) => {
      console.error('\n❌ Error:', error.message)
      
      // Helpful error messages for Qwen testing
      if (error.message.includes('404')) {
        console.log('   🔧 Fix: Model not loaded in Ollama')
        console.log('   Run: ollama pull qwen-vision-max-latest')
      } else if (error.message.includes('503')) {
        console.log('   🔧 Fix: Server overloaded, try again later')
      } else if (error.message.includes('timeout')) {
        console.log('   🔧 Fix: Increase timeout in model config')
      } else if (error.message.includes('CORS')) {
        console.log('   🔧 Fix: Enable CORS or use different image source')
      }
    },

    onInspect: ({ element, inspectionData }) => {
      if (element) {
        console.log('\n🔍 Element Inspected:')
        console.log(`   Tag: <${inspectionData.tagName}>`)
        
        // Show first few classes
        const classes = inspectionData.className?.slice(0, 3).join(', ') || 'none'
        console.log(`   Classes: ${classes}`)
        
        if (inspectionData.id) {
          console.log(`   ID: ${inspectionData.id}`)
        }
      }
    },

    onDeactivate: () => {
      // Optionally clean up resources here
      console.log('\n🔴 Qwen Vision Mode Deactivated')
    },
  })

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh' }}>
      {/* Main content area */}
      <header style={{ 
        padding: '4rem 2rem', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <h1>Shake Cursor Test</h1>
        <p>Testing Qwen/Qwen3.5-9b Vision Capabilities</p>
      </header>

      <main style={{ padding: '2rem' }}>
        {/* Demo images for testing */}
        <section style={{ marginBottom: '4rem' }}>
          <h2>🖼️ Test Image Clicks</h2>
          <p style={{ color: '#666' }}>Click any image below to test vision analysis:</p>
          
          {/* Sample images - these will be captured for vision analysis */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <img 
              src="https://picsum.photos/id/237/400/300" 
              alt="Sample cat image for vision testing"
              style={{ width: '100%', borderRadius: '8px', cursor: 'pointer' }}
              data-test-id="test-image-1"
            />
            <img 
              src="https://picsum.photos/id/235/400/300" 
              alt="Sample dog image for vision testing" 
              style={{ width: '100%', borderRadius: '8px', cursor: 'pointer' }}
              data-test-id="test-image-2"
            />
            <img 
              src="https://picsum.photos/id/1065/400/300" 
              alt="Sample architecture image for vision testing"
              style={{ width: '100%', borderRadius: '8px', cursor: 'pointer' }}
              data-test-id="test-image-3"
            />
          </div>

          <p style={{ marginTop: '2rem', color: '#666' }}>
            <strong>Tip:</strong> Click an image to see vision analysis!
            Then try pressing the "i" key for element inspection mode.
          </p>
        </section>

        {/* Text content area */}
        <section style={{ marginBottom: '4rem' }}>
          <h2>📝 Test Text Selection</h2>
          <div 
            style={{ 
              padding: '2rem', 
              background: '#f7f9fc',
              borderRadius: '8px',
              lineHeight: '1.6'
            }}
            data-test-id="test-text"
          >
            Select any text in this paragraph to test the text selection functionality.
            Shake cursor or press Ctrl+K to activate AI overlay mode.
            Once active, use the "i" key to enter element inspection mode.
          </div>
        </section>

        {/* Test buttons */}
        <section>
          <h2>🎯 Test Buttons</h2>
          <p style={{ color: '#666' }}>Test element selection with buttons:</p>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              style={{ 
                padding: '0.75rem 1.5rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer' 
              }}
              data-test-id="test-button-1"
            >
              Test Button 1
            </button>
            <button 
              style={{ 
                padding: '0.75rem 1.5rem',
                background: '#764ba2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer' 
              }}
              data-test-id="test-button-2"
            >
              Test Button 2
            </button>
            <button 
              style={{ 
                padding: '0.75rem 1.5rem',
                background: '#845ef7',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer' 
              }}
              data-test-id="test-button-3"
            >
              Test Button 3
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ 
        padding: '2rem', 
        textAlign: 'center',
        background: '#f7f9fc',
        color: '#666'
      }}>
        <p>Shake Cursor Test Environment</p>
        <p>Testing Qwen/Qwen3.5-9b Vision Capabilities</p>
      </footer>
    </div>
  )
}

export default App
