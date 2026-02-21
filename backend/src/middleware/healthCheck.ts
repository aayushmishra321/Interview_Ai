import { Request, Response } from 'express';
import mongoose from 'mongoose';
import redisService from '../services/redis';
import cloudinaryService from '../services/cloudinary';
import axios from 'axios';
import logger from '../utils/logger';

/**
 * Health check status
 */
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    cloudinary: ServiceHealth;
    aiServer: ServiceHealth;
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  message?: string;
}

/**
 * Check MongoDB health
 */
const checkDatabase = async (): Promise<ServiceHealth> => {
  const startTime = Date.now();
  try {
    const state = mongoose.connection.readyState;
    const responseTime = Date.now() - startTime;
    
    if (state === 1) {
      return { status: 'up', responseTime, message: 'Connected' };
    } else if (state === 2) {
      return { status: 'degraded', responseTime, message: 'Connecting' };
    } else {
      return { status: 'down', responseTime, message: 'Disconnected' };
    }
  } catch (error: any) {
    return { status: 'down', message: error.message };
  }
};

/**
 * Check Redis health
 */
const checkRedis = async (): Promise<ServiceHealth> => {
  const startTime = Date.now();
  try {
    const isHealthy = redisService.isHealthy();
    const responseTime = Date.now() - startTime;
    
    if (isHealthy) {
      // Try a ping operation
      await redisService.set('health_check', '1', 10);
      return { status: 'up', responseTime, message: 'Connected' };
    } else {
      return { status: 'down', responseTime, message: 'Not connected' };
    }
  } catch (error: any) {
    return { status: 'down', message: error.message };
  }
};

/**
 * Check Cloudinary health
 */
const checkCloudinary = async (): Promise<ServiceHealth> => {
  const startTime = Date.now();
  try {
    const isHealthy = cloudinaryService.isHealthy();
    const responseTime = Date.now() - startTime;
    
    if (isHealthy) {
      return { status: 'up', responseTime, message: 'Configured' };
    } else {
      return { status: 'down', responseTime, message: 'Not configured' };
    }
  } catch (error: any) {
    return { status: 'down', message: error.message };
  }
};

/**
 * Check AI Server health
 */
const checkAIServer = async (): Promise<ServiceHealth> => {
  const startTime = Date.now();
  try {
    const aiServerUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    const response = await axios.get(`${aiServerUrl}/health`, { timeout: 5000 });
    const responseTime = Date.now() - startTime;
    
    if (response.status === 200) {
      return { status: 'up', responseTime, message: 'Connected' };
    } else {
      return { status: 'degraded', responseTime, message: `Status: ${response.status}` };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return { status: 'down', responseTime, message: error.message };
  }
};

/**
 * Get system metrics
 */
const getSystemMetrics = () => {
  const memUsage = process.memoryUsage();
  const totalMemory = memUsage.heapTotal;
  const usedMemory = memUsage.heapUsed;
  const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);
  
  return {
    memory: {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: memoryPercentage,
    },
    cpu: {
      usage: Math.round(process.cpuUsage().user / 1000000), // Convert to seconds
    },
  };
};

/**
 * Comprehensive health check endpoint
 */
export const healthCheckHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check all services in parallel
    const [database, redis, cloudinary, aiServer] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkCloudinary(),
      checkAIServer(),
    ]);

    // Determine overall health status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Critical services: database
    if (database.status === 'down') {
      overallStatus = 'unhealthy';
    }
    
    // Important but not critical: redis, aiServer
    if (redis.status === 'down' || aiServer.status === 'down') {
      if (overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    }

    // Get system metrics
    const systemMetrics = getSystemMetrics();

    // Build health response
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      services: {
        database,
        redis,
        cloudinary,
        aiServer,
      },
      system: systemMetrics,
    };

    // Set appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    // Log health check
    if (overallStatus !== 'healthy') {
      logger.warn('Health check degraded or unhealthy:', healthStatus);
    }

    res.status(statusCode).json(healthStatus);
  } catch (error: any) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message,
    });
  }
};

/**
 * Simple liveness probe (for Kubernetes)
 */
export const livenessProbe = (req: Request, res: Response): void => {
  res.status(200).json({ status: 'alive' });
};

/**
 * Readiness probe (for Kubernetes)
 */
export const readinessProbe = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if database is connected
    const dbState = mongoose.connection.readyState;
    
    if (dbState === 1) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', reason: 'Database not connected' });
    }
  } catch (error: any) {
    res.status(503).json({ status: 'not ready', reason: error.message });
  }
};
