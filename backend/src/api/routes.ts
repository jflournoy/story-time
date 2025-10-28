import { Router } from 'express';
import { textOperationsRouter } from './textOperations';

export const router = Router();

// API routes
router.use('/text', textOperationsRouter);

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'Story Time API',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      textOperations: '/api/text',
    },
  });
});
