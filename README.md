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
5. **Agent Autonomy**: Future multi-agent system with context isolation and controlled information sharing

## Agent Swarm Architecture (Future)

Story Time's evolution includes a multi-agent system where autonomous agents manage world state and character behaviors, enabling dynamic, context-aware narrative development.

### User Interaction Model

Users interact with story agents through an intuitive web interface:

- **Define Agent Profiles**: Create custom agents via web UI with personalities, goals, and constraints
- **Agent Suggestion**: System intelligently suggests agents based on narrative needs
- **Collaborative Development**: Agents work together to develop rich, consistent stories

### Agent Suggestion Workflow

The system transforms vague user input into concrete narratives with suggested agents:

**Example: "Two people fall in love in the jungle"**

1. **World Builder + Narrative Builder Processing**:
   - Flesh out setting details (Amazon rainforest research station? Lost temple expedition?)
   - Establish timeline and key events
   - Develop conflict and tension points
   - Identify character needs

2. **System Suggests Agents**:
   - **Elena**: Marine biologist, agent profile with goals and constraints
   - **Marco**: Indigenous guide, agent profile with cultural knowledge
   - **The Jungle** (optional): Environmental agent that influences events
   - **Research Team** (optional): Supporting ensemble agent

3. **User Customizes**:
   - Adjust Elena's personality traits
   - Add Marco's backstory elements
   - Accept or modify suggested agents
   - Add custom agent profiles as needed

4. **Agents Collaborate**:
   - World Builder maintains consistent jungle environment
   - Narrative Builder ensures pacing and story arc
   - Elena agent makes decisions based on her knowledge/personality
   - Marco agent responds with his limited context
   - Agents interact only when World Builder allows (shared space/events)

### Agent Roles

**World Builder Agent** (Omniscient Coordinator)

- **Role**: Maintains canonical world state and timeline
- **Capabilities**: Tracks all locations, events, global state, world rules
- **Boundaries**: Observes but doesn't write story directly
- **Data Access**: Full access to world context, all character states, complete timeline

**Narrative Builder Agent** (Story Architect)

- **Role**: Develops plot structure, pacing, and story arcs
- **Capabilities**: Manages narrative tension, pacing, theme development
- **Boundaries**: Guides story direction without controlling character decisions
- **Data Access**: Full narrative overview, emotional arcs, plot threads

**Character Agents** (Context-Limited Actors)

- **Role**: Embody individual characters with unique perspectives
- **Capabilities**: Make decisions based on character knowledge, goals, and personality
- **Boundaries**: Only access to character-specific context and knowledge
- **Data Access**: Character history, current knowledge, personality traits, goals

**User-Defined Agent Profiles**

- **Role**: Custom agents created by users via web interface
- **Capabilities**: Flexible role definitions (supporting characters, environmental forces, etc.)
- **Boundaries**: User-configured context and constraints
- **Data Access**: User-defined scope of knowledge

### Context Management

The World Builder controls information flow between agents:

- **Spatial Context**: Characters share context when in same location
- **Interaction Context**: Direct conversation enables information exchange
- **Experience Context**: Shared events create common knowledge
- **Isolation Principle**: Characters maintain separate, limited perspectives
- **Knowledge Gates**: World Builder decides when information becomes available

### Data Storage Approaches

Multiple approaches are under consideration for world/character state:

**Vector Store (Embedding-based Retrieval)**

- **Pros**: Semantic search, flexible queries, handles large contexts, natural language retrieval
- **Cons**: Requires embedding model, more complex infrastructure, additional dependencies
- **Best For**: Complex worlds, many characters, long narratives, rich semantic queries

**Structured JSON (File-based State)**

- **Pros**: Simple, transparent, easy to debug, version-controllable, no external dependencies
- **Cons**: Manual indexing, linear search, size limits, less flexible queries
- **Best For**: Smaller casts, focused narratives, MVP phase, development

**Hybrid Approach (JSON + Embeddings)**

- **Pros**: Core state in JSON, semantic search via embeddings, balanced complexity
- **Cons**: Maintains two systems, synchronization needed
- **Best For**: Production systems wanting simplicity with power

*Decision will be made during Phase 3a implementation based on prototyping results.*

### Concurrency Models

**Agent Swarm Mode (Parallel Execution)**

- Multiple agents reason simultaneously
- World Builder orchestrates context sharing in real-time
- Suitable for: Real-time collaboration, multiple LLM backends, high-performance systems

**Sequential Mode (Single-threaded Execution)**

- Agents operate turn-by-turn in coordinated sequence
- Same architecture, serialized execution pattern
- Suitable for: Single LLM instances, resource constraints, development/debugging

### Integration with Current Features

Agent swarm complements existing text operations:

- **Expand**: Agents provide character-specific expansions with unique perspectives
- **Refine**: World Builder ensures consistency across character viewpoints
- **Revise**: Agents negotiate narrative changes while maintaining their perspectives
- **Synopsis**: Each agent maintains character-specific understanding of events

The current stateless operations remain valuable for:

- Quick edits without full world state
- Early drafts before character establishment
- Targeted improvements to specific passages
- Single-pass text enhancement

## Development Roadmap

Track progress in [GitHub Issues](https://github.com/jflournoy/story-time/issues).

### Phase 1: MVP

- [#9](https://github.com/jflournoy/story-time/issues/9) Project setup and configuration
- [#1](https://github.com/jflournoy/story-time/issues/1) Define API architecture and data models
- [#2](https://github.com/jflournoy/story-time/issues/2) Set up backend structure with LLM integration
- [#3](https://github.com/jflournoy/story-time/issues/3) Create basic web interface
- [#4](https://github.com/jflournoy/story-time/issues/4) Implement core text operations (expand, refine, revise)
- [#5](https://github.com/jflournoy/story-time/issues/5) Implement synopsis management (user-provided or auto-generated)
- [#6](https://github.com/jflournoy/story-time/issues/6) Create diff view for changes
- [#7](https://github.com/jflournoy/story-time/issues/7) Write backend API tests
- [#8](https://github.com/jflournoy/story-time/issues/8) Document API and usage

### Phase 2: Enhanced Operations

- [#10](https://github.com/jflournoy/story-time/issues/10) Restructure operation with outlining support
- [ ] Multi-model support (easy model switching)
- [#11](https://github.com/jflournoy/story-time/issues/11) Context history (track iteration history)
- [#12](https://github.com/jflournoy/story-time/issues/12) Export formats (Markdown, plain text, Fountain)

### Phase 3: Narrative Intelligence

#### Phase 3a: Analysis Foundation

- [ ] Emotional tone analysis and arc tracking
- [ ] Character/object/location extraction
- [ ] Timeline visualization and event tracking
- [ ] Complexity metrics and pacing analysis
- [ ] World state data models (JSON/vector store decision)

#### Phase 3b: Agent Swarm Implementation

- [ ] Agent profile system (user-defined agents via web UI)
- [ ] Agent suggestion engine (auto-generate agents from user input)
- [ ] World Builder agent architecture
- [ ] Narrative Builder agent architecture
- [ ] Character agent system with context isolation
- [ ] Context management and sharing protocols
- [ ] Agent decision-making and interaction patterns
- [ ] Storage backend implementation
- [ ] Serialized agent execution (MVP)
- [ ] Parallel agent swarm mode (advanced)

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

### API Evolution: Agent Swarm

The agent swarm architecture will extend the current API:

```javascript
// Current: Single-agent text operations
POST /api/process
{
  "text": "Your story text...",
  "operation": "expand|refine|revise|restructure",
  "context": {
    "synopsis": "Optional narrative overview..."
  }
}

// Future: Multi-agent narrative development
POST /api/agents/suggest
{
  "userInput": "Two people fall in love in the jungle",
  "preferences": {
    "genre": "romance",
    "complexity": "medium"
  }
}

// Response: Suggested agents and narrative outline
{
  "outline": "Expanded narrative outline...",
  "suggestedAgents": [
    {
      "name": "Elena",
      "role": "character",
      "profile": {
        "occupation": "Marine biologist",
        "personality": ["curious", "determined"],
        "goals": ["research mission", "discovery"]
      }
    },
    {
      "name": "Marco",
      "role": "character",
      "profile": {
        "occupation": "Indigenous guide",
        "personality": ["wise", "protective"],
        "goals": ["preserve traditions", "guide safely"]
      }
    }
  ],
  "worldState": {
    "setting": "Amazon rainforest research station",
    "timeline": "Present day, 3-week expedition"
  }
}

// Future: Agent interaction
POST /api/agents/interact
{
  "worldState": "...",
  "scenario": "Elena and Marco discover ancient ruins",
  "activeAgents": ["Elena", "Marco"],
  "agentMode": "parallel" | "sequential"
}

// Response: Agent decisions and narrative development
{
  "narrative": "Scene text with character perspectives...",
  "agentDecisions": {
    "Elena": {
      "action": "Examines the carvings with scientific curiosity",
      "reasoning": "Marine biology background makes her analytical"
    },
    "Marco": {
      "action": "Warns about disturbing the sacred site",
      "reasoning": "Cultural knowledge and protective instinct"
    }
  },
  "worldStateUpdate": {
    "sharedContext": ["Both at ruins", "Discovered artifact"],
    "characterKnowledge": {
      "Elena": ["Ruins are ancient", "Carvings depict water"],
      "Marco": ["Site is sacred", "Ancestors left warnings"]
    }
  }
}

// Future: Storage abstraction
POST /api/world/state
{
  "storageBackend": "json" | "vectorstore" | "hybrid",
  "worldData": {
    "locations": [...],
    "characters": [...],
    "timeline": [...]
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
