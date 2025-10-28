# Story Time

**AI-assisted narrative development using local LLMs**

A flexible web-based tool for writers to expand, refine, revise, and restructure their stories and scripts using locally-hosted language models.

## What This Is

Story Time helps writers collaborate with AI to develop their narratives. Provide a draft or prompt, specify your goals (expand, refine, revise, restructure), and get enhanced text back - all while maintaining creative control and privacy through local LLM execution.

## Core Features

### Text Operations

- **Expand**: Develop scenes, add detail, flesh out descriptions
- **Refine**: Improve clarity, style, and flow
- **Revise**: Rework structure and pacing
- **Restructure**: Reorganize narrative elements

### Input/Output

- Plain text or Markdown input
- Direct text input or file upload
- Generated output with diff/comparison view
- Export to common formats

### Narrative Context Management

Choose how the LLM understands your story:

- **User-provided synopsis**: Supply your own narrative overview
- **LLM-generated summary**: Auto-generate context from your draft
- **Hybrid approach**: Combine user guidance with auto-summary

## Planned Features

### Narrative Analysis & Tracking

Future versions will support tracking narrative structure:

- **Emotional tone**: Map emotional arcs across scenes
- **Complexity metrics**: Track plot threads and narrative density
- **Key elements**: Characters, objects, locations
- **Timeline management**: Especially useful for non-linear narratives
- **Event tracking**: Major plot points and turning moments

These features are designed to inform the API from the start, even if not immediately implemented.

## Technology Stack

### Backend (Planned)

- **LLM Backend**: Flexible integration for HuggingFace models
  - Supports Ollama, LM Studio, vLLM, or direct HuggingFace inference
  - Model-agnostic design for maximum flexibility
  - Recommended models: Llama 3.x, Mistral, Qwen, etc.

### Frontend (Planned)

- **Interface**: Web-based (browser)
- **File Management**: Single-file projects (main text)
- **Asset Storage**: Metadata and analysis stored separately

## Architecture Principles

The API is designed to support future narrative tracking features:

1. **Text + Metadata**: Primary text remains clean; analysis stored separately
2. **Contextual Processing**: Every LLM request includes narrative overview
3. **Incremental Analysis**: Track changes and evolution over time
4. **Model Flexibility**: Backend-agnostic design for any HuggingFace-compatible model

## Development Roadmap

### Phase 1: MVP

- [ ] Basic web interface for text input/output
- [ ] LLM backend integration (Ollama recommended for start)
- [ ] Core operations: expand, refine, revise
- [ ] Synopsis management (user-provided or auto-generated)
- [ ] Simple diff view for changes

### Phase 2: Enhanced Operations

- [ ] Restructure operation with outlining support
- [ ] Multi-model support (easy model switching)
- [ ] Context history (track iteration history)
- [ ] Export formats (Markdown, plain text, Fountain)

### Phase 3: Narrative Intelligence

- [ ] Emotional tone analysis
- [ ] Character/object/location extraction
- [ ] Timeline visualization
- [ ] Event tracking
- [ ] Complexity metrics

### Phase 4: Advanced Features

- [ ] Multi-file project support
- [ ] Collaborative features
- [ ] Custom model fine-tuning
- [ ] Integration with writing tools

## Why Local LLMs?

- **Privacy**: Your stories stay on your machine
- **Flexibility**: Use any model that suits your needs
- **Control**: Fine-tune models for specific genres or styles
- **Cost**: No API fees or token limits
- **Customization**: Adapt models to your writing style

## Getting Started (Future)

```bash
# Install dependencies
npm install

# Configure your local LLM backend
npm run configure

# Start the development server
npm run dev

# Access the web interface
open http://localhost:3000
```

## Configuration (Future)

```javascript
// config.json
{
  "llm": {
    "backend": "ollama",  // or "lmstudio", "vllm", "huggingface"
    "endpoint": "http://localhost:11434",
    "model": "llama3:8b",
    "temperature": 0.7
  },
  "narrative": {
    "contextMode": "auto",  // "user", "auto", "hybrid"
    "maxContextLength": 8000
  }
}
```

## API Design Principles

The API is designed with future features in mind:

```javascript
// Text operation request
POST /api/process
{
  "text": "Your story text...",
  "operation": "expand|refine|revise|restructure",
  "context": {
    "synopsis": "Optional narrative overview...",
    "mode": "user|auto|hybrid"
  },
  "metadata": {
    // Future: emotional tone preferences
    // Future: character consistency rules
    // Future: timeline constraints
  }
}

// Response includes enhanced text + optional analysis
{
  "text": "Enhanced story text...",
  "analysis": {
    // Future: detected emotional changes
    // Future: new characters/objects
    // Future: timeline implications
  }
}
```

## Contributing

This project is in early development. Contributions welcome, especially:

- LLM backend integrations
- UI/UX improvements
- Narrative analysis algorithms
- Model recommendations for specific use cases

## Development Method

This project uses Test-Driven Development (TDD) for reliable, maintainable code. See [CLAUDE.md](CLAUDE.md) for development guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Status**: Early planning phase
**Next Steps**: Backend architecture decision, UI framework selection, MVP feature prioritization
