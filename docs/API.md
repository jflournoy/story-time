# Story Time API Documentation

Comprehensive API reference for the Story Time narrative development platform.

## Base URL

```
http://localhost:3001/api
```

## Table of Contents

- [Sessions API](#sessions-api)
- [Entity Persistence API](#entity-persistence-api)
- [Data Models](#data-models)
- [Error Handling](#error-handling)

## Sessions API

### Create Session

Create a new narrative session.

```http
POST /api/sessions
```

**Request Body:**

```json
{
  "title": "My Story"
}
```

**Response (201 Created):**

```json
{
  "id": "uuid-v4",
  "title": "My Story",
  "created_at": "2026-02-10T12:00:00.000Z"
}
```

### Get Session

Retrieve a specific session by ID.

```http
GET /api/sessions/:sessionId
```

**Response (200 OK):**

```json
{
  "id": "uuid-v4",
  "title": "My Story",
  "created_at": "2026-02-10T12:00:00.000Z"
}
```

**Error Responses:**

- `404 Not Found` - Session does not exist

### List All Sessions

Retrieve all sessions.

```http
GET /api/sessions
```

**Response (200 OK):**

```json
[
  {
    "id": "uuid-v4",
    "title": "Story One",
    "created_at": "2026-02-10T12:00:00.000Z"
  },
  {
    "id": "uuid-v4-2",
    "title": "Story Two",
    "created_at": "2026-02-09T15:30:00.000Z"
  }
]
```

### Delete Session

Delete a session and all associated data.

```http
DELETE /api/sessions/:sessionId
```

**Response (204 No Content)**

**Error Responses:**

- `404 Not Found` - Session does not exist

## Entity Persistence API

Store and retrieve entity extraction results (characters, locations, objects) for narrative sessions. This enables tracking of world state across story iterations.

### Save Entities

Save entity extraction results to a session. Supports incremental updates - calling this endpoint again will replace previous data.

```http
POST /api/sessions/:sessionId/entities
```

**Request Body:**

```json
{
  "characters": [
    {
      "type": "character",
      "name": "Elena Rodriguez",
      "mentions": 5,
      "firstAppearance": {
        "paragraph": 1,
        "sentence": 2
      },
      "attributes": [
        "marine biologist",
        "determined",
        "curious"
      ],
      "relationships": [
        {
          "target": "Marco Silva",
          "type": "colleague",
          "details": "Works together on research expedition"
        }
      ]
    }
  ],
  "locations": [
    {
      "type": "location",
      "name": "Amazon Research Station",
      "mentions": 8,
      "firstAppearance": {
        "paragraph": 1,
        "sentence": 1
      },
      "attributes": [
        "remote",
        "jungle clearing",
        "scientific facility"
      ]
    }
  ],
  "objects": [
    {
      "type": "object",
      "name": "field notebook",
      "mentions": 3,
      "firstAppearance": {
        "paragraph": 2,
        "sentence": 4
      },
      "attributes": [
        "leather-bound",
        "water-stained"
      ]
    }
  ],
  "entityCount": 3
}
```

**Response (201 Created):**

```json
{
  "message": "Entities saved successfully",
  "entities": {
    "characters": [...],
    "locations": [...],
    "objects": [...],
    "entityCount": 3
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid entities structure (missing required fields)
- `404 Not Found` - Session does not exist
- `500 Internal Server Error` - Failed to save entities

**Validation:**

The request body must include all three arrays (`characters`, `locations`, `objects`), even if empty:

```json
{
  "characters": [],
  "locations": [],
  "objects": [],
  "entityCount": 0
}
```

### Get Entities

Retrieve entity extraction results for a session.

```http
GET /api/sessions/:sessionId/entities
```

**Response (200 OK):**

```json
{
  "characters": [
    {
      "type": "character",
      "name": "Elena Rodriguez",
      "mentions": 5,
      "firstAppearance": {
        "paragraph": 1,
        "sentence": 2
      },
      "attributes": [
        "marine biologist",
        "determined",
        "curious"
      ],
      "relationships": [
        {
          "target": "Marco Silva",
          "type": "colleague",
          "details": "Works together on research expedition"
        }
      ]
    }
  ],
  "locations": [...],
  "objects": [...],
  "entityCount": 3
}
```

**Error Responses:**

- `404 Not Found` - Session does not exist or no entities found for session
- `500 Internal Server Error` - Failed to retrieve entities

## Data Models

### Session

```typescript
interface Session {
  id: string;           // UUID v4
  title: string;        // Session title
  created_at: string;   // ISO 8601 timestamp
}
```

### Entity

Base entity structure used for characters, locations, and objects.

```typescript
interface Entity {
  type: 'character' | 'location' | 'object';
  name: string;
  mentions: number;
  firstAppearance: {
    paragraph: number;
    sentence: number;
  };
  attributes: string[];
  relationships?: EntityRelationship[];
}
```

### EntityRelationship

Describes relationships between entities.

```typescript
interface EntityRelationship {
  target: string;      // Name of related entity
  type: string;        // Type of relationship (e.g., "colleague", "friend", "enemy")
  details?: string;    // Additional relationship context
}
```

### EntityExtractionResult

Complete entity extraction result structure.

```typescript
interface EntityExtractionResult {
  characters: Entity[];
  locations: Entity[];
  objects: Entity[];
  entityCount: number;
}
```

## Error Handling

All endpoints follow consistent error response patterns.

### Error Response Format

```json
{
  "error": "Error description message"
}
```

### HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `204 No Content` - Resource deleted successfully
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Common Error Scenarios

#### Session Not Found

```http
GET /api/sessions/nonexistent-id
```

**Response (404 Not Found):**

```json
{
  "error": "Session not found"
}
```

#### Invalid Entity Structure

```http
POST /api/sessions/:sessionId/entities
{
  "characters": []
  // Missing locations and objects arrays
}
```

**Response (400 Bad Request):**

```json
{
  "error": "Invalid entities structure. Required: characters, locations, objects"
}
```

## Usage Examples

### Complete Workflow: Create Session and Save Entities

```bash
# 1. Create a new session
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"title": "Jungle Romance"}'

# Response: {"id": "abc-123", ...}

# 2. Save entity extraction results
curl -X POST http://localhost:3001/api/sessions/abc-123/entities \
  -H "Content-Type: application/json" \
  -d @entities.json

# 3. Retrieve saved entities
curl http://localhost:3001/api/sessions/abc-123/entities
```

### Incremental Entity Updates

Entity data can be updated incrementally by calling the save endpoint again:

```bash
# Initial save
curl -X POST http://localhost:3001/api/sessions/abc-123/entities \
  -H "Content-Type: application/json" \
  -d '{"characters": [{"name": "Elena", ...}], "locations": [], "objects": []}'

# Update with new entities (replaces previous data)
curl -X POST http://localhost:3001/api/sessions/abc-123/entities \
  -H "Content-Type: application/json" \
  -d '{"characters": [{"name": "Elena", ...}, {"name": "Marco", ...}], "locations": [...], "objects": [...]}'
```

## Implementation Notes

### Database

- **Backend**: SQLite3 with better-sqlite3
- **Schema**: Sessions table with CASCADE delete for entity_extractions
- **Storage**: Entity data stored as JSON in `entities_json` column
- **Updates**: Uses `INSERT OR REPLACE` for incremental updates

### Entity Extraction

Entities are extracted using the Entity Extraction Service with LLM support:

```typescript
import { EntityExtractionService } from './services/entityExtractionService';

const service = new EntityExtractionService(llmProvider);
const result = await service.extractEntities(narrativeText, {
  includeRelationships: true
});
```

### Future Enhancements

Planned additions to the Entity Persistence API:

- **Entity merging**: Combine entities from multiple text iterations
- **Entity comparison**: Diff entities between versions
- **Relationship tracking**: Track how relationships evolve over time
- **Query API**: Search and filter entities by attributes
- **Entity analytics**: Statistics and insights about entity usage

## References

- [Entity Extraction Service](../backend/src/services/entityExtractionService.ts)
- [Session Service](../backend/src/services/sessionService.ts)
- [Sessions API Routes](../backend/src/api/sessions.ts)
- [Database Schema](../backend/src/services/sessionService.ts#L76-L85)

---

**Last Updated**: 2026-02-10
**API Version**: 1.0
