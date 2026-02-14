import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireAdmin } from './auth';
import { createMockRequest, createMockResponse, createMockNext } from '../test/helpers';

describe('Auth Middleware', () => {
  describe('authenticateToken', () => {
    it('should authenticate valid token', () => {
      const token = jwt.sign(
        { userId: '123', email: 'test@example.com', role: 'user' },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: '1h' }
      );

      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('123');
    });

    it('should reject missing token', () => {
      const req = createMockRequest({ headers: {} });
      const res = createMockResponse();
      const next = createMockNext();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      const req = createMockRequest({
        headers: { authorization: 'Bearer invalid_token' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired token', () => {
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

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin users', () => {
      const req = createMockRequest({
        user: { userId: '123', email: 'admin@test.com', role: 'admin' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject non-admin users', () => {
      const req = createMockRequest({
        user: { userId: '123', email: 'user@test.com', role: 'user' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject missing user', () => {
      const req = createMockRequest({ user: undefined });
      const res = createMockResponse();
      const next = createMockNext();

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
