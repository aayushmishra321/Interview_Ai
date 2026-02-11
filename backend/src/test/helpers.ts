import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';

/**
 * Test helper utilities for Jest tests
 */

// Create valid MongoDB ObjectIds for testing
export const createTestObjectId = () => new mongoose.Types.ObjectId();

// Mock user data
export const mockUser = {
  id: createTestObjectId(),
  userId: createTestObjectId().toString(),
  email: 'test@example.com',
  role: 'user',
};

export const mockAdminUser = {
  id: createTestObjectId(),
  userId: createTestObjectId().toString(),
  email: 'admin@example.com',
  role: 'admin',
};

/**
 * Mock authentication middleware that injects a test user
 */
export const mockAuthMiddleware = (user = mockUser) => {
  return (req: any, res: Response, next: NextFunction) => {
    req.user = user;
    next();
  };
};

/**
 * Mock admin authentication middleware
 */
export const mockAdminMiddleware = (user = mockAdminUser) => {
  return (req: any, res: Response, next: NextFunction) => {
    req.user = user;
    next();
  };
};

/**
 * Create a mock Express request
 */
export const createMockRequest = (overrides: any = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: mockUser,
    ...overrides,
  } as any;
};

/**
 * Create a mock Express response
 */
export const createMockResponse = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendFile: jest.fn().mockReturnThis(),
    download: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
};

/**
 * Create a mock Next function
 */
export const createMockNext = () => jest.fn() as NextFunction;

/**
 * Mock Mongoose query chain
 */
export const createMockQuery = (resolvedValue: any = []) => {
  const query: any = {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(resolvedValue),
  };
  
  // Make the query thenable so it can be awaited directly
  query.then = (resolve: any) => {
    return Promise.resolve(resolvedValue).then(resolve);
  };
  
  return query;
};

/**
 * Wait for all promises to resolve
 */
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

/**
 * Clean up test data
 */
export const cleanupTestData = async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};
