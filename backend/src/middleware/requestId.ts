import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID Middleware
 * Generates or extracts request ID for tracing across services
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Check if request ID already exists (from load balancer or previous service)
  const existingRequestId = req.headers['x-request-id'] as string;
  
  // Generate new request ID if not present
  const requestId = existingRequestId || uuidv4();
  
  // Attach to request object for use in handlers
  (req as any).requestId = requestId;
  
  // Set response header for client tracking
  res.setHeader('X-Request-ID', requestId);
  
  // Continue to next middleware
  next();
};

/**
 * Get request ID from request object
 */
export const getRequestId = (req: Request): string => {
  return (req as any).requestId || 'unknown';
};
