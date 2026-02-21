import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireAdmin } from './auth';
import { createMockRequest, createMockResponse, createMockNext } from '../test/helpers';
import User from '../models/User';

jest.mock('../models/User');

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', async () => {
      const token = jwt.sign(
        { userId: '123', email: 'test@example.com', role: 'user' },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: '1h' }
      );

      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        subscription: { plan: 'free' },
        isAccountLocked: jest.fn().mockReturnValue(false),
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('123');
    });

    it('should reject missing token', async () => {
      const req = createMockRequest({ headers: {} });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      const req = createMockRequest({
        headers: { authorization: 'Bearer invalid_token' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      const token = jwt.sign(
        { userId: '123', email: 'test@example.com', role: 'user' },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: '-1h' }
      );

      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin users', async () => {
      const mockUser = {
        _id: '123',
        email: 'admin@test.com',
        auth: { role: 'admin' },
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const req = createMockRequest({
        user: { userId: '123', email: 'admin@test.com', role: 'admin' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject non-admin users', async () => {
      const mockUser = {
        _id: '123',
        email: 'user@test.com',
        auth: { role: 'user' },
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const req = createMockRequest({
        user: { userId: '123', email: 'user@test.com', role: 'user' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject missing user', async () => {
      const req = createMockRequest({ user: undefined });
      const res = createMockResponse();
      const next = createMockNext();

      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
