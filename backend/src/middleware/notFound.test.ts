import { notFound } from './notFound';
import { Request, Response, NextFunction } from 'express';

describe('Not Found Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/nonexistent',
      originalUrl: '/api/nonexistent',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('notFound', () => {
    it('should return 404 status', () => {
      notFound(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return error message', () => {
      notFound(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String),
        })
      );
    });

    it('should include request path in error', () => {
      notFound(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('/api/nonexistent'),
        })
      );
    });
  });
});
