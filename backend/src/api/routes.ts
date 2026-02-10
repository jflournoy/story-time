import { Router } from 'express';
import { textOperationsRouter } from './textOperations';
import { exportRouter } from './export';
import { historyRouter } from './history';
import { diffRouter } from './diff';
import { sessionsRouter } from './sessions';
import { ToneAnalysisService } from '../services/toneAnalysisService';
import { analysisRouter } from './analysis';
import { createComplexityRouter } from './complexity';
import { ComplexityMetricsService } from '../services/complexityMetricsService';
import { EntityExtractionService } from '../services/entityExtractionService';
import { TimelineService } from '../services/timelineService';
import { createEntitiesRouter } from './entities';
import { createTimelineRouter } from './timeline';
import { ProviderFactory } from '../providers/provider-factory';

export const router = Router();

// Initialize services
const llmProvider = ProviderFactory.createFromEnv();
const analysisService = new ToneAnalysisService(llmProvider);
const complexityService = new ComplexityMetricsService(llmProvider);
const entityService = new EntityExtractionService(llmProvider);
const timelineService = new TimelineService(llmProvider);

// API routes
router.use('/text', textOperationsRouter);
router.use('/export', exportRouter);
router.use('/history', historyRouter);
router.use('/diff', diffRouter);
router.use('/sessions', sessionsRouter);
router.use('/analysis', analysisRouter(analysisService));
router.use('/complexity', createComplexityRouter(complexityService));
router.use('/entities', createEntitiesRouter(entityService));
router.use('/timeline', createTimelineRouter(timelineService));

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
      analysis: '/api/analysis',
      complexity: '/api/complexity',
      entities: '/api/entities',
      timeline: '/api/timeline',
    },
  });
});
