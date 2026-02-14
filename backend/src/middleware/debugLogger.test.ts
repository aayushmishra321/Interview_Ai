import { debugLogger } from './debugLogger';
import { Request, Response, NextFunction } from 'express';

describe('Debug Logger Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/test',
      query: {},
      body: {},
      headers: {},
      ip: '127.0.0.1',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      on: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('debugLogger', () => {
    it('should log request and call next', () => {
      debugLogger(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle POST requests', () => {
      mockReq.method = 'POST';
      mockReq.body = { test: 'data' };
      debugLogger(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests with query params', () => {
      mockReq.query = { page: '1', limit: '10' };
      debugLogger(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
