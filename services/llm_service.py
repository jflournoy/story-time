#!/usr/bin/env python3
"""
Story Time LLM Service
FastAPI microservice for local LLM inference using llama-cpp-python

OpenAI-compatible API endpoints for text generation.
"""

import os
import logging
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global model instance (loaded lazily)
llm_model = None


class CompletionRequest(BaseModel):
    """OpenAI-compatible completion request"""
    prompt: str
    max_tokens: int = Field(default=500, ge=1, le=4096)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=0.95, ge=0.0, le=1.0)
    stop: Optional[List[str]] = None
    stream: bool = False


class CompletionChoice(BaseModel):
    """Completion choice"""
    text: str
    index: int = 0
    finish_reason: str = "stop"
    logprobs: Optional[Any] = None


class CompletionUsage(BaseModel):
    """Token usage statistics"""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class CompletionResponse(BaseModel):
    """OpenAI-compatible completion response"""
    id: str
    object: str = "text_completion"
    created: int
    model: str
    choices: List[CompletionChoice]
    usage: CompletionUsage


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    model_path: Optional[str] = None
    gpu_layers: int = 0


def load_model():
    """Load the LLM model lazily"""
    global llm_model

    if llm_model is not None:
        return llm_model

    try:
        from llama_cpp import Llama

        # Get configuration from environment
        model_repo = os.getenv('LLM_MODEL_REPO', '')
        model_file = os.getenv('LLM_MODEL_FILE', '')
        gpu_layers = int(os.getenv('LLM_GPU_LAYERS', '0'))
        context_length = int(os.getenv('LLM_CONTEXT_LENGTH', '4096'))

        logger.info(f"Loading model: {model_repo}/{model_file}")
        logger.info(f"GPU layers: {gpu_layers}, Context: {context_length}")

        # Check if local model file exists
        if os.path.exists(model_file):
            model_path = model_file
            logger.info(f"Using local model file: {model_path}")
        elif model_repo and model_file:
            # Download from HuggingFace Hub
            from huggingface_hub import hf_hub_download
            logger.info(f"Downloading model from HuggingFace: {model_repo}")
            model_path = hf_hub_download(
                repo_id=model_repo,
                filename=model_file
            )
            logger.info(f"Model downloaded to: {model_path}")
        else:
            raise ValueError(
                "Must provide either local model file or HuggingFace repo/file. "
                "Set LLM_MODEL_FILE or (LLM_MODEL_REPO + LLM_MODEL_FILE)"
            )

        # Load model with llama-cpp-python
        llm_model = Llama(
            model_path=model_path,
            n_ctx=context_length,
            n_gpu_layers=gpu_layers,
            verbose=False
        )

        logger.info("Model loaded successfully")
        return llm_model

    except ImportError as e:
        logger.error(f"Failed to import llama-cpp-python: {e}")
        logger.error("Install with: pip install llama-cpp-python")
        raise HTTPException(
            status_code=500,
            detail="llama-cpp-python not installed"
        )
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Model loading failed: {str(e)}"
        )


def unload_model():
    """Unload the model to free memory"""
    global llm_model
    if llm_model is not None:
        del llm_model
        llm_model = None
        logger.info("Model unloaded")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: load model on startup if configured"""
    # Startup
    preload = os.getenv('LLM_PRELOAD_MODEL', 'false').lower() == 'true'
    if preload:
        logger.info("Preloading model on startup...")
        try:
            load_model()
        except Exception as e:
            logger.warning(f"Failed to preload model: {e}")

    yield  # Application is running

    # Shutdown
    unload_model()


# Create FastAPI app
app = FastAPI(
    title="Story Time LLM Service",
    description="Local LLM inference service using llama-cpp-python",
    version="0.1.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    is_loaded = llm_model is not None
    model_path = None
    gpu_layers = int(os.getenv('LLM_GPU_LAYERS', '0'))

    if is_loaded:
        model_path = os.getenv('LLM_MODEL_FILE', 'unknown')

    return HealthResponse(
        status="ok",
        model_loaded=is_loaded,
        model_path=model_path,
        gpu_layers=gpu_layers
    )


@app.post("/load")
async def load_model_endpoint():
    """Explicitly load the model"""
    try:
        load_model()
        return {"status": "loaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/unload")
async def unload_model_endpoint():
    """Unload the model to free memory"""
    unload_model()
    return {"status": "unloaded"}


@app.get("/download/status")
async def download_status():
    """Check if model is downloaded/available"""
    model_file = os.getenv('LLM_MODEL_FILE', '')

    if os.path.exists(model_file):
        return {
            "downloaded": True,
            "path": model_file,
            "size_mb": os.path.getsize(model_file) / (1024 * 1024)
        }

    return {
        "downloaded": False,
        "repo": os.getenv('LLM_MODEL_REPO', ''),
        "file": model_file
    }


@app.post("/v1/completions", response_model=CompletionResponse)
async def create_completion(request: CompletionRequest):
    """
    OpenAI-compatible text completion endpoint

    Example request:
    {
      "prompt": "Once upon a time",
      "max_tokens": 100,
      "temperature": 0.7
    }
    """
    import time
    import uuid

    # Load model if not already loaded
    model = load_model()

    try:
        logger.info(f"Generating completion for prompt: {request.prompt[:50]}...")

        # Generate completion
        result = model(
            request.prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            top_p=request.top_p,
            stop=request.stop or [],
            echo=False
        )

        # Extract generated text
        generated_text = result['choices'][0]['text']
        finish_reason = result['choices'][0]['finish_reason']

        # Count tokens (approximate)
        prompt_tokens = len(request.prompt.split())
        completion_tokens = len(generated_text.split())

        return CompletionResponse(
            id=f"cmpl-{uuid.uuid4().hex[:8]}",
            created=int(time.time()),
            model=os.getenv('LLM_MODEL_FILE', 'unknown'),
            choices=[
                CompletionChoice(
                    text=generated_text,
                    finish_reason=finish_reason
                )
            ],
            usage=CompletionUsage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens
            )
        )

    except Exception as e:
        logger.error(f"Completion failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Text generation failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv('LLM_SERVICE_PORT', '8003'))
    host = os.getenv('LLM_SERVICE_HOST', '0.0.0.0')

    logger.info(f"Starting Story Time LLM Service on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
