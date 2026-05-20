# Shake Cursor SDK - Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ 
- pnpm (or npm)
- Ollama installed (optional, for local LLMs)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd /Users/excelemma-okerhe/Desktop/shakecursor
pnpm install
```

### 2. Configure Model Backend

**Option A: Using Ollama (Recommended for First-Time Setup)**

```bash
# Start Ollama server
ollama serve &

# Pull a model (choose one):
ollama pull qwen3-coder:free       # Great for code questions
ollama pull llama3.2               # Good general-purpose model
ollama pull mistral                # Balanced performance

# Verify installation
ollama list
```

**Option B: Using OpenRouter (Production-Ready)**

Get an API key from https://openrouter.ai/ and add to `.env`:

```bash
cp .env.example .env
export OPENROUTER_API_KEY="your-api-key-here"
```

### 3. Start Development Server

```bash
# Terminal 1: Start API server
pnpm dev:api

# You should see:
# Shake Cursor API listening on http://0.0.0.0:8787
# Rate limiting enabled: 5 req/s per site
```

### 4. Start React Demo App

Open a new terminal and run:

```bash
pnpm dev
```

The app will be available at http://localhost:5173

### 5. Test It Out!

In your browser at http://localhost:5173, you can now:

1. **Shake your cursor** - Move mouse in zigzag pattern to activate AI
2. **Or press Cmd/Ctrl+K** - Keyboard shortcut activation
3. **Select text or images** - Highlight content on the demo page
4. **Ask questions** - The AI will respond with contextual knowledge

## Admin Dashboard

Click "Open Admin Dashboard" button in the demo to:

- View query logs (what users are asking)
- Register new sites for your deployment
- Configure RAG indexes
- Inspect error logs

### Getting a Site Key

For testing, you can use the demo site key directly:

```javascript
siteKey: 'pk_demo_shakecursor'
```

To create custom site keys, use the admin API (see UPGRADE_GUIDE.md).

## What's Included in Your Installation?

- ✅ SDK overlay (shake detection, selection capture)
- ✅ REST API server with rate limiting
- ✅ Admin dashboard for management
- ✅ RAG support with vector embeddings
- ✅ Support for 4 model providers (Ollama, OpenRouter, Gemini, Custom)

## Next Steps

### Add Your Own Documentation to RAG

1. Create your knowledge base:

```bash
mkdir -p server/data
cat > server/data/my-docs.vectors.json << 'EOF'
[
  {
    "id": "doc-1",
    "title": "My Product Guide",
    "url": "https://example.com/docs",
    "content": "Information about my product...",
    "vector": [0.1, 0.2, 0.3],
    "metadata": { createdAt: "now" }
  }
]
EOF
```

2. Register the site with RAG enabled via admin API

### Deploy to Production

See `UPGRADE_GUIDE.md` for deployment options.

## Troubleshooting

### Cursor shake doesn't work?

1. Try moving mouse faster (harder gesture)
2. Clear browser cache and reload
3. Check if cursor movement is being blocked by another app

### AI responses are slow?

- Make sure Ollama is running: `ollama list`
- Check network if using OpenRouter
- Increase timeout in model config

### CORS errors?

Ensure your site origin is in the `allowedOrigins` array when registering via admin API.

## Need Help?

- **API Documentation**: See `UPGRADE_GUIDE.md`
- **Improvement Roadmap**: See `IMPROVEMENTS.md`
- **Changelog**: See `CHANGELOG.md`

## What Comes Next? (Roadmap)

Coming in future versions:

- Database-backed conversation history
- Image upload for advanced multimodal models
- Admin UI dashboard with analytics
- Docker Compose production deployment
- npm package publishing

Happy shaking! 🖱️✨
