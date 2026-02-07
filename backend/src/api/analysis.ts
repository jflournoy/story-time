import { Router, Request, Response } from 'express';
import { ToneAnalysisService } from '../services/toneAnalysisService';

export function analysisRouter(analysisService: ToneAnalysisService): Router {
  const router = Router();

  /**
   * POST /api/analysis/tone - Analyze emotional tone of text
   */
  router.post('/tone', async (req: Request, res: Response) => {
    try {
      const { text, granularity = 'paragraph' } = req.body;

      if (!text) {
        res.status(400).json({ error: 'Text is required' });
        return;
      }

      if (!['paragraph', 'scene', 'section'].includes(granularity)) {
        res.status(400).json({ error: 'Invalid granularity. Must be paragraph, scene, or section' });
        return;
      }

      const result = await analysisService.analyzeTone(text, granularity);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: `Tone analysis failed: ${message}` });
    }
  });

  /**
   * POST /api/analysis/compare - Compare tone between original and revised text
   */
  router.post('/compare', async (req: Request, res: Response) => {
    try {
      const { original, revised } = req.body;

      if (!original || !revised) {
        res.status(400).json({ error: 'Both original and revised text are required' });
        return;
      }

      const comparison = await analysisService.compareTone(original, revised);
      res.json(comparison);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: `Tone comparison failed: ${message}` });
    }
  });

  /**
   * POST /api/analysis/arc - Compute emotional arc from sentiment values
   */
  router.post('/arc', (req: Request, res: Response) => {
    try {
      const { sentiments } = req.body;

      if (!Array.isArray(sentiments)) {
        res.status(400).json({ error: 'Sentiments must be an array of numbers' });
        return;
      }

      if (sentiments.length === 0) {
        res.status(400).json({ error: 'Sentiments array cannot be empty' });
        return;
      }

      if (!sentiments.every((s) => typeof s === 'number')) {
        res.status(400).json({ error: 'All sentiment values must be numbers' });
        return;
      }

      const arc = analysisService.getEmotionalArc(sentiments);
      res.json(arc);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: `Arc computation failed: ${message}` });
    }
  });

  return router;
}
