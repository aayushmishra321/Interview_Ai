import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import authRouter from './auth';
import User from '../models/User';
import { cleanupTestData, generateUniqueEmail } from '../test/helpers';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth Routes', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db');
    }
  });

  afterAll(async () => {
    await cleanupTestData();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await cleanupTestData();
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        email: generateUniqueEmail('newuser'),
        password: 'Password123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        preferences: {
          role: 'Software Engineer',
          experienceLevel: 'mid',
          industries: ['Technology'],
          interviewTypes: ['technical'],
        },
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        email: generateUniqueEmail('duplicate'),
        password: 'Password123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should fail with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with weak password', async () => {
      const userData = {
        email: generateUniqueEmail('weak'),
        password: '123',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const userData = {
        email: generateUniqueEmail('incomplete'),
        // Missing password and profile
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    let testEmail: string;

    beforeEach(async () => {
      // Create a test user with a consistent email for this test suite
      testEmail = generateUniqueEmail('login');
      await User.create({
        email: testEmail,
        password: 'Password123!',
        profile: {
          firstName: 'Test',
          lastName: 'User',
        },
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testEmail);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: generateUniqueEmail('nonexistent'),
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should lock account after 5 failed attempts', async () => {
      // Create a separate user for this test to avoid affecting other tests
      const lockTestEmail = generateUniqueEmail('locktest');
      await User.create({
        email: lockTestEmail,
        password: 'Password123!',
        profile: {
          firstName: 'Lock',
          lastName: 'Test',
        },
      });

      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: lockTestEmail,
            password: 'WrongPassword!',
          });
      }

      // 6th attempt should return locked error
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: lockTestEmail,
          password: 'Password123!',
        })
        .expect(423);

      expect(response.body.error).toContain('locked');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    let testEmail: string;

    beforeEach(async () => {
      testEmail = generateUniqueEmail('forgot');
      await User.create({
        email: testEmail,
        password: 'Password123!',
        profile: {
          firstName: 'Test',
          lastName: 'User',
        },
      });
    });

    it('should send password reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testEmail,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('email exists');
    });

    it('should not reveal if email does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: generateUniqueEmail('nonexistent'),
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should return same message for security
      expect(response.body.message).toContain('email exists');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and get tokens
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: generateUniqueEmail('refresh'),
          password: 'Password123!',
          profile: {
            firstName: 'Test',
            lastName: 'User',
          },
        });

      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: generateUniqueEmail('logout'),
          password: 'Password123!',
          profile: {
            firstName: 'Test',
            lastName: 'User',
          },
        });

      accessToken = response.body.data.tokens.accessToken;
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail without authentication token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/create-profile', () => {
    it('should create profile for Auth0 user', async () => {
      const testEmail = generateUniqueEmail('auth0');
      const response = await request(app)
        .post('/api/auth/create-profile')
        .send({
          email: testEmail,
          profile: {
            firstName: 'Auth0',
            lastName: 'User',
          },
          preferences: {
            role: 'Developer',
            experienceLevel: 'senior',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testEmail);
    });

    it('should update existing Auth0 user profile', async () => {
      const testEmail = generateUniqueEmail('update');
      
      // Create initial profile
      await request(app)
        .post('/api/auth/create-profile')
        .send({
          email: testEmail,
          profile: {
            firstName: 'Initial',
            lastName: 'Name',
          },
        });

      // Update profile
      const response = await request(app)
        .post('/api/auth/create-profile')
        .send({
          email: testEmail,
          profile: {
            firstName: 'Updated',
            lastName: 'Name',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.firstName).toBe('Updated');
    });

    it('should fail without email', async () => {
      const response = await request(app)
        .post('/api/auth/create-profile')
        .send({
          profile: {
            firstName: 'No',
            lastName: 'Email',
          },
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
