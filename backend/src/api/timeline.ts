import { Router, Request, Response } from 'express';
import { TimelineService } from '../services/timelineService';

export function createTimelineRouter(timelineService: TimelineService): Router {
  const router = Router();

  /**
   * POST /api/timeline/events - Extract events from text
   */
  router.post('/events', async (req: Request, res: Response) => {
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

      const events = await timelineService.extractEvents(text, options);
      res.json({ events });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Event extraction error:', error);
      res.status(500).json({ error: `Event extraction failed: ${message}` });
    }
  });

  /**
   * POST /api/timeline/build - Build a complete timeline from text
   */
  router.post('/build', async (req: Request, res: Response) => {
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

      const timeline = await timelineService.buildTimeline(text);
      res.json(timeline);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Timeline build error:', error);
      res.status(500).json({ error: `Timeline build failed: ${message}` });
    }
  });

  /**
   * POST /api/timeline/pacing - Analyze narrative pacing
   */
  router.post('/pacing', async (req: Request, res: Response) => {
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

      const pacing = await timelineService.analyzePacing(text);
      res.json(pacing);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Pacing analysis error:', error);
      res.status(500).json({ error: `Pacing analysis failed: ${message}` });
    }
  });

  /**
   * POST /api/timeline/compare - Compare timelines between two text versions
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

      const comparison = await timelineService.compareTimelines(original, revised);
      res.json(comparison);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Timeline comparison error:', error);
      res.status(500).json({ error: `Timeline comparison failed: ${message}` });
    }
  });

  /**
   * POST /api/timeline/structure - Detect narrative structure type
   */
  router.post('/structure', async (req: Request, res: Response) => {
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

      const timeline = await timelineService.buildTimeline(text);
      res.json({ structure: timeline.structure });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Structure detection error:', error);
      res.status(500).json({ error: `Structure detection failed: ${message}` });
    }
  });

  return router;
}
