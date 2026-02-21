import { Request, Response, NextFunction } from 'express';
import redisService from '../services/redis';
import logger from '../utils/logger';

/**
 * Helper function to safely check Redis health
 * Handles cases where isHealthy might not exist or throws
 */
function isRedisHealthy(): boolean {
  try {
    // Check if redisService exists and has isHealthy method
    if (!redisService || typeof redisService.isHealthy !== 'function') {
      return false;
    }
    return redisService.isHealthy();
  } catch (error) {
    logger.debug('Redis health check failed:', error);
    return false;
  }
}

/**
 * Cache middleware for GET requests
 * Caches response data in Redis with configurable TTL
 */
export const cacheMiddleware = (ttlSeconds: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching in test environment
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if Redis is not available
    if (!isRedisHealthy()) {
      return next();
    }

    try {
      // Generate cache key from route and user ID
      const userId = (req as any).user?.userId || 'anonymous';
      const cacheKey = `cache:${req.originalUrl}:${userId}`;

      // Try to get cached data
      const cachedData = await redisService.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`Cache HIT: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      logger.debug(`Cache MISS: ${cacheKey}`);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function(data: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisService.set(cacheKey, JSON.stringify(data), ttlSeconds)
            .catch(err => logger.error('Cache set error:', err));
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};

/**
 * Invalidate cache for specific patterns
 */
export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    if (!isRedisHealthy()) {
      return;
    }

    // For simplicity, we'll use a prefix-based invalidation
    // In production, consider using Redis SCAN for pattern matching
    logger.info(`Cache invalidation requested for pattern: ${pattern}`);
    
    // Delete specific key
    await redisService.del(pattern);
  } catch (error) {
    logger.error('Cache invalidation error:', error);
  }
};

/**
 * Cache user profile data
 */
export const cacheUserProfile = (ttlSeconds: number = 600) => {
  return cacheMiddleware(ttlSeconds);
};

/**
 * Cache interview questions
 */
export const cacheInterviewQuestions = (ttlSeconds: number = 1800) => {
  return cacheMiddleware(ttlSeconds);
};

/**
 * Cache resume analysis
 */
export const cacheResumeAnalysis = (ttlSeconds: number = 3600) => {
  return cacheMiddleware(ttlSeconds);
};
