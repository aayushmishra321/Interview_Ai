import { notFound } from './notFound';
import { Request, Response } from 'express';

describe('Not Found Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

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
  });

  describe('notFound', () => {
    it('should return 404 status', () => {
      notFound(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return error message', () => {
      notFound(mockReq as Request, mockRes as Response);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String),
        })
      );
    });

    it('should include request path in error', () => {
      notFound(mockReq as Request, mockRes as Response);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});
