import nodemailer from 'nodemailer';

// Mock nodemailer before importing email service
const mockSendMail = jest.fn();
const mockVerify = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
    verify: mockVerify,
  })),
}));

// Mock logger to avoid console output during tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Set environment variables before importing email service
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASSWORD = 'test-password';
process.env.EMAIL_SERVICE = 'gmail';
process.env.EMAIL_HOST = 'smtp.gmail.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_SECURE = 'false';
process.env.EMAIL_FROM_NAME = 'Smart Interview AI';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Import email service after mocks and env vars are set
import emailService from './email';
import logger from '../utils/logger';

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id-123' });
    mockVerify.mockResolvedValue(true);
  });

  describe('Initialization', () => {
    it('should check if service is ready', () => {
      const isReady = emailService.isReady();
      expect(isReady).toBe(true);
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully with all options', async () => {
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        text: 'Test text content',
      };

      const result = await emailService.sendEmail(options);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          from: expect.stringContaining('Smart Interview AI'),
        })
      );
    });

    it('should send email with HTML only (auto-generate text)', async () => {
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
      };

      const result = await emailService.sendEmail(options);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Test HTML content', // HTML tags stripped
        })
      );
    });

    it('should handle email sending failure', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP connection failed'));

      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      const result = await emailService.sendEmail(options);

      expect(result).toBe(false);
    });

    it('should use correct from address', async () => {
      const options = {
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      await emailService.sendEmail(options);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Smart Interview AI" <test@example.com>',
        })
      );
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct content', async () => {
      const email = 'newuser@example.com';
      const token = 'verification-token-123';

      const result = await emailService.sendVerificationEmail(email, token);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Verify Your Email - Smart Interview AI',
          html: expect.stringContaining('Welcome to Smart Interview AI'),
        })
      );

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(`verify-email?token=${token}`);
      expect(callArgs.html).toContain('Verify Email Address');
      expect(callArgs.html).toContain('This link will expire in 24 hours');
    });

    it('should include verification URL in email', async () => {
      const email = 'test@example.com';
      const token = 'abc123';

      await emailService.sendVerificationEmail(email, token);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(`${process.env.FRONTEND_URL}/verify-email?token=${token}`);
    });

    it('should handle verification email sending failure', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Network error'));

      const result = await emailService.sendVerificationEmail(
        'test@example.com',
        'token123'
      );

      expect(result).toBe(false);
    });

    it('should include security information', async () => {
      await emailService.sendVerificationEmail('test@example.com', 'token');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain("If you didn't create an account");
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct content', async () => {
      const email = 'user@example.com';
      const token = 'reset-token-456';

      const result = await emailService.sendPasswordResetEmail(email, token);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Reset Your Password - Smart Interview AI',
          html: expect.stringContaining('Password Reset Request'),
        })
      );

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(`reset-password?token=${token}`);
      expect(callArgs.html).toContain('Reset Password');
      expect(callArgs.html).toContain('This link will expire in 1 hour');
      expect(callArgs.html).toContain('Security Notice');
    });

    it('should include reset URL in email', async () => {
      const email = 'test@example.com';
      const token = 'xyz789';

      await emailService.sendPasswordResetEmail(email, token);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(`${process.env.FRONTEND_URL}/reset-password?token=${token}`);
    });

    it('should include security warnings in reset email', async () => {
      await emailService.sendPasswordResetEmail('test@example.com', 'token');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Security Notice');
      expect(callArgs.html).toContain("If you didn't request this reset");
    });

    it('should handle password reset email sending failure', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      const result = await emailService.sendPasswordResetEmail(
        'test@example.com',
        'token123'
      );

      expect(result).toBe(false);
    });

    it('should include expiration warning', async () => {
      await emailService.sendPasswordResetEmail('test@example.com', 'token');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('expire');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct content', async () => {
      const email = 'newuser@example.com';
      const firstName = 'John';

      const result = await emailService.sendWelcomeEmail(email, firstName);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Welcome to Smart Interview AI! 🚀',
          html: expect.stringContaining('Welcome to Smart Interview AI'),
        })
      );

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(`Hi ${firstName}`);
      expect(callArgs.html).toContain('Your email has been verified');
    });

    it('should include feature highlights in welcome email', async () => {
      await emailService.sendWelcomeEmail('test@example.com', 'Jane');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Upload Your Resume');
      expect(callArgs.html).toContain('Practice Interviews');
      expect(callArgs.html).toContain('Track Progress');
    });

    it('should include dashboard link in welcome email', async () => {
      await emailService.sendWelcomeEmail('test@example.com', 'Test');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(`${process.env.FRONTEND_URL}/dashboard`);
      expect(callArgs.html).toContain('Go to Dashboard');
    });

    it('should handle welcome email sending failure', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Connection timeout'));

      const result = await emailService.sendWelcomeEmail(
        'test@example.com',
        'User'
      );

      expect(result).toBe(false);
    });

    it('should personalize with user first name', async () => {
      const firstName = 'Alice';
      await emailService.sendWelcomeEmail('alice@example.com', firstName);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(`Hi ${firstName}`);
    });
  });

  describe('testConnection', () => {
    it('should test email connection successfully', async () => {
      const result = await emailService.testConnection();

      expect(result).toBe(true);
      expect(mockVerify).toHaveBeenCalled();
    });

    it('should handle connection test failure', async () => {
      mockVerify.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await emailService.testConnection();

      expect(result).toBe(false);
    });

    it('should verify transporter configuration', async () => {
      await emailService.testConnection();

      expect(mockVerify).toHaveBeenCalledTimes(1);
    });
  });

  describe('Email Templates', () => {
    it('should use consistent styling across all email templates', async () => {
      await emailService.sendVerificationEmail('test@example.com', 'token1');
      await emailService.sendPasswordResetEmail('test@example.com', 'token2');
      await emailService.sendWelcomeEmail('test@example.com', 'User');

      const calls = mockSendMail.mock.calls;
      
      calls.forEach((call) => {
        const html = call[0].html;
        expect(html).toContain('font-family: Arial, sans-serif');
        expect(html).toContain('max-width: 600px');
        expect(html).toContain('© 2026 Smart Interview AI');
      });
    });

    it('should include proper HTML structure in all templates', async () => {
      await emailService.sendVerificationEmail('test@example.com', 'token');

      const html = mockSendMail.mock.calls[0][0].html;
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>');
    });

    it('should include gradient header in all templates', async () => {
      await emailService.sendVerificationEmail('test@example.com', 'token1');
      await emailService.sendPasswordResetEmail('test@example.com', 'token2');
      await emailService.sendWelcomeEmail('test@example.com', 'User');

      const calls = mockSendMail.mock.calls;
      
      calls.forEach((call) => {
        const html = call[0].html;
        expect(html).toContain('linear-gradient');
        expect(html).toContain('#6366f1');
      });
    });

    it('should include footer in all templates', async () => {
      await emailService.sendVerificationEmail('test@example.com', 'token');

      const html = mockSendMail.mock.calls[0][0].html;
      expect(html).toContain('footer');
      expect(html).toContain('2026');
    });
  });

  describe('Email Content', () => {
    it('should strip HTML tags for text version', async () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello <strong>World</strong></p>',
      };

      await emailService.sendEmail(options);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.text).toBe('Hello World');
    });

    it('should handle complex HTML in text conversion', async () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test',
        html: '<div><p>Line 1</p><p>Line 2</p></div>',
      };

      await emailService.sendEmail(options);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.text).not.toContain('<');
      expect(callArgs.text).not.toContain('>');
    });
  });

  describe('Error Scenarios', () => {
    it('should return false on network errors', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
    });

    it('should return false on authentication errors', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Invalid login'));

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
    });

    it('should handle timeout errors', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Timeout'));

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
    });
  });
});
