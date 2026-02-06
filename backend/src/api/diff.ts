import { Router, Request, Response } from 'express';
import { DiffService } from '../services/diff';

export const diffRouter = Router();
const diffService = new DiffService();

interface DiffRequest {
  original: string;
  modified: string;
}

/**
 * POST /api/diff/compute
 * Compute differences between original and modified text
 */
diffRouter.post('/compute', (req: Request<{}, {}, DiffRequest>, res: Response) => {
  try {
    const { original, modified } = req.body;

    if (typeof original !== 'string' || typeof modified !== 'string') {
      return res.status(400).json({
        error: 'Invalid request: original and modified must be strings',
      });
    }

    const result = diffService.computeDiff(original, modified);

    res.json({
      original,
      modified,
      changes: result.changes,
      similarity: result.similarity,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to compute diff',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/diff/lines
 * Compute line-level differences
 */
diffRouter.post('/lines', (req: Request<{}, {}, DiffRequest>, res: Response) => {
  try {
    const { original, modified } = req.body;

    if (typeof original !== 'string' || typeof modified !== 'string') {
      return res.status(400).json({
        error: 'Invalid request: original and modified must be strings',
      });
    }

    const changes = diffService.getLineChanges(original, modified);

    res.json({
      original,
      modified,
      changes,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to compute line diff',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/diff/stats
 * Get statistics about changes between texts
 */
diffRouter.post('/stats', (req: Request<{}, {}, DiffRequest>, res: Response) => {
  try {
    const { original, modified } = req.body;

    if (typeof original !== 'string' || typeof modified !== 'string') {
      return res.status(400).json({
        error: 'Invalid request: original and modified must be strings',
      });
    }

    const stats = diffService.getDeltaStats(original, modified);

    res.json({
      original,
      modified,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to compute stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
