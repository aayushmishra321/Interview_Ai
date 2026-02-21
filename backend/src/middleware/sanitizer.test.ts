import { xssProtection, validateInput } from './sanitizer';
import { createMockRequest, createMockResponse, createMockNext } from '../test/helpers';

describe('Sanitizer Middleware', () => {
  describe('xssProtection', () => {
    it('should sanitize script tags from body', () => {
      const req = createMockRequest({
        body: {
          name: 'Test<script>alert("xss")</script>',
          description: 'Normal text',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      xssProtection(req, res, next);

      expect(req.body.name).not.toContain('<script>');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize javascript: protocol', () => {
      const req = createMockRequest({
        body: {
          url: 'javascript:alert("xss")',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      xssProtection(req, res, next);

      expect(req.body.url).not.toContain('javascript:');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize event handlers', () => {
      const req = createMockRequest({
        body: {
          html: '<div onclick="alert()">Click me</div>',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      xssProtection(req, res, next);

      expect(req.body.html).not.toContain('onclick=');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize iframes', () => {
      const req = createMockRequest({
        body: {
          content: '<iframe src="evil.com"></iframe>',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      xssProtection(req, res, next);

      expect(req.body.content).not.toContain('<iframe');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize nested objects', () => {
      const req = createMockRequest({
        body: {
          user: {
            name: '<script>alert("xss")</script>',
            profile: {
              bio: 'javascript:void(0)',
            },
          },
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      xssProtection(req, res, next);

      expect(req.body.user.name).not.toContain('<script>');
      expect(req.body.user.profile.bio).not.toContain('javascript:');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize arrays', () => {
      const req = createMockRequest({
        body: {
          items: ['<script>alert()</script>', 'normal text'],
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      xssProtection(req, res, next);

      expect(req.body.items[0]).not.toContain('<script>');
      expect(req.body.items[1]).toBe('normal text');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize query parameters', () => {
      const req = createMockRequest({
        query: {
          search: '<script>alert("xss")</script>',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      xssProtection(req, res, next);

      expect(req.query.search).not.toContain('<script>');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateInput', () => {
    it('should allow normal length inputs', () => {
      const req = createMockRequest({
        body: {
          name: 'John Doe',
          description: 'A short description',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      validateInput(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject excessively long inputs', () => {
      const longString = 'a'.repeat(15000);
      const req = createMockRequest({
        body: {
          content: longString,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      validateInput(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should check nested object lengths', () => {
      const longString = 'a'.repeat(15000);
      const req = createMockRequest({
        body: {
          user: {
            bio: longString,
          },
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      validateInput(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
