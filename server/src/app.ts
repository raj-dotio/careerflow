import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoute from './routes/authRoute.js';
import resumeRoute from './routes/resumeRoute.js';
import atsRoute from './routes/atsRoute.js';
import interviewRoute from './routes/interview.routes.js';
import goalRoute from './routes/goalRoute.js';
import roadmapRoute from './routes/roadmapRoute.js';
import skillRoute from './routes/skillRoute.js';
import challengeRoute from './routes/challengeRoute.js';

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Body Parsing Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

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

// 404 Not Found Handler
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
