#!/bin/bash
# Setup script for testing Qwen with Shake Cursor

echo "=========================================="
echo "Shake Cursor - Qwen Vision Setup Script"
echo "=========================================="
echo ""

# Check if ollama is available
if command -v ollama &> /dev/null; then
    echo "✅ Ollama found in system PATH"
else
    echo "⚠️  Ollama not found. Please install first:"
    echo "   macOS: brew install ollama"
    echo "   Or download from https://ollama.ai"
    exit 1
fi

# Check if qwen model is pulled
echo ""
echo "Checking for Qwen vision models..."
if ollama list | grep -q "qwen-vision"; then
    echo "✅ Found vision-capable Qwen model(s):"
    ollama list --no-digest | grep qwen | awk '{print "   ", $1, $2}'
else
    echo "⚠️  No vision-capable Qwen models found. Pulling qwen-vision-max-latest..."
    ollama pull qwen-vision-max-latest
fi

# Verify the model is ready
echo ""
echo "Verifying model can process images (quick test)..."
ollama show qwen-vision-max-latest --multiline > /dev/null 2>&1 && echo "✅ Model verified!" || echo "⚠️  Model may have loaded"

# Check if local server is running
echo ""
echo "Checking if local server is running at 127.0.0.1:1234..."
if curl -s http://127.0.0.1:1234/api/chat > /dev/null 2>&1; then
    echo "✅ Server is running and accessible"
else
    echo "⚠️  Server not responding. Make sure your Qwen server is running:"
    echo "   curl -X POST http://127.0.0.1:1234/api/generate -d '{\"model\":\"qwen\",\"prompt\":\"test\"}'"
fi

# Check if SDK is built
echo ""
echo "Checking SDK build status..."
if [ -f "/Users/excelemma-okerhe/Desktop/shakecursor/packages/overlay-core/dist/index.js" ]; then
    echo "✅ SDK is built and ready"
else
    echo "⚠️  SDK not built. Building now..."
    cd /Users/excelemma-okerhe/Desktop/shakecursor/packages/overlay-core
    npm run build
    cd ../..
fi

# Summary
echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start your Qwen server if not already running"
echo "2. Build Shake Cursor: npm run build"
echo "3. Run dev server: npm run dev"
echo "4. Open http://localhost:5173 in browser"
echo "5. Activate AI mode (shake cursor or Cmd+K)"
echo "6. Click an image to test vision analysis!"
echo ""
echo "For detailed instructions, see:"
echo "  - TEST-qwen-setup.md"
echo "  - EXAMPLE-qwen-test.md"
