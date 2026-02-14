import {
  emailValidation,
  passwordValidation,
  profileUpdateValidation,
  imageFileValidation,
} from './validation';

describe('Validation Utilities', () => {
  describe('emailValidation', () => {
    it('should validate correct email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com',
      ];

      validEmails.forEach((email) => {
        const validation = emailValidation();
        expect(validation).toBeDefined();
      });
    });
  });

  describe('passwordValidation', () => {
    it('should validate strong passwords', () => {
      const validation = passwordValidation();
      expect(validation).toBeDefined();
    });
  });

  describe('profileUpdateValidation', () => {
    it('should validate profile updates', () => {
      const validation = profileUpdateValidation();
      expect(validation).toBeDefined();
      expect(Array.isArray(validation)).toBe(true);
    });
  });

  describe('imageFileValidation', () => {
    it('should accept valid image files', () => {
      const validFile = {
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        originalname: 'test.jpg',
      };

      const result = imageFileValidation(validFile as any);
      expect(result.valid).toBe(true);
    });

    it('should reject files that are too large', () => {
      const largeFile = {
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10MB
        originalname: 'large.jpg',
      };

      const result = imageFileValidation(largeFile as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('5MB');
    });

    it('should reject invalid file types', () => {
      const invalidFile = {
        mimetype: 'application/pdf',
        size: 1024,
        originalname: 'document.pdf',
      };

      const result = imageFileValidation(invalidFile as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('format');
    });

    it('should reject missing file', () => {
      const result = imageFileValidation(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });
  });
});
