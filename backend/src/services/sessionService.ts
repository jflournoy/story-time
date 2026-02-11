import Database from 'better-sqlite3';
import { HistoryEntry } from './historyService';
import { randomUUID } from 'crypto';
import type { EntityExtractionResult } from './entityExtractionService';

export interface SessionMetadata {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  operationCount: number;
}

export interface CreateSessionOptions {
  title: string;
  description?: string;
}

export interface UpdateSessionOptions {
  title?: string;
  description?: string;
}

export interface ListSessionsOptions {
  skip?: number;
  limit?: number;
}

export class SessionService {
  private db: Database.Database;
  private dbPath: string;

  constructor(options?: { dbPath?: string }) {
    this.dbPath = options?.dbPath || 'sessions.db';
    this.db = new Database(this.dbPath);
  }

  /**
   * Initialize the database schema
   */
  async initialize(): Promise<void> {
    return Promise.resolve(this._initializeSync());
  }

  private _initializeSync(): void {
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Create sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        operation_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS session_operations (
        id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        operation_id TEXT NOT NULL,
        type TEXT NOT NULL,
        original_text TEXT NOT NULL,
        result_text TEXT NOT NULL,
        synopsis TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        PRIMARY KEY (session_id, operation_id)
      );

      CREATE INDEX IF NOT EXISTS idx_session_operations_session_id
        ON session_operations(session_id);

      CREATE INDEX IF NOT EXISTS idx_sessions_created_at
        ON sessions(created_at DESC);

      CREATE TABLE IF NOT EXISTS entity_extractions (
        session_id TEXT PRIMARY KEY,
        entities_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_entity_extractions_session_id
        ON entity_extractions(session_id);
    `);
  }

  /**
   * Create a new session
   */
  async createSession(options: CreateSessionOptions): Promise<SessionMetadata> {
    const id = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, title, description, created_at, updated_at, operation_count)
      VALUES (?, ?, ?, ?, ?, 0)
    `);

    stmt.run(id, options.title, options.description || null, now, now);

    return {
      id,
      title: options.title,
      description: options.description,
      createdAt: now,
      updatedAt: now,
      operationCount: 0,
    };
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<SessionMetadata | undefined> {
    const stmt = this.db.prepare(`
      SELECT id, title, description, created_at, updated_at, operation_count
      FROM sessions
      WHERE id = ?
    `);

    const row = stmt.get(sessionId) as any;

    if (!row) {
      return undefined;
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      operationCount: row.operation_count,
    };
  }

  /**
   * List all sessions with optional pagination
   */
  async listSessions(options?: ListSessionsOptions): Promise<SessionMetadata[]> {
    const skip = options?.skip ?? 0;
    const limit = options?.limit ?? 100;

    const stmt = this.db.prepare(`
      SELECT id, title, description, created_at, updated_at, operation_count
      FROM sessions
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(limit, skip) as any[];

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      operationCount: row.operation_count,
    }));
  }

  /**
   * Update session metadata
   */
  async updateSession(
    sessionId: string,
    options: UpdateSessionOptions
  ): Promise<SessionMetadata | undefined> {
    // First check if session exists
    const session = await this.getSession(sessionId);
    if (!session) {
      return undefined;
    }

    const now = new Date().toISOString();
    const title = options.title ?? session.title;
    const description = options.description ?? session.description;

    const stmt = this.db.prepare(`
      UPDATE sessions
      SET title = ?, description = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(title, description || null, now, sessionId);

    return {
      ...session,
      title,
      description,
      updatedAt: now,
    };
  }

  /**
   * Delete a session and all its operations
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    const result = stmt.run(sessionId);

    return (result.changes ?? 0) > 0;
  }

  /**
   * Add an operation to a session's history
   */
  async addOperationToSession(
    sessionId: string,
    operation: HistoryEntry
  ): Promise<boolean> {
    // Check if session exists
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const stmt = this.db.prepare(`
      INSERT INTO session_operations
        (id, session_id, operation_id, type, original_text, result_text, synopsis, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      const id = `sess_op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      stmt.run(
        id,
        sessionId,
        operation.id,
        operation.type,
        operation.originalText,
        operation.resultText,
        operation.synopsis || null,
        operation.timestamp
      );

      // Update operation count
      const updateStmt = this.db.prepare(`
        UPDATE sessions SET operation_count = operation_count + 1 WHERE id = ?
      `);
      updateStmt.run(sessionId);

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all operations for a session
   */
  async getSessionHistory(sessionId: string): Promise<HistoryEntry[]> {
    const stmt = this.db.prepare(`
      SELECT operation_id as id, type, original_text, result_text, synopsis, timestamp
      FROM session_operations
      WHERE session_id = ?
      ORDER BY timestamp ASC
    `);

    const rows = stmt.all(sessionId) as any[];

    return rows.map(row => ({
      id: row.id,
      type: row.type,
      originalText: row.original_text,
      resultText: row.result_text,
      synopsis: row.synopsis,
      timestamp: row.timestamp,
    }));
  }

  /**
   * Save entity extraction results to a session
   * This supports incremental updates - calling saveEntities again will replace previous data
   */
  async saveEntities(
    sessionId: string,
    entities: EntityExtractionResult
  ): Promise<boolean> {
    // Check if session exists
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const now = new Date().toISOString();
    const entitiesJson = JSON.stringify(entities);

    // Use INSERT OR REPLACE for incremental updates
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO entity_extractions (session_id, entities_json, updated_at)
      VALUES (?, ?, ?)
    `);

    try {
      stmt.run(sessionId, entitiesJson, now);
      return true;
    } catch (error) {
      console.error('Error saving entities:', error);
      return false;
    }
  }

  /**
   * Get entity extraction results for a session
   */
  async getEntities(sessionId: string): Promise<EntityExtractionResult | undefined> {
    const stmt = this.db.prepare(`
      SELECT entities_json
      FROM entity_extractions
      WHERE session_id = ?
    `);

    const row = stmt.get(sessionId) as any;

    if (!row) {
      return undefined;
    }

    try {
      return JSON.parse(row.entities_json) as EntityExtractionResult;
    } catch (error) {
      console.error('Error parsing entities JSON:', error);
      return undefined;
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    this.db.close();
  }

  /**
   * Get database connection (for testing)
   */
  getDb(): Database.Database {
    return this.db;
  }
}
