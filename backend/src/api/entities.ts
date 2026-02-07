import { Router, Request, Response } from 'express';
import { EntityExtractionService } from '../services/entityExtractionService';

export function createEntitiesRouter(entityService: EntityExtractionService): Router {
  const router = Router();

  /**
   * POST /api/entities/extract - Extract entities from text
   */
  router.post('/extract', async (req: Request, res: Response) => {
    try {
      const { text, options = {} } = req.body;

      if (!text) {
        res.status(400).json({ error: 'Text is required' });
        return;
      }

      if (typeof text !== 'string' || text.trim() === '') {
        res.status(400).json({ error: 'Text must be a non-empty string' });
        return;
      }

      const result = await entityService.extractEntities(text, options);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Entity extraction error:', error);
      res.status(500).json({ error: `Entity extraction failed: ${message}` });
    }
  });

  /**
   * POST /api/entities/compare - Compare entities between two text versions
   */
  router.post('/compare', async (req: Request, res: Response) => {
    try {
      const { original, revised } = req.body;

      if (!original) {
        res.status(400).json({ error: 'Original text is required' });
        return;
      }

      if (!revised) {
        res.status(400).json({ error: 'Revised text is required' });
        return;
      }

      const comparison = await entityService.compareEntities(original, revised);
      res.json(comparison);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Entity comparison error:', error);
      res.status(500).json({ error: `Entity comparison failed: ${message}` });
    }
  });

  /**
   * POST /api/entities/summary - Get entity summary for text
   */
  router.post('/summary', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      if (!text) {
        res.status(400).json({ error: 'Text is required' });
        return;
      }

      if (typeof text !== 'string' || text.trim() === '') {
        res.status(400).json({ error: 'Text must be a non-empty string' });
        return;
      }

      const summary = await entityService.getEntitySummary(text);
      res.json(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Entity summary error:', error);
      res.status(500).json({ error: `Entity summary failed: ${message}` });
    }
  });

  /**
   * POST /api/entities/track - Track entity appearances across paragraphs
   */
  router.post('/track', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      if (!text) {
        res.status(400).json({ error: 'Text is required' });
        return;
      }

      if (typeof text !== 'string' || text.trim() === '') {
        res.status(400).json({ error: 'Text must be a non-empty string' });
        return;
      }

      // Extract with first appearance tracking
      const result = await entityService.extractEntities(text);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Entity tracking error:', error);
      res.status(500).json({ error: `Entity tracking failed: ${message}` });
    }
  });

  return router;
}
