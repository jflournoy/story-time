# Story Time Setup Guide

This document explains how to set up and run Story Time locally, including the relationship between the backend API and frontend application.

## Architecture Overview

Story Time consists of three components working together:

```
┌─────────────────────────────────────────────────────┐
│  Frontend (TypeScript/Vite)                          │
│  Runs in browser, built to frontend/public/          │
└────────────────────┬────────────────────────────────┘
                     │ HTTP requests
                     ▼
┌─────────────────────────────────────────────────────┐
│  Backend API (Express/TypeScript)                    │
│  Port 4001 (dev) or 3000 (production)               │
│  Serves frontend at / and API at /api/*             │
└────────────────────┬────────────────────────────────┘
                     │ HTTP requests (port 8011)
                     ▼
┌─────────────────────────────────────────────────────┐
│  LLM Service (FastAPI/Python)                        │
│  Port 8011 - llama.cpp inference                     │
│  Provides /health, /v1/completions, /load, etc.     │
└─────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
# Install npm dependencies
npm install

# Install Python service dependencies
npm run llm:install
```

### 2. Run Everything Together

For development with all three services:

```bash
npm run dev:local
```

This starts:
- **llm:dev** - LLM service with auto-reload on port 8011
- **backend:dev** - Backend on port 4001 with auto-reload
- **Frontend** - Pre-built in frontend/public/, served by backend

Open http://localhost:4001 in your browser.

### 3. Or Run Services Separately

If you prefer to control each service individually:

```bash
# Terminal 1: Start the LLM service
npm run llm:dev

# Terminal 2: Start the backend API
npm run service:backend

# Frontend is built into backend/src/index.ts - no separate process needed
```

Then:
- Check health: `npm run llm:health` → should see `{"status":"ok",...}`
- Open browser: http://localhost:4001
- API docs: http://localhost:4001/api/docs (if available)

## Building for Production

```bash
# Build frontend (outputs to frontend/public/)
npm run frontend:build

# Build backend
npm run backend:build

# Run production server
npm run start
```

Server starts on port 3000 (or PORT env var) and serves both frontend and API.

## Environment Variables

### Backend (set before `npm run backend:dev` or `npm start`)

```bash
PORT=3000                               # Server port (default: 3000)
LLM_PROVIDER=local                      # Use local llama.cpp service
LLM_SERVICE_URL=http://localhost:8011   # LLM service address
DATABASE_URL=sqlite:./data/story-time.db # Database (auto-created)
```

### LLM Service (set in `services/.env`)

```bash
# Model configuration
LLM_MODEL_REPO=TheBloke/Mistral-7B-Instruct-v0.2-GGUF
LLM_MODEL_FILE=mistral-7b-instruct-v0.2.Q4_K_M.gguf

# Service configuration
LLM_SERVICE_HOST=0.0.0.0
LLM_SERVICE_PORT=8011

# GPU configuration (0 = CPU-only)
LLM_GPU_LAYERS=0
LLM_CONTEXT_LENGTH=4096
```

See [services/README.md](services/README.md) for detailed model recommendations.

## Frontend Build Process

1. **Development**: Frontend runs via Vite in development mode (hot reload)
2. **Production**: Frontend is built by `npm run frontend:build`
3. **Output**: Vite outputs to `frontend/public/` (configured in vite.config.ts)
4. **Serving**: Backend's Express serves static files from `frontend/public/` at path `/`

## Key Files

- **[backend/src/index.ts](backend/src/index.ts)** - Express server setup, static file serving
- **[frontend/src/main.ts](frontend/src/main.ts)** - Frontend entry point
- **[services/llm_service.py](services/llm_service.py)** - LLM inference service
- **[vite.config.ts](vite.config.ts)** - Frontend build configuration

## Troubleshooting

### "Cannot find module" or build errors

```bash
npm install          # Reinstall dependencies
npm run backend:build # Rebuild TypeScript
```

### LLM service won't start

```bash
npm run llm:health   # Check if service is running
npm run llm:install  # Reinstall Python dependencies
```

If port 8011 is in use:
```bash
lsof -i :8011        # Find process using port
kill -9 <PID>        # Kill it, or change PORT in .env
```

### Frontend shows blank page

1. Check browser console for API errors
2. Verify backend is running: `curl http://localhost:4001/health`
3. Verify LLM service is running: `npm run llm:health`
4. Check that frontend files exist: `ls frontend/public/`

### Port conflicts

Each service can be reconfigured:
- **Frontend/Backend**: `PORT=8000 npm run backend:dev`
- **LLM Service**: Edit `services/.env` and set `LLM_SERVICE_PORT=8012`
- **Then update**: Backend env var `LLM_SERVICE_URL=http://localhost:8012`

## Development Tips

- Use `npm run backend:test:watch` for rapid TDD development
- Frontend changes require `npm run frontend:build` (will be auto-done in CI)
- LLM service changes visible immediately with `npm run llm:dev --reload`
- Check API responses with: `curl http://localhost:4001/api/operations -d '{"text":"...","operation":"expand"}'`
