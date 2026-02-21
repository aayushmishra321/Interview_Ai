import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { getRequestId } from './requestId';

/**
 * Error codes for consistent error handling
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'AUTH_001',
  FORBIDDEN = 'AUTH_002',
  TOKEN_EXPIRED = 'AUTH_003',
  INVALID_TOKEN = 'AUTH_004',
  
  // Validation
  VALIDATION_ERROR = 'VAL_001',
  INVALID_INPUT = 'VAL_002',
  MISSING_FIELD = 'VAL_003',
  
  // Resources
  NOT_FOUND = 'RES_001',
  ALREADY_EXISTS = 'RES_002',
  CONFLICT = 'RES_003',
  
  // Payment
  PAYMENT_FAILED = 'PAY_001',
  INVALID_SUBSCRIPTION = 'PAY_002',
  
  // File Upload
  FILE_TOO_LARGE = 'FILE_001',
  INVALID_FILE_TYPE = 'FILE_002',
  UPLOAD_FAILED = 'FILE_003',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_001',
  
  // Server Errors
  INTERNAL_ERROR = 'SRV_001',
  SERVICE_UNAVAILABLE = 'SRV_002',
  DATABASE_ERROR = 'SRV_003',
  EXTERNAL_SERVICE_ERROR = 'SRV_004',
}

/**
 * Sanitized error response structure
 */
interface SanitizedError {
  success: false;
  error: string;
  code: ErrorCode;
  message: string;
  requestId: string;
  timestamp: string;
  details?: any; // Only in development
}

/**
 * Error sanitization middleware
 * Prevents leaking internal implementation details in production
 */
export const errorSanitizerMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const requestId = getRequestId(req);
  
  // Log full error details internally
  logger.error('Error occurred:', {
    requestId,
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: (req as any).user?.userId,
  });

  // Determine error code and sanitized message
  let statusCode = err.statusCode || err.status || 500;
  let errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR;
  let sanitizedMessage = 'An unexpected error occurred';
  let errorType = 'Internal Server Error';

  // Map specific errors to codes and messages
  if (err.name === 'UnauthorizedError' || statusCode === 401) {
    errorCode = ErrorCode.UNAUTHORIZED;
    sanitizedMessage = 'Authentication required';
    errorType = 'Unauthorized';
    statusCode = 401;
  } else if (err.name === 'ForbiddenError' || statusCode === 403) {
    errorCode = ErrorCode.FORBIDDEN;
    sanitizedMessage = 'Access denied';
    errorType = 'Forbidden';
    statusCode = 403;
  } else if (err.name === 'ValidationError') {
    errorCode = ErrorCode.VALIDATION_ERROR;
    sanitizedMessage = 'Invalid input data';
    errorType = 'Validation Error';
    statusCode = 400;
  } else if (err.name === 'CastError' || err.name === 'MongoError') {
    errorCode = ErrorCode.DATABASE_ERROR;
    sanitizedMessage = 'Database operation failed';
    errorType = 'Database Error';
    statusCode = 500;
  } else if (err.message?.includes('not found') || statusCode === 404) {
    errorCode = ErrorCode.NOT_FOUND;
    sanitizedMessage = 'Resource not found';
    errorType = 'Not Found';
    statusCode = 404;
  } else if (err.message?.includes('already exists')) {
    errorCode = ErrorCode.ALREADY_EXISTS;
    sanitizedMessage = 'Resource already exists';
    errorType = 'Conflict';
    statusCode = 409;
  } else if (err.message?.includes('rate limit')) {
    errorCode = ErrorCode.RATE_LIMIT_EXCEEDED;
    sanitizedMessage = 'Too many requests, please try again later';
    errorType = 'Rate Limit Exceeded';
    statusCode = 429;
  } else if (err.message?.includes('file') || err.message?.includes('upload')) {
    errorCode = ErrorCode.UPLOAD_FAILED;
    sanitizedMessage = 'File upload failed';
    errorType = 'Upload Error';
    statusCode = 400;
  } else if (err.message?.includes('payment') || err.message?.includes('stripe')) {
    errorCode = ErrorCode.PAYMENT_FAILED;
    sanitizedMessage = 'Payment processing failed';
    errorType = 'Payment Error';
    statusCode = 400;
  }

  // Build sanitized error response
  const errorResponse: SanitizedError = {
    success: false,
    error: errorType,
    code: errorCode,
    message: sanitizedMessage,
    requestId,
    timestamp: new Date().toISOString(),
  };

  // Include detailed error information only in development
  if (isDevelopment) {
    errorResponse.details = {
      originalMessage: err.message,
      stack: err.stack,
      name: err.name,
    };
  }

  // Send sanitized error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Create application error with code
 */
export class AppError extends Error {
  public override message: string;
  public statusCode: number;
  public code: ErrorCode;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR
  ) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
