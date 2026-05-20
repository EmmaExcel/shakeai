# Shake Cursor SDK - Upgrade Guide

## 🎉 What's New in This Version

### Core Improvements

#### 1. **Enhanced Security** ✅
- **Rate Limiting**: `/v1/ask` endpoint now limits to 5 requests per second per site (with burst capacity of 10)
- **Input Sanitization**: All user inputs are sanitized before processing (max 1000 chars, removed dangerous chars)
- **Error Logging Separation**: Errors logged to separate `.errors.jsonl` file instead of main query log

#### 2. **Performance Optimizations** ✅
- **Debounced Shake Detection**: Prevents rapid-fire triggers with 5ms debounce
- **Increased Gesture Threshold**: Harder to accidentally shake (8 samples, 4 reversals, 360px distance)
- **Throttled Cursor Tracking**: Limits pointer move processing to prevent CPU spikes
- **Smart Hysteresis**: Prevents trigger during cooldown period

#### 3. **Developer Experience** ✅
- **Comprehensive Type Definitions**: New `types.ts` with full TypeScript interfaces
- **Utility Functions Added**:
  - `debounce()` / `throttle()` for performance control
  - `safeJsonParse()` for robust parsing
  - `generateId()` for unique session IDs
  - `formatBytes()` for size formatting
  - `extractElementContent()` for text extraction
- **Better Error Messages**: All API errors now include descriptive messages

#### 4. **API Improvements** ✅
- **Response Time Tracking**: Each response includes `metadata.responseTimeMs`
- **Error Recovery**: Graceful error handling with detailed stack traces logged
- **Timeout Wrappers**: Model calls now have 30-second timeout protection

---

## 📂 New Files Created

### Type Definitions
```bash
packages/overlay-core/src/types.ts      # Comprehensive type interfaces
```

### Utility Functions
```bash
packages/overlay-core/src/utils.ts     # Debounce, throttle, helpers
packages/overlay-core/src/shake.ts     # Enhanced gesture detection
```

### Server Enhancements
```bash
server/rate-limiter.mjs                 # In-memory rate limiter
server/api-server.mjs (modified)        # Rate limiting + error handling
```

### Documentation
```bash
IMPROVEMENTS.md                         # Priority improvement plan
UPGRADE_GUIDE.md                        # This file
```

---

## 🚀 Quick Start for Developers

### 1. Setup Development Environment

```bash
cd /Users/excelemma-okerhe/Desktop/shakecursor

# Install dependencies (if not already done)
pnpm install

# Start dev server with API
pnpm dev
pnpm dev:api
```

### 2. Configure Model Backend

**Option A: Ollama (Recommended for local)**
```bash
# Start Ollama
ollama serve

# Pull a model (e.g., qwen3-coder:free)
ollama pull qwen3-coder:free

# Update .env.example
OPENROUTER_API_KEY=""  # Optional
GEMINI_API_KEY=""      # Optional
PORT=8787              # API server port
```

**Option B: OpenRouter (Production)**
```bash
export OPENROUTER_API_KEY="your-api-key"
export OPENROUTER_REFERER="https://yourdomain.com"
pnpm dev:api
```

**Option C: Gemini API**
```bash
export GEMINI_API_KEY="your-api-key"
pnpm dev:api
```

### 3. Run the Demo Application

```bash
# Terminal 1 - Start API server
pnpm dev:api

# Terminal 2 - Start Vite dev server  
pnpm dev

# Open http://localhost:5173 and navigate to Admin tab
```

---

## 🛠️ Using the SDK in Your Own Site

### Basic Installation

```html
<script type="module">
  import { AIOverlay } from './overlay-core/dist/overlay-core.js'

  AIOverlay.init({
    siteKey: 'pk_YOUR_SITE_KEY',
    apiBaseUrl: 'http://localhost:8787', // or your production endpoint
    
    trigger: {
      shake: true,
      keyboardShortcut: 'mod+k',
    },
    
    selection: {
      blockedSelectors: [
        'input[type="password"]',
        '[data-ai-private]'
      ],
    },
    
    theme: {
      primaryColor: '#6366f1',
      borderRadius: 8,
    },
  })
</script>
```

### Advanced Configuration

```javascript
AIOverlay.init({
  siteKey: 'pk_your_site_key',
  apiBaseUrl: 'https://your-api.example.com',
  
  trigger: {
    shake: true,
    keyboardShortcut: 'mod+k',
    shakeCooldownMs: 1200,      // Prevent rapid triggers
    minSamples: 8,              // Gesture sensitivity
    minReversals: 4,            // Zigzag threshold
  },
  
  selection: {
    blockedSelectors: [
      'input[type="text"]',
      '[data-ai-private]',
      '.ads',
      '[class*="popup"]'
    ],
  },
  
  theme: {
    primaryColor: '#6366f1',      // Accent color
    borderRadius: 8,              // Rounded corners
    backgroundColor: '#ffffff',   // Background
  },
  
  events: {
    onActivate: (options) => console.log('Shake detected!', options),
    onSelection: (selection) => console.log('Selected:', selection.kind),
    onAsk: ({ question, selection }) => {
      console.log('Question:', question)
      // Optional: show loading state here
    },
    onResponse: (response) => {
      console.log('AI Answer:', response.answer)
    },
    onError: (error) => {
      console.error('AI Error:', error.message)
    },
  },
})
```

---

## 🔍 Admin API Documentation

### Sites Management

**List all registered sites:**
```bash
curl http://localhost:8787/admin/sites \
  -H "Authorization: Bearer shake-debug-token"
```

**Create a new site:**
```bash
curl -X POST http://localhost:8787/admin/sites \
  -H "Authorization: Bearer shake-debug-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Website",
    "siteId": "mysite-123",
    "allowedOrigins": ["https://mysite.com"],
    "model": {
      "provider": "gemini",
      "endpoint": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      "model": "gemini-2.5-flash"
    },
    "rag": {
      "enabled": true,
      "topK": 4,
      "indexPath": "./server/data/my-docs.vectors.json"
    }
  }'
```

**Update a site:**
```bash
curl -X PUT http://localhost:8787/admin/sites/pk_abc123 \
  -H "Authorization: Bearer shake-debug-token" \
  -H "Content-Type: application/json" \
  -d '{
    "allowedOrigins": ["https://newsite.com"]
  }'
```

### Query Logs

**Get all queries:**
```bash
curl http://localhost:8787/admin/queries \
  -H "Authorization: Bearer shake-debug-token"
```

**Get queries for a specific site:**
```bash
curl "http://localhost:8787/admin/queries?siteKey=pk_abc123" \
  -H "Authorization: Bearer shake-debug-token"
```

---

## 📊 RAG (Retrieval Augmented Generation) Setup

### Vector Index Format

The RAG system expects a JSON file with the following structure:

```json
[
  {
    "id": "chunk-001",
    "title": "Chapter 1 Introduction",
    "url": "https://example.com/article#chapter1",
    "content": "...full text content here...",
    "vector": [0.1, -0.2, 0.3, ...],  // Embedding vector from nomic-embed-text
    "metadata": {
      "createdAt": "2024-01-15",
      "section": "intro"
    }
  },
  ...
]
```

### Creating Vector Index

```bash
# Install Ollama embeddings model
ollama pull nomic-embed-text

# Example: Create vector index from a file
node ./server/scripts/create-vector-index.mjs \
  --input ./server/data/articles.jsonl \
  --output ./server/data/vectors.json \
  --model qwen3-coder:free
```

---

## 🧪 Testing Rate Limiting

```bash
# This will trigger rate limiting after 5 requests in 1 second
for i in {1..10}; do
  curl -X POST http://localhost:8787/v1/ask \
    -H "x-site-key: pk_demo" \
    -H "Content-Type: application/json" \
    -d '{
      "question": "test",
      "selection": {"kind": "text", "label": "test"}
    }' &
done
```

**Expected Response After Rate Limit:**
```json
{
  "error": "Rate limit exceeded. Please wait before asking another question."
}
```

---

## 🔧 Common Issues & Solutions

### Issue: API returns CORS errors

**Solution:** Ensure your site is in `allowedOrigins` list of the site config.

### Issue: Shake gesture doesn't trigger

**Solutions:**
1. Try harder, faster shake (needs 8 samples with 4 reversals)
2. Check you're on a touchpad/mouse (not just scrolling)
3. Clear browser cache and reload

### Issue: Model calls timeout

**Solution:** Increase timeout in model config or use faster model.

---

## 📈 Next Steps for Production

1. **Database Migration**: Replace JSON file storage with SQLite/PostgreSQL
   ```bash
   npm install better-sqlite3
   # Or use a proper ORM like Prisma
   ```

2. **Redis Caching**: Add Redis for session management and rate limiting
   
3. **Production Monitoring**: Add Sentry or similar error tracking

4. **Analytics Dashboard**: Build usage analytics with usage metrics

5. **Dockerization**: Create `Dockerfile` and `docker-compose.yml`

---

## 📝 Changelog

### Version 1.0.0 (Current)
- ✅ Rate limiting on ask endpoint
- ✅ Input sanitization
- ✅ Enhanced gesture detection with hysteresis
- ✅ Debounced pointer tracking
- ✅ Comprehensive type definitions
- ✅ Utility function library
- ✅ Response time tracking
- ✅ Separate error logging

### Upcoming Versions

**1.0.1**: 
- [ ] Image upload support for Gemini
- [ ] Conversation history persistence
- [ ] Admin dashboard UI

**1.1.0**:
- [ ] Vector database integration (Pgvector)
- [ ] Multi-turn conversation context
- [ ] Export conversations feature

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📚 Learn More

- **TypeScript Types**: `packages/overlay-core/src/types.ts`
- **API Documentation**: See `server/api-server.mjs` comments
- **Shake Detection Algorithm**: `packages/overlay-core/src/shake.ts`
- **Rate Limiting Implementation**: `server/rate-limiter.mjs`

---

Made with ❤️ for developers who want contextual AI assistance on any website.
