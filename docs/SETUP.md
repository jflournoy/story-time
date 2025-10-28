# Story Time Setup Guide

Complete setup instructions for Story Time - AI-assisted narrative development.

## Prerequisites

### Required

- **Node.js** >= 22.0.0
- **npm** (comes with Node.js)
- **Ollama** for local LLM inference

### Recommended

- **Git** for version control
- **VSCode** or similar IDE with TypeScript support

## Installation

### 1. Install Ollama

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Or download from https://ollama.com/download
```

### 2. Pull a Model

```bash
# Recommended for getting started (fast, good quality)
ollama pull llama3:8b

# Or other options:
ollama pull llama3:70b      # Better quality, requires more RAM
ollama pull qwen2.5:14b     # Excellent for creative writing
ollama pull mistral:7b      # Fast alternative
```

### 3. Clone and Install Story Time

```bash
# Clone repository
git clone https://github.com/jflournoy/story-time.git
cd story-time

# Install dependencies
npm install
```

### 4. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env to configure (optional)
nano .env
```

**Key configuration options:**

```env
# Server port
PORT=3000

# Ollama settings
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3:8b
```

## Running Story Time

### Development Mode

```bash
# Start backend in watch mode
npm run dev

# Or separately:
npm run backend:dev
```

The server will start on `http://localhost:3000`

### Open the Frontend

Open `frontend/public/index.html` in your web browser:

```bash
# macOS
open frontend/public/index.html

# Linux
xdg-open frontend/public/index.html

# Or just open it manually in your browser
```

## Verify Installation

### 1. Check Ollama

```bash
# List available models
ollama list

# Test model
ollama run llama3:8b "Write a short sentence"
```

### 2. Check Backend

```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/api
```

### 3. Test Operations

```bash
# Test expand operation
curl -X POST http://localhost:3000/api/text/expand \
  -H "Content-Type: application/json" \
  -d '{"text":"The old house stood alone."}'
```

## Development

### Build for Production

```bash
# Build backend
npm run build

# Start production server
npm start
```

### Run Tests

```bash
# Run all tests
npm test

# Run backend tests
npm run backend:test

# Watch mode
npm run backend:test:watch
```

### Project Structure

```
story-time/
├── backend/
│   ├── src/
│   │   ├── api/              # API routes and controllers
│   │   ├── services/         # Business logic (LLM service)
│   │   ├── models/           # TypeScript types
│   │   ├── config/           # Configuration
│   │   └── index.ts          # Server entry point
│   ├── tests/                # Backend tests
│   └── tsconfig.json         # TypeScript config
├── frontend/
│   ├── public/
│   │   └── index.html        # Simple HTML frontend
│   └── src/                  # Future: React/Vue components
├── docs/                     # Documentation
├── .env.example              # Environment template
└── package.json              # Dependencies and scripts
```

## Troubleshooting

### Ollama Not Running

```bash
# Check if Ollama is running
ps aux | grep ollama

# Start Ollama (if not running)
ollama serve
```

### Port Already in Use

```bash
# Change port in .env
PORT=3001

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Model Not Found

```bash
# List downloaded models
ollama list

# Pull the model you want
ollama pull llama3:8b
```

### CORS Errors

The backend has CORS enabled by default. If you're running the frontend from a different origin, make sure the backend is running and accessible.

### TypeScript Errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript version
npx tsc --version
```

## Next Steps

- Read [API.md](./API.md) for API documentation
- Check [GitHub Issues](https://github.com/jflournoy/story-time/issues) for development roadmap
- See [CLAUDE.md](../CLAUDE.md) for AI-assisted development guidelines

## Using Different Models

To use a different Ollama model:

```bash
# 1. Pull the model
ollama pull qwen2.5:14b

# 2. Update .env
OLLAMA_MODEL=qwen2.5:14b

# 3. Restart server
```

### Recommended Models

| Model | Size | Best For | Speed |
|-------|------|----------|-------|
| llama3:8b | 4.7GB | General use, fast | ⚡⚡⚡ |
| llama3:70b | 40GB | Best quality | ⚡ |
| qwen2.5:14b | 9GB | Creative writing | ⚡⚡ |
| mistral:7b | 4.1GB | Fast, efficient | ⚡⚡⚡ |

## Custom GGUF Models

To use custom models from HuggingFace:

```bash
# 1. Download GGUF file
wget https://huggingface.co/author/model/resolve/main/model.gguf

# 2. Create Modelfile
cat > Modelfile <<EOF
FROM ./model.gguf
PARAMETER temperature 0.7
EOF

# 3. Import to Ollama
ollama create my-model -f Modelfile

# 4. Use in Story Time
# Update .env: OLLAMA_MODEL=my-model
```

## Support

- Issues: https://github.com/jflournoy/story-time/issues
- Ollama Docs: https://ollama.com/docs
