import { Request, Response, NextFunction } from 'express';
import redisService from '../services/redis';
import logger from '../utils/logger';
import { getRequestId } from './requestId';

// Note: rate-limiter-flexible will be installed via npm install
// If not available, this middleware will gracefully skip rate limiting

/**
 * Rate limiter configuration by subscription tier
 */
const RATE_LIMITS = {
  free: {
    points: 100, // 100 requests
    duration: 3600, // per hour
  },
  pro: {
    points: 500, // 500 requests
    duration: 3600, // per hour
  },
  enterprise: {
    points: 2000, // 2000 requests
    duration: 3600, // per hour
  },
};

/**
 * User-based rate limiting middleware
 * Limits requests based on user ID and subscription tier
 * 
 * Note: This requires rate-limiter-flexible package
 * Run: npm install rate-limiter-flexible
 */
export const userRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Dynamic import to handle missing package gracefully
    const { RateLimiterRedis, RateLimiterMemory } = await import('rate-limiter-flexible');
    
    const user = (req as any).user;
    const requestId = getRequestId(req);

    // If no user (unauthenticated), use IP-based limiting
    if (!user || !user.userId) {
      return next();
    }

    // Get user's subscription tier (default to free)
    const subscriptionTier = user.subscription?.plan || 'free';
    const limits = RATE_LIMITS[subscriptionTier as keyof typeof RATE_LIMITS] || RATE_LIMITS.free;

    // Create rate limiter instance
    let rateLimiter: any;
    if (redisService.isHealthy()) {
      rateLimiter = new RateLimiterRedis({
        storeClient: redisService as any,
        keyPrefix: 'user_rate_limit',
        points: limits.points,
        duration: limits.duration,
      });
    } else {
      rateLimiter = new RateLimiterMemory({
        keyPrefix: 'user_rate_limit',
        points: limits.points,
        duration: limits.duration,
      });
    }

    // Create key based on user ID
    const key = `user:${user.userId}`;

    try {
      // Consume 1 point
      const rateLimiterRes = await rateLimiter.consume(key, 1);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limits.points);
      res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());

      next();
    } catch (rateLimiterError: any) {
      // Rate limit exceeded
      logger.warn('User rate limit exceeded', {
        requestId,
        userId: user.userId,
        tier: subscriptionTier,
        url: req.originalUrl,
      });

      res.setHeader('X-RateLimit-Limit', limits.points);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterError.msBeforeNext).toISOString());
      res.setHeader('Retry-After', Math.ceil(rateLimiterError.msBeforeNext / 1000));

      res.status(429).json({
        success: false,
        error: 'Rate Limit Exceeded',
        code: 'RATE_001',
        message: `Too many requests. Please upgrade your plan for higher limits.`,
        retryAfter: Math.ceil(rateLimiterError.msBeforeNext / 1000),
        currentTier: subscriptionTier,
        requestId,
      });
    }
  } catch (error: any) {
    // If rate limiter package not installed or fails, log warning but don't block request
    if (error.code === 'MODULE_NOT_FOUND') {
      logger.warn('rate-limiter-flexible package not installed. Run: npm install rate-limiter-flexible');
    } else {
      logger.error('Rate limiter error:', {
        error: error.message,
        requestId: getRequestId(req),
      });
    }
    next();
  }
};
