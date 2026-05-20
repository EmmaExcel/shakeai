/**
 * Shake Cursor Qwen Vision Test Configuration
 * 
 * This config file is for testing with Qwen/Qwen3.5-9b at http://127.0.0.1:1234
 */

export default {
  // Quick test endpoint
  apiBaseUrl: 'http://127.0.0.1:1234/api/chat',
  
  // Qwen model name (change if you have a different one)
  qwenModelName: 'qwen-vision-max-latest',
  
  // Test mode - disables screenshot capture to save resources
  testMode: true,
  
  debug: {
    logRequests: false,      // Set true to see raw API calls
    logResponses: false,     // Set true to see raw responses
    logErrors: true,         // Always show errors
  },
  
  // CORS settings for testing (may need adjustment)
  cors: {
    allowLocal: true,        // Allow local development requests
  }
}
