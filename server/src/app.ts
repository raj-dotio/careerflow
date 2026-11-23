import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoute from './routes/authRoute.js';
import resumeRoute from './routes/resumeRoute.js';
import atsRoute from './routes/atsRoute.js';
import interviewRoute from './routes/interview.routes.js';
import goalRoute from './routes/goalRoute.js';
import roadmapRoute from './routes/roadmapRoute.js';
import skillRoute from './routes/skillRoute.js';
import challengeRoute from './routes/challengeRoute.js';
import resumeAiRoute from './routes/resumeAi.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to reliably find public/ static directory across dev & production
const findPublicDir = (): string | null => {
  const candidates = [
    path.resolve(process.cwd(), 'public'),
    path.resolve(__dirname, '../public'),
    path.resolve(__dirname, '../../public'),
    path.resolve(process.cwd(), 'server/public'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }
  return null;
};

const publicDir = findPublicDir();

const app: Application = express();

// Security Middlewares (relaxed CSP & COEP so modern Vite bundle, media, & Firebase auth work smoothly)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);

// Body Parsing Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve Static Frontend Assets (from public directory)
if (publicDir) {
  console.log(`[Static] Serving frontend static assets from: ${publicDir}`);
  app.use(express.static(publicDir));
}

// Base Health Check Route
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'CareerFlow API server is up and running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoute);
app.use('/api/resumes', resumeRoute);
app.use('/api/ats', atsRoute);
app.use('/api/mock-interview', interviewRoute);
app.use('/api/goals', goalRoute);
app.use('/api/roadmap', roadmapRoute);
app.use('/api/skills', skillRoute);
app.use('/api/challenges', challengeRoute);
app.use('/api/resume-ai', resumeAiRoute);

// API 404 Handler - returns JSON for any unhandled /api/... routes
app.use('/api/{*path}', (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// SPA Catch-All Route: serve index.html for all non-API GET requests
if (publicDir) {
  const indexPath = path.join(publicDir, 'index.html');
  app.get('{*path}', (req: Request, res: Response, next: NextFunction) => {
    // If request starts with /api, pass to error handler
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(indexPath);
  });
}

// 404 Fallback Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ServerError]', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

export default app;
