import request from 'supertest';
import mongoose from 'mongoose';
import userRouter from './user';
import User from '../models/User';
import { createTestUser, createTestInterview, getAuthToken, cleanupTestData } from '../test/helpers';
import { createTestApp } from '../test/testApp';

describe('User Routes', () => {
  let testUser: any;
  let authToken: string;
  let app: any;

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
    testUser = await createTestUser();
    authToken = getAuthToken(testUser);
    // Create app with test auth middleware that injects testUser
    app = createTestApp(userRouter, testUser, '/api/user');
  });

  describe('GET /api/user/profile', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 401 without authentication', async () => {
      // Create app without test user to test 401
      const unauthApp = createTestApp(userRouter, undefined, '/api/user');
      const response = await request(unauthApp).get('/api/user/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/user/profile', () => {
    it('should update user profile', async () => {
      const updates = {
        profile: {
          firstName: 'Updated',
          lastName: 'Name',
          phone: '+1234567890',
        },
      };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.profile.firstName).toBe('Updated');
      expect(response.body.data.profile.lastName).toBe('Name');
    });

    it('should update preferences', async () => {
      const updates = {
        preferences: {
          role: 'Senior Developer',
          experienceLevel: 'senior',
          industries: ['Tech', 'Finance'],
        },
      };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.data.preferences.role).toBe('Senior Developer');
      expect(response.body.data.preferences.experienceLevel).toBe('senior');
    });
  });

  describe('GET /api/user/stats', () => {
    it('should get user statistics', async () => {
      // Create test interview with required fields
      await createTestInterview(testUser._id, {
        type: 'technical',
        status: 'completed',
        analysis: { overallScore: 85 },
        session: { actualDuration: 30 },
      });

      const response = await request(app)
        .get('/api/user/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalInterviews');
      expect(response.body.data).toHaveProperty('averageScore');
    });
  });

  describe('PUT /api/user/preferences', () => {
    it('should update user preferences', async () => {
      const preferences = {
        role: 'Full Stack Developer',
        experienceLevel: 'mid',
        industries: ['Technology'],
        interviewTypes: ['technical', 'behavioral'],
      };

      const response = await request(app)
        .put('/api/user/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preferences);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('Full Stack Developer');
    });

    it('should validate experience level', async () => {
      const preferences = {
        experienceLevel: 'invalid',
      };

      const response = await request(app)
        .put('/api/user/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preferences);

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/user/account', () => {
    it('should delete user account', async () => {
      const response = await request(app)
        .delete('/api/user/account')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();
    });
  });
});
