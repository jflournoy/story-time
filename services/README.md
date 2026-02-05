# Story Time LLM Service

Python microservice for local LLM inference using llama-cpp-python.

## Quick Start

### Installation

```bash
cd services
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration

Create a `.env` file in the `services/` directory:

```bash
# Model configuration
LLM_MODEL_REPO=TheBloke/Mistral-7B-Instruct-v0.2-GGUF
LLM_MODEL_FILE=mistral-7b-instruct-v0.2.Q4_K_M.gguf

# Or use a local model file
# LLM_MODEL_FILE=/path/to/your/model.gguf

# GPU configuration (0 for CPU-only)
LLM_GPU_LAYERS=0

# Context length
LLM_CONTEXT_LENGTH=4096

# Service configuration
LLM_SERVICE_HOST=0.0.0.0
LLM_SERVICE_PORT=8003

# Preload model on startup (optional)
LLM_PRELOAD_MODEL=false
```

### Running the Service

```bash
# Development mode with auto-reload
uvicorn llm_service:app --reload --port 8003

# Production mode
uvicorn llm_service:app --port 8003 --workers 1
```

## API Endpoints

### Health Check
```bash
curl http://localhost:8003/health
```

Response:
```json
{
  "status": "ok",
  "model_loaded": false,
  "model_path": null,
  "gpu_layers": 0
}
```

### Text Completion (OpenAI-compatible)
```bash
curl -X POST http://localhost:8003/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Once upon a time in a magical forest,",
    "max_tokens": 100,
    "temperature": 0.7
  }'
```

Response:
```json
{
  "id": "cmpl-abc123",
  "object": "text_completion",
  "created": 1234567890,
  "model": "mistral-7b-instruct-v0.2.Q4_K_M.gguf",
  "choices": [
    {
      "text": " there lived a wise old owl...",
      "index": 0,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 8,
    "completion_tokens": 50,
    "total_tokens": 58
  }
}
```

### Load Model
```bash
curl -X POST http://localhost:8003/load
```

### Unload Model
```bash
curl -X POST http://localhost:8003/unload
```

### Check Download Status
```bash
curl http://localhost:8003/download/status
```

## GPU Support

### CUDA (NVIDIA)
```bash
pip install llama-cpp-python[cublas]
# Set LLM_GPU_LAYERS=32 (or appropriate value)
```

### Metal (Apple Silicon)
```bash
pip install llama-cpp-python[metal]
# Set LLM_GPU_LAYERS=1 (Metal uses all layers automatically)
```

## Model Recommendations

### Small (1-3GB, fast on CPU)
- `TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF` - tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf

### Medium (4-8GB, balanced)
- `TheBloke/Mistral-7B-Instruct-v0.2-GGUF` - mistral-7b-instruct-v0.2.Q4_K_M.gguf
- `TheBloke/Llama-2-7B-Chat-GGUF` - llama-2-7b-chat.Q4_K_M.gguf

### Large (16GB+, best quality)
- `TheBloke/Mixtral-8x7B-Instruct-v0.1-GGUF` - mixtral-8x7b-instruct-v0.1.Q4_K_M.gguf

## Troubleshooting

### Model Download Fails
- Check internet connection
- Verify HuggingFace repo and filename
- Try downloading manually and use local path

### Out of Memory
- Reduce `LLM_GPU_LAYERS` (use fewer GPU layers)
- Use a smaller model (e.g., Q4_K_M instead of Q5_K_M)
- Reduce `LLM_CONTEXT_LENGTH`

### Slow Generation
- Increase `LLM_GPU_LAYERS` if you have GPU
- Use a smaller model
- Reduce `max_tokens` in requests

## Development

### Running Tests
```bash
pip install -e ".[dev]"
pytest
```

### API Documentation
Visit http://localhost:8003/docs for interactive API documentation (Swagger UI).
