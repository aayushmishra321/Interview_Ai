import { apiLimiter, authLimiter, passwordResetLimiter } from './rateLimiter';
import { Request, Response, NextFunction } from 'express';

describe('Rate Limiter Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      ip: '192.168.1.1',
      headers: {},
      method: 'GET',
      path: '/api/test',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('apiLimiter', () => {
    it('should be defined', () => {
      expect(apiLimiter).toBeDefined();
      expect(typeof apiLimiter).toBe('function');
    });

    it('should allow requests within limit', (done) => {
      apiLimiter(mockReq as Request, mockRes as Response, () => {
        expect(mockNext).not.toHaveBeenCalled(); // We're using a custom next
        done();
      });
    });
  });

  describe('authLimiter', () => {
    it('should be defined', () => {
      expect(authLimiter).toBeDefined();
      expect(typeof authLimiter).toBe('function');
    });

    it('should allow requests within limit', (done) => {
      authLimiter(mockReq as Request, mockRes as Response, () => {
        expect(mockNext).not.toHaveBeenCalled(); // We're using a custom next
        done();
      });
    });
  });

  describe('passwordResetLimiter', () => {
    it('should be defined', () => {
      expect(passwordResetLimiter).toBeDefined();
      expect(typeof passwordResetLimiter).toBe('function');
    });

    it('should allow requests within limit', (done) => {
      passwordResetLimiter(mockReq as Request, mockRes as Response, () => {
        expect(mockNext).not.toHaveBeenCalled(); // We're using a custom next
        done();
      });
    });
  });
});
