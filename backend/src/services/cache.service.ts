import Redis from 'ioredis';
import logger from '../utils/logger';

class CacheService {
  private redis: Redis | null = null;
  private isConnected = false;

  constructor() {
    // Only connect to Redis if not explicitly disabled
    if (process.env.DISABLE_REDIS !== 'true') {
      this.connect();
    } else {
      logger.info('Redis caching disabled by environment variable');
    }
  }

  private connect(): void {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times: number) => {
          // Give up after 5 attempts
          if (times > 5) {
            logger.info('Redis connection failed after 5 attempts, falling back to no caching');
            return null; // Stop retrying
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false
      });

      this.redis.on('connect', () => {
        logger.info('Connected to Redis');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        // Only log the first error to avoid spamming logs
        if (this.isConnected) {
          logger.error('Redis connection error:', error);
        }
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.redis) {
      logger.warn('Redis not connected, skipping cache get');
      return null;
    }

    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Failed to get cache key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      logger.warn('Redis not connected, skipping cache set');
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error(`Failed to set cache key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      logger.warn('Redis not connected, skipping cache delete');
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error(`Failed to delete cache key ${key}:`, error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      logger.warn('Redis not connected, skipping cache flush');
      return false;
    }

    try {
      await this.redis.flushall();
      logger.info('Cache flushed');
      return true;
    } catch (error) {
      logger.error('Failed to flush cache:', error);
      return false;
    }
  }

  generateKey(...parts: (string | number)[]): string {
    return parts.join(':');
  }
}

export const cacheService = new CacheService();