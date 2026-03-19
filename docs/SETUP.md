# Story Time Setup Guide

Complete setup instructions for Story Time - AI-assisted narrative development.

## Prerequisites

### Required

- **Node.js** >= 22.0.0
- **npm** (comes with Node.js)
- **Python** >= 3.10 (for the llama.cpp LLM service)

### Recommended

- **Git** for version control
- **VSCode** or similar IDE with TypeScript support

## Installation

### 1. Install Python Dependencies

```bash
cd services

# Install with pip
pip install -r requirements.txt

# Or with uv (faster)
uv pip install -r requirements.txt
```

### 2. Clone and Install Story Time

```bash
# Clone repository
git clone https://github.com/jflournoy/story-time.git
cd story-time

# Install dependencies
npm install
```

### 3. Configure Environment

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

# LLM service settings
LLM_PROVIDER=local
LLM_SERVICE_URL=http://localhost:8003
```

**Python LLM service options** (in `backend/.env.example`):

```env
LLM_MODEL_REPO=TheBloke/Mistral-7B-Instruct-v0.2-GGUF
LLM_MODEL_FILE=mistral-7b-instruct-v0.2.Q4_K_M.gguf
LLM_GPU_LAYERS=0
LLM_CONTEXT_LENGTH=4096
LLM_SERVICE_PORT=8003
```

## Running Story Time

### Start the LLM Service

```bash
cd services
python llm_service.py
```

The LLM service will start on `http://localhost:8003`.

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

### 1. Check LLM Service

```bash
# Health check
curl http://localhost:8003/health
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
├── services/
│   └── llm_service.py        # Python llama.cpp LLM service
├── docs/                     # Documentation
├── .env.example              # Environment template
└── package.json              # Dependencies and scripts
```

## Troubleshooting

### LLM Service Not Running

```bash
# Check if the service is running
curl http://localhost:8003/health

# Start the service
cd services && python llm_service.py
```

### Port Already in Use

```bash
# Change port in .env
PORT=3001

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Model Download Issues

The Python LLM service downloads models from HuggingFace on first run. If this fails:

```bash
# Check your internet connection
# Try a smaller model by updating .env:
LLM_MODEL_FILE=mistral-7b-instruct-v0.2.Q4_K_S.gguf
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

To use a different GGUF model, update your environment:

```env
LLM_MODEL_REPO=TheBloke/Llama-2-13B-chat-GGUF
LLM_MODEL_FILE=llama-2-13b-chat.Q4_K_M.gguf
```

Then restart the LLM service.

### Recommended Models

| Model | Size | Best For | Speed |
|-------|------|----------|-------|
| Mistral 7B Instruct Q4 | ~4GB | General use, fast | Fast |
| Llama 3 8B Q4 | ~5GB | Good quality, versatile | Fast |
| Qwen 2.5 14B Q4 | ~8GB | Creative writing | Medium |

## Support

- Issues: <https://github.com/jflournoy/story-time/issues>
- llama-cpp-python docs: <https://github.com/abetlen/llama-cpp-python>
