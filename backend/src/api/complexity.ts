import { Router, Request, Response } from 'express';
import { ComplexityMetricsService } from '../services/complexityMetricsService';

export function createComplexityRouter(complexityService: ComplexityMetricsService): Router {
  const router = Router();

  /**
   * POST /api/complexity/threads - Analyze plot threads
   */
  router.post('/threads', async (req: Request, res: Response) => {
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

      const analysis = await complexityService.analyzePlotThreads(text);
      res.json(analysis);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Plot thread analysis error:', error);
      res.status(500).json({ error: `Plot thread analysis failed: ${message}` });
    }
  });

  /**
   * POST /api/complexity/density - Analyze narrative density
   */
  router.post('/density', async (req: Request, res: Response) => {
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

      const analysis = await complexityService.analyzeNarrativeDensity(text);
      res.json(analysis);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Narrative density analysis error:', error);
      res.status(500).json({ error: `Narrative density analysis failed: ${message}` });
    }
  });

  /**
   * POST /api/complexity/characters - Analyze character involvement
   */
  router.post('/characters', async (req: Request, res: Response) => {
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

      const analysis = await complexityService.analyzeCharacterInvolvement(text);
      res.json(analysis);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Character involvement analysis error:', error);
      res.status(500).json({ error: `Character involvement analysis failed: ${message}` });
    }
  });

  /**
   * POST /api/complexity/scenes - Analyze scene complexity
   */
  router.post('/scenes', async (req: Request, res: Response) => {
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

      const analysis = await complexityService.analyzeSceneComplexity(text);
      res.json(analysis);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Scene complexity analysis error:', error);
      res.status(500).json({ error: `Scene complexity analysis failed: ${message}` });
    }
  });

  /**
   * POST /api/complexity/readability - Analyze readability
   */
  router.post('/readability', async (req: Request, res: Response) => {
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

      const analysis = await complexityService.analyzeReadability(text);
      res.json(analysis);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Readability analysis error:', error);
      res.status(500).json({ error: `Readability analysis failed: ${message}` });
    }
  });

  /**
   * POST /api/complexity/report - Generate full complexity report
   */
  router.post('/report', async (req: Request, res: Response) => {
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

      const report = await complexityService.getFullComplexityReport(text);
      res.json(report);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Full complexity report error:', error);
      res.status(500).json({ error: `Full complexity report failed: ${message}` });
    }
  });

  /**
   * POST /api/complexity/compare - Compare complexity between versions
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

      const comparison = await complexityService.compareComplexity(original, revised);
      res.json(comparison);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Complexity comparison error:', error);
      res.status(500).json({ error: `Complexity comparison failed: ${message}` });
    }
  });

  return router;
}
