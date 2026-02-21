import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';
import logger from '../utils/logger';
import { getRequestId } from './requestId';

/**
 * Audit logging middleware for admin actions
 */
export const auditLog = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json function
    const originalJson = res.json.bind(res);

    // Override res.json to log after response
    res.json = function(data: any) {
      // Log audit entry asynchronously (don't block response)
      setImmediate(async () => {
        try {
          const user = (req as any).user;
          if (!user) return;

          const auditEntry = {
            userId: user.userId,
            userEmail: user.email || 'unknown',
            action,
            resource,
            resourceId: req.params.id || req.body.id,
            changes: req.body,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            status: res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure',
            errorMessage: res.statusCode >= 400 ? data.error || data.message : undefined,
            metadata: {
              requestId: getRequestId(req),
              method: req.method,
              url: req.originalUrl,
              statusCode: res.statusCode,
            },
          };

          await AuditLog.create(auditEntry);
          logger.info('Audit log created', { action, resource, userId: user.userId });
        } catch (error) {
          logger.error('Failed to create audit log:', error);
        }
      });

      return originalJson(data);
    };

    next();
  };
};

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const {
    userId,
    action,
    resource,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = filters;

  const query: any = {};

  if (userId) query.userId = userId;
  if (action) query.action = action;
  if (resource) query.resource = resource;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate('userId', 'email profile.firstName profile.lastName');

  const total = await AuditLog.countDocuments(query);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
