import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export const connectRedis = async (): Promise<void> => {
  try {
    if (!process.env.REDIS_URL) {
      logger.warn('REDIS_URL not set. Redis caching disabled.');
      return;
    }
    redisClient = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    redisClient.on('error', (err: Error) => logger.error('Redis error:', err));
    await redisClient.connect();
    logger.info('✅ Redis connected');
  } catch (err) {
    logger.warn('Redis unavailable, proceeding without cache:', err);
    redisClient = null;
  }
};

export const getRedisClient = () => redisClient;

export const cacheGet = async (key: string): Promise<string | null> => {
  if (!redisClient) return null;
  try { return await redisClient.get(key); } catch { return null; }
};

export const cacheSet = async (
  key: string,
  value: string,
  ttlSeconds = 300
): Promise<void> => {
  if (!redisClient) return;
  try { await redisClient.set(key, value, 'EX', ttlSeconds); } catch {}
};

export const cacheDel = async (key: string): Promise<void> => {
  if (!redisClient) return;
  try { await redisClient.del(key); } catch {}
};
