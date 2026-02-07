#!/usr/bin/env node

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router as apiRouter } from './api/routes';
import { errorHandler } from './api/middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api', apiRouter);

// Error handling
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 Story Time server running on port ${port}`);
    console.log(`📝 Health check: http://localhost:${port}/health`);
    console.log(`🔌 API endpoint: http://localhost:${port}/api`);
  });
}

export default app;
export { app };
