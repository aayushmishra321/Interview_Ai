import { cache } from './cache';
import { Request, Response, NextFunction } from 'express';
import redisService from '../services/redis';

jest.mock('../services/redis', () => ({
  __esModule: true,
  default: {
    isHealthy: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  },
}));

describe('Cache Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      originalUrl: '/api/test',
      url: '/api/test',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn() as jest.MockedFunction<NextFunction>;
    jest.clearAllMocks();
  });

  describe('cache', () => {
    it('should be defined', () => {
      expect(cache).toBeDefined();
      expect(typeof cache).toBe('function');
    });

    it('should skip caching for non-GET requests', async () => {
      mockReq.method = 'POST';
      const middleware = cache(300);
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip caching when Redis is not healthy', async () => {
      (redisService.isHealthy as jest.Mock).mockReturnValue(false);
      const middleware = cache(300);
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next when no cached data', async () => {
      (redisService.isHealthy as jest.Mock).mockReturnValue(true);
      (redisService.get as jest.Mock).mockResolvedValue(null);
      const middleware = cache(300);
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return cached data when available', async () => {
      const cachedData = { data: 'test' };
      (redisService.isHealthy as jest.Mock).mockReturnValue(true);
      (redisService.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));
      const middleware = cache(300);
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.json).toHaveBeenCalledWith(cachedData);
    });
  });
});
