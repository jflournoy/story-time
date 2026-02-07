import { Router, Request, Response } from 'express';
import { SessionService } from '../services/sessionService';
import { HistoryEntry } from '../services/historyService';

export const sessionsRouter = Router();
const sessionService = new SessionService();

// Initialize database on first use
sessionService.initialize().catch(err => {
  console.error('Failed to initialize session service:', err);
});

/**
 * POST /api/sessions
 * Create a new session
 */
sessionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required and must be a string' });
    }

    const session = await sessionService.createSession({
      title,
      description,
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * GET /api/sessions
 * List all sessions with optional pagination
 */
sessionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

    if (isNaN(skip) || isNaN(limit)) {
      return res.status(400).json({ error: 'Skip and limit must be valid numbers' });
    }

    const sessions = await sessionService.listSessions({ skip, limit });
    res.json(sessions);
  } catch (error) {
    console.error('List sessions error:', error);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

/**
 * GET /api/sessions/:sessionId
 * Get a specific session
 */
sessionsRouter.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await sessionService.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

/**
 * PUT /api/sessions/:sessionId
 * Update a session
 */
sessionsRouter.put('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { title, description } = req.body;

    const session = await sessionService.updateSession(sessionId, {
      title,
      description,
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

/**
 * DELETE /api/sessions/:sessionId
 * Delete a session
 */
sessionsRouter.delete('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const deleted = await sessionService.deleteSession(sessionId);

    if (!deleted) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.sendStatus(204);
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

/**
 * GET /api/sessions/:sessionId/history
 * Get operations for a session
 */
sessionsRouter.get('/:sessionId/history', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Check if session exists
    const session = await sessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const history = await sessionService.getSessionHistory(sessionId);
    res.json(history);
  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({ error: 'Failed to get session history' });
  }
});

/**
 * POST /api/sessions/:sessionId/history
 * Add an operation to session history
 */
sessionsRouter.post('/:sessionId/history', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { type, originalText, resultText, synopsis } = req.body;

    // Validate operation type
    const validTypes = ['expand', 'refine', 'revise', 'restructure', 'synopsis'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid operation type' });
    }

    // Validate required fields
    if (!originalText || !resultText) {
      return res.status(400).json({ error: 'originalText and resultText are required' });
    }

    // Check if session exists
    const session = await sessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Create operation entry
    const operation: HistoryEntry = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      originalText,
      resultText,
      synopsis,
      timestamp: new Date().toISOString(),
    };

    // Add to session
    const added = await sessionService.addOperationToSession(sessionId, operation);

    if (!added) {
      return res.status(500).json({ error: 'Failed to add operation to session' });
    }

    res.status(201).json(operation);
  } catch (error) {
    console.error('Add operation to session error:', error);
    res.status(500).json({ error: 'Failed to add operation to session' });
  }
});
