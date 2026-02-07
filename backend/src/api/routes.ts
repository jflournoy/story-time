import { Router } from 'express';
import { textOperationsRouter } from './textOperations';
import { exportRouter } from './export';
import { historyRouter } from './history';
import { diffRouter } from './diff';
import { sessionsRouter } from './sessions';

export const router = Router();

// API routes
router.use('/text', textOperationsRouter);
router.use('/export', exportRouter);
router.use('/history', historyRouter);
router.use('/diff', diffRouter);
router.use('/sessions', sessionsRouter);

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'Story Time API',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      textOperations: '/api/text',
      export: '/api/export',
      history: '/api/history',
      diff: '/api/diff',
      sessions: '/api/sessions',
    },
  });
});
