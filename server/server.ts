import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { connectDB } from './src/config/database.js';

const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
  try {
    // Start Express Server immediately so API endpoints (like /api/ats/analyze) are immediately reachable
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] CareerFlow backend listening on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
    });

    // Connect to Database asynchronously without blocking HTTP server startup
    await connectDB();
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
  }
};

startServer();
