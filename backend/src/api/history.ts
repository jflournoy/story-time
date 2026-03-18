import { Router, Request, Response } from 'express';
import { HistoryService, OperationType } from '../services/historyService';

export const historyRouter = Router();
const historyService = new HistoryService();

/**
 * GET /api/history
 * Retrieve all operation history
 */
historyRouter.get('/', (req: Request, res: Response) => {
  try {
    const history = historyService.getHistory();
    res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
});

/**
 * GET /api/history/:id
 * Retrieve a specific operation by ID
 */
historyRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const operation = historyService.getOperationById(id);

    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    res.json({
      success: true,
      operation,
    });
  } catch (error) {
    console.error('Get operation error:', error);
    res.status(500).json({ error: 'Failed to retrieve operation' });
  }
});

/**
 * GET /api/history/type/:type
 * Retrieve operations filtered by type
 */
historyRouter.get('/type/:type', (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const operations = historyService.getHistoryByType(type as OperationType);

    res.json({
      success: true,
      type,
      count: operations.length,
      operations,
    });
  } catch (error) {
    console.error('Get history by type error:', error);
    res.status(500).json({ error: 'Failed to retrieve operations by type' });
  }
});

/**
 * GET /api/history/recent/:limit
 * Retrieve recent history with limit
 */
historyRouter.get('/recent/:limit', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.params.limit, 10) || 10;
    const operations = historyService.getRecentHistory(limit);

    res.json({
      success: true,
      limit,
      count: operations.length,
      operations,
    });
  } catch (error) {
    console.error('Get recent history error:', error);
    res.status(500).json({ error: 'Failed to retrieve recent history' });
  }
});

/**
 * GET /api/history/stats/summary
 * Get summary statistics of operations
 */
historyRouter.get('/stats/summary', (req: Request, res: Response) => {
  try {
    const summary = historyService.getHistorySummary();
    const totalCount = historyService.getOperationCount();

    res.json({
      success: true,
      totalCount,
      summary,
    });
  } catch (error) {
    console.error('Get history summary error:', error);
    res.status(500).json({ error: 'Failed to retrieve history summary' });
  }
});

/**
 * DELETE /api/history/:id
 * Remove a specific operation by ID
 */
historyRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const removed = historyService.removeOperation(id);

    if (!removed) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    res.json({
      success: true,
      message: 'Operation removed',
      id,
    });
  } catch (error) {
    console.error('Remove operation error:', error);
    res.status(500).json({ error: 'Failed to remove operation' });
  }
});

/**
 * DELETE /api/history
 * Clear all history
 */
historyRouter.delete('/', (req: Request, res: Response) => {
  try {
    historyService.clearHistory();

    res.json({
      success: true,
      message: 'All history cleared',
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

/**
 * GET /api/history/export/json
 * Export history as JSON
 */
historyRouter.get('/export/json', (req: Request, res: Response) => {
  try {
    const json = historyService.exportAsJSON();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="history.json"');
    res.send(json);
  } catch (error) {
    console.error('Export history error:', error);
    res.status(500).json({ error: 'Failed to export history' });
  }
});

/**
 * POST /api/history/import/json
 * Import history from JSON
 */
historyRouter.post('/import/json', (req: Request, res: Response) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'JSON data is required' });
    }

    historyService.importFromJSON(data);

    res.json({
      success: true,
      message: 'History imported',
      count: historyService.getOperationCount(),
    });
  } catch (error) {
    console.error('Import history error:', error);
    res.status(500).json({ error: 'Failed to import history' });
  }
});
