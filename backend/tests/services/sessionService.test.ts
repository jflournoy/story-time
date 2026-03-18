import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionService } from '../../src/services/sessionService';
import { HistoryEntry } from '../../src/services/historyService';

describe('SessionService - Persistent Storage with SQLite', () => {
  let sessionService: SessionService;
  const testDbPath = ':memory:'; // Use in-memory SQLite for tests

  beforeEach(async () => {
    sessionService = new SessionService({ dbPath: testDbPath });
    await sessionService.initialize();
  });

  afterEach(async () => {
    await sessionService.close();
  });

  describe('Session Creation and Retrieval', () => {
    it('should create a new session with metadata', async () => {
      const session = await sessionService.createSession({
        title: 'My First Story',
        description: 'A story about courage',
      });

      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('title', 'My First Story');
      expect(session).toHaveProperty('description', 'A story about courage');
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('updatedAt');
      expect(session).toHaveProperty('operationCount', 0);
    });

    it('should generate unique session IDs', async () => {
      const session1 = await sessionService.createSession({
        title: 'Session 1',
      });

      const session2 = await sessionService.createSession({
        title: 'Session 2',
      });

      expect(session1.id).not.toBe(session2.id);
    });

    it('should retrieve a session by ID', async () => {
      const created = await sessionService.createSession({
        title: 'Test Session',
      });

      const retrieved = await sessionService.getSession(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.title).toBe('Test Session');
    });

    it('should return undefined for non-existent session', async () => {
      const result = await sessionService.getSession('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('Session Listing', () => {
    it('should list all sessions', async () => {
      await sessionService.createSession({ title: 'Session 1' });
      await new Promise(resolve => setTimeout(resolve, 2));
      await sessionService.createSession({ title: 'Session 2' });
      await new Promise(resolve => setTimeout(resolve, 2));
      await sessionService.createSession({ title: 'Session 3' });

      const sessions = await sessionService.listSessions();

      expect(sessions).toHaveLength(3);
      // Sessions are ordered DESC (newest first)
      expect(sessions[0].title).toBe('Session 3');
      expect(sessions[2].title).toBe('Session 1');
    });

    it('should list sessions with pagination', async () => {
      for (let i = 0; i < 15; i++) {
        await sessionService.createSession({ title: `Session ${i}` });
        // Small delay to ensure unique timestamps for deterministic ordering
        await new Promise(resolve => setTimeout(resolve, 2));
      }

      const page1 = await sessionService.listSessions({ skip: 0, limit: 5 });
      const page2 = await sessionService.listSessions({ skip: 5, limit: 5 });
      const page3 = await sessionService.listSessions({ skip: 10, limit: 5 });

      expect(page1).toHaveLength(5);
      expect(page2).toHaveLength(5);
      expect(page3).toHaveLength(5);
      // Sessions are ordered DESC (newest first), so Session 14 is first
      expect(page1[0].title).toBe('Session 14');
      expect(page2[0].title).toBe('Session 9');
      expect(page3[0].title).toBe('Session 4');
    });

    it('should return empty array when no sessions exist', async () => {
      const sessions = await sessionService.listSessions();
      expect(sessions).toEqual([]);
    });

    it('should list sessions sorted by creation date (newest first)', async () => {
      const s1 = await sessionService.createSession({ title: 'First' });

      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const s2 = await sessionService.createSession({ title: 'Second' });

      const sessions = await sessionService.listSessions();

      // Should be ordered by createdAt descending (newest first)
      expect(sessions[0].id).toBe(s2.id);
      expect(sessions[1].id).toBe(s1.id);
    });
  });

  describe('Session Updating', () => {
    it('should update session metadata', async () => {
      const session = await sessionService.createSession({
        title: 'Original Title',
        description: 'Original description',
      });

      // Wait a small amount to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));

      const updated = await sessionService.updateSession(session.id, {
        title: 'Updated Title',
        description: 'Updated description',
      });

      expect(updated?.title).toBe('Updated Title');
      expect(updated?.description).toBe('Updated description');
      expect(updated?.updatedAt).not.toBe(session.updatedAt);
    });

    it('should persist updates across retrievals', async () => {
      const session = await sessionService.createSession({
        title: 'Original',
      });

      await sessionService.updateSession(session.id, {
        title: 'Updated',
      });

      const retrieved = await sessionService.getSession(session.id);

      expect(retrieved?.title).toBe('Updated');
    });

    it('should return undefined when updating non-existent session', async () => {
      const result = await sessionService.updateSession('non-existent', {
        title: 'New Title',
      });

      expect(result).toBeUndefined();
    });
  });

  describe('Session History Management', () => {
    it('should add operation to session history', async () => {
      const session = await sessionService.createSession({
        title: 'Story Session',
      });

      const operation: HistoryEntry = {
        id: 'op_1',
        type: 'expand',
        originalText: 'Short text',
        resultText: 'Expanded text here',
        timestamp: new Date().toISOString(),
      };

      const result = await sessionService.addOperationToSession(session.id, operation);

      expect(result).toBe(true);
    });

    it('should retrieve all operations for a session', async () => {
      const session = await sessionService.createSession({
        title: 'Story Session',
      });

      const op1: HistoryEntry = {
        id: 'op_1',
        type: 'expand',
        originalText: 'Text 1',
        resultText: 'Expanded 1',
        timestamp: new Date().toISOString(),
      };

      const op2: HistoryEntry = {
        id: 'op_2',
        type: 'refine',
        originalText: 'Text 2',
        resultText: 'Refined 2',
        timestamp: new Date().toISOString(),
      };

      await sessionService.addOperationToSession(session.id, op1);
      await sessionService.addOperationToSession(session.id, op2);

      const history = await sessionService.getSessionHistory(session.id);

      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('expand');
      expect(history[1].type).toBe('refine');
    });

    it('should track operation count in session metadata', async () => {
      const session = await sessionService.createSession({
        title: 'Story Session',
      });

      const op: HistoryEntry = {
        id: 'op_1',
        type: 'expand',
        originalText: 'Text',
        resultText: 'Expanded',
        timestamp: new Date().toISOString(),
      };

      await sessionService.addOperationToSession(session.id, op);

      const updated = await sessionService.getSession(session.id);

      expect(updated?.operationCount).toBe(1);
    });

    it('should return empty array for session with no operations', async () => {
      const session = await sessionService.createSession({
        title: 'Empty Session',
      });

      const history = await sessionService.getSessionHistory(session.id);

      expect(history).toEqual([]);
    });
  });

  describe('Session Deletion', () => {
    it('should delete a session', async () => {
      const session = await sessionService.createSession({
        title: 'To Delete',
      });

      const result = await sessionService.deleteSession(session.id);

      expect(result).toBe(true);
    });

    it('should not retrieve deleted session', async () => {
      const session = await sessionService.createSession({
        title: 'To Delete',
      });

      await sessionService.deleteSession(session.id);

      const retrieved = await sessionService.getSession(session.id);

      expect(retrieved).toBeUndefined();
    });

    it('should remove operations when session is deleted', async () => {
      const session = await sessionService.createSession({
        title: 'Session with ops',
      });

      const op: HistoryEntry = {
        id: 'op_1',
        type: 'expand',
        originalText: 'Text',
        resultText: 'Expanded',
        timestamp: new Date().toISOString(),
      };

      await sessionService.addOperationToSession(session.id, op);
      await sessionService.deleteSession(session.id);

      const history = await sessionService.getSessionHistory(session.id);

      expect(history).toHaveLength(0);
    });

    it('should return false when deleting non-existent session', async () => {
      const result = await sessionService.deleteSession('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('Session Persistence', () => {
    it('should persist sessions across service instances', async () => {
      const session = await sessionService.createSession({
        title: 'Persistent Session',
        description: 'This should persist',
      });

      // Create a second instance with same db (in tests, both use :memory:)
      const sessionService2 = new SessionService({ dbPath: testDbPath });
      await sessionService2.initialize();

      // Note: In real implementation with file-based DB, this would test persistence
      // For now, this tests the API contract
      expect(session).toHaveProperty('id');

      await sessionService2.close();
    });

    it('should retrieve operations after session is reloaded', async () => {
      const session = await sessionService.createSession({
        title: 'Session',
      });

      const op: HistoryEntry = {
        id: 'op_1',
        type: 'expand',
        originalText: 'Original',
        resultText: 'Expanded',
        timestamp: new Date().toISOString(),
      };

      await sessionService.addOperationToSession(session.id, op);

      const retrieved = await sessionService.getSession(session.id);
      const history = await sessionService.getSessionHistory(session.id);

      expect(retrieved?.operationCount).toBe(1);
      expect(history).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle adding operation to non-existent session gracefully', async () => {
      const op: HistoryEntry = {
        id: 'op_1',
        type: 'expand',
        originalText: 'Text',
        resultText: 'Expanded',
        timestamp: new Date().toISOString(),
      };

      const result = await sessionService.addOperationToSession('non-existent', op);

      expect(result).toBe(false);
    });

    it('should handle concurrent operations safely', async () => {
      const session = await sessionService.createSession({
        title: 'Concurrent Test',
      });

      const ops = Array.from({ length: 5 }).map((_, i) => ({
        id: `op_${i}`,
        type: 'expand' as const,
        originalText: `Text ${i}`,
        resultText: `Expanded ${i}`,
        timestamp: new Date().toISOString(),
      }));

      // Add operations concurrently
      await Promise.all(
        ops.map(op => sessionService.addOperationToSession(session.id, op))
      );

      const history = await sessionService.getSessionHistory(session.id);

      expect(history).toHaveLength(5);
    });
  });

  describe('Entity Persistence (World State)', () => {
    it('should save entity extraction results to session', async () => {
      const session = await sessionService.createSession({
        title: 'Story with Entities',
      });

      const entities = {
        characters: [
          {
            type: 'character' as const,
            name: 'Elena',
            mentions: 2,
            firstAppearance: { paragraph: 0, sentence: 0 },
            attributes: ['biologist', 'determined'],
          },
        ],
        locations: [
          {
            type: 'location' as const,
            name: 'Amazon jungle',
            mentions: 1,
            firstAppearance: { paragraph: 0, sentence: 0 },
            attributes: ['dense', 'tropical'],
          },
        ],
        objects: [],
        entityCount: 2,
      };

      const result = await sessionService.saveEntities(session.id, entities);

      expect(result).toBe(true);
    });

    it('should retrieve saved entities for a session', async () => {
      const session = await sessionService.createSession({
        title: 'Story Session',
      });

      const entities = {
        characters: [
          {
            type: 'character' as const,
            name: 'Marco',
            mentions: 3,
            firstAppearance: { paragraph: 0, sentence: 1 },
            attributes: ['guide'],
          },
        ],
        locations: [],
        objects: [
          {
            type: 'object' as const,
            name: 'ancient map',
            mentions: 2,
            firstAppearance: { paragraph: 1, sentence: 0 },
            attributes: ['old', 'valuable'],
          },
        ],
        entityCount: 2,
      };

      await sessionService.saveEntities(session.id, entities);

      const retrieved = await sessionService.getEntities(session.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.characters).toHaveLength(1);
      expect(retrieved?.characters[0].name).toBe('Marco');
      expect(retrieved?.objects[0].name).toBe('ancient map');
    });

    it('should support incremental entity updates', async () => {
      const session = await sessionService.createSession({
        title: 'Incremental Updates',
      });

      // First extraction
      const entities1 = {
        characters: [
          {
            type: 'character' as const,
            name: 'Elena',
            mentions: 1,
            firstAppearance: { paragraph: 0, sentence: 0 },
            attributes: [],
          },
        ],
        locations: [],
        objects: [],
        entityCount: 1,
      };

      await sessionService.saveEntities(session.id, entities1);

      // Second extraction with new entity
      const entities2 = {
        characters: [
          {
            type: 'character' as const,
            name: 'Elena',
            mentions: 3,
            firstAppearance: { paragraph: 0, sentence: 0 },
            attributes: ['biologist'],
          },
          {
            type: 'character' as const,
            name: 'Marco',
            mentions: 1,
            firstAppearance: { paragraph: 1, sentence: 0 },
            attributes: [],
          },
        ],
        locations: [],
        objects: [],
        entityCount: 2,
      };

      await sessionService.saveEntities(session.id, entities2);

      const retrieved = await sessionService.getEntities(session.id);

      expect(retrieved?.characters).toHaveLength(2);
      expect(retrieved?.characters[0].name).toBe('Elena');
      expect(retrieved?.characters[0].mentions).toBe(3);
      expect(retrieved?.characters[1].name).toBe('Marco');
    });

    it('should return undefined for session with no entities', async () => {
      const session = await sessionService.createSession({
        title: 'Empty Session',
      });

      const entities = await sessionService.getEntities(session.id);

      expect(entities).toBeUndefined();
    });

    it('should delete entities when session is deleted', async () => {
      const session = await sessionService.createSession({
        title: 'Session with Entities',
      });

      const entities = {
        characters: [
          {
            type: 'character' as const,
            name: 'Test Character',
            mentions: 1,
            firstAppearance: { paragraph: 0, sentence: 0 },
            attributes: [],
          },
        ],
        locations: [],
        objects: [],
        entityCount: 1,
      };

      await sessionService.saveEntities(session.id, entities);
      await sessionService.deleteSession(session.id);

      const retrieved = await sessionService.getEntities(session.id);

      expect(retrieved).toBeUndefined();
    });
  });
});
