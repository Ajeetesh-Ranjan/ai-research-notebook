import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { env } from './config/env.js';
import { globalRateLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import documentRoutes from './routes/document.routes.js';
import annotationRoutes from './routes/annotation.routes.js';
import aiRoutes from './routes/ai.routes.js';
import searchRoutes from './routes/search.routes.js';
import exportRoutes from './routes/export.routes.js';
import boardRoutes from './routes/board.routes.js';
import graphRoutes from './routes/graph.routes.js';

/**
 * Create and configure the Express application.
 */
export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for API-only server
  }));
  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }));
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global rate limiting
  app.use(globalRateLimiter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes v1
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/projects/:projectId/documents', documentRoutes);
  app.use('/api/v1/projects/:projectId/annotations', annotationRoutes);
  app.use('/api/v1/ai', aiRoutes);
  app.use('/api/v1/search', searchRoutes);
  app.use('/api/v1/exports', exportRoutes);
  app.use('/api/v1/projects/:projectId/board', boardRoutes);
  app.use('/api/v1/projects/:projectId/graph', graphRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
