import { Router, Request, Response } from 'express';
import { ExportService } from '../services/exportService';

export const exportRouter = Router();
const exportService = new ExportService();

/**
 * POST /api/export/text
 * Export text content in plain text format
 */
exportRouter.post('/text', (req: Request, res: Response) => {
  try {
    const { text, synopsis } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const content = exportService.exportToText({ text, synopsis });
    res.json({
      success: true,
      format: 'text',
      content,
    });
  } catch (error) {
    console.error('Export to text error:', error);
    res.status(500).json({ error: 'Failed to export text' });
  }
});

/**
 * POST /api/export/markdown
 * Export text content in Markdown format
 */
exportRouter.post('/markdown', (req: Request, res: Response) => {
  try {
    const { text, synopsis } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const content = exportService.exportToMarkdown({ text, synopsis });
    res.json({
      success: true,
      format: 'markdown',
      content,
    });
  } catch (error) {
    console.error('Export to markdown error:', error);
    res.status(500).json({ error: 'Failed to export to markdown' });
  }
});

/**
 * POST /api/export/json
 * Export text and metadata as JSON
 */
exportRouter.post('/json', (req: Request, res: Response) => {
  try {
    const { text, synopsis } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const content = exportService.exportToJSON({ text, synopsis });
    res.json({
      success: true,
      format: 'json',
      content,
    });
  } catch (error) {
    console.error('Export to json error:', error);
    res.status(500).json({ error: 'Failed to export to json' });
  }
});
