import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { AppDataSource } from './config/data-source';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';
import { mkdir } from 'fs/promises';

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  try {
    // Ensure logs directory exists
    await mkdir('logs', { recursive: true });

    // Connect to PostgreSQL
    await AppDataSource.initialize();
    logger.info('✅ PostgreSQL connected');

    // Connect to Redis (graceful)
    await connectRedis();

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📋 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await AppDataSource.destroy();
  process.exit(0);
});

bootstrap();
