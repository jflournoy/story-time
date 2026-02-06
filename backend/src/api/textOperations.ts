import { Router, Request, Response } from 'express';
import { LLMService } from '../services/llmService';
import { HistoryService } from '../services/historyService';
import { TextOperation } from '../models/types';

export const textOperationsRouter = Router();
const llmService = new LLMService();
const historyService = new HistoryService();

/**
 * Helper to track an operation in history
 */
function trackOperation(type: 'expand' | 'refine' | 'revise' | 'restructure' | 'synopsis',
  originalText: string,
  resultText: string,
  synopsis?: string) {
  try {
    historyService.recordOperation({
      type,
      originalText,
      resultText,
      synopsis,
    });
  } catch (error) {
    console.error('Failed to track operation:', error);
  }
}

/**
 * POST /api/text/expand
 * Expand and develop text with more detail
 */
textOperationsRouter.post('/expand', async (req: Request, res: Response) => {
  try {
    const { text, synopsis } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await llmService.expand(text, synopsis);
    trackOperation('expand', text, result, synopsis);
    res.json({ operation: 'expand', result });
  } catch (error) {
    console.error('Expand operation error:', error);
    res.status(500).json({ error: 'Failed to expand text' });
  }
});

/**
 * POST /api/text/refine
 * Refine text for clarity, style, and flow
 */
textOperationsRouter.post('/refine', async (req: Request, res: Response) => {
  try {
    const { text, synopsis } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await llmService.refine(text, synopsis);
    trackOperation('refine', text, result, synopsis);
    res.json({ operation: 'refine', result });
  } catch (error) {
    console.error('Refine operation error:', error);
    res.status(500).json({ error: 'Failed to refine text' });
  }
});

/**
 * POST /api/text/revise
 * Revise text structure and pacing
 */
textOperationsRouter.post('/revise', async (req: Request, res: Response) => {
  try {
    const { text, synopsis } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await llmService.revise(text, synopsis);
    trackOperation('revise', text, result, synopsis);
    res.json({ operation: 'revise', result });
  } catch (error) {
    console.error('Revise operation error:', error);
    res.status(500).json({ error: 'Failed to revise text' });
  }
});

/**
 * POST /api/text/restructure
 * Restructure text organization and flow
 */
textOperationsRouter.post('/restructure', async (req: Request, res: Response) => {
  try {
    const { text, synopsis } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await llmService.restructure(text, synopsis);
    trackOperation('restructure', text, result, synopsis);
    res.json({ operation: 'restructure', result });
  } catch (error) {
    console.error('Restructure operation error:', error);
    res.status(500).json({ error: 'Failed to restructure text' });
  }
});

/**
 * POST /api/text/synopsis
 * Generate a synopsis from text
 */
textOperationsRouter.post('/synopsis', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const synopsis = await llmService.generateSynopsis(text);
    res.json({ synopsis });
  } catch (error) {
    console.error('Synopsis generation error:', error);
    res.status(500).json({ error: 'Failed to generate synopsis' });
  }
});
