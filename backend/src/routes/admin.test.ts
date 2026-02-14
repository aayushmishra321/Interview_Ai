import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import User from '../models/User';
import Interview from '../models/Interview';
import Resume from '../models/Resume';
import { createTestUser, createTestInterview, cleanupTestData, generateUniqueEmail } from '../test/helpers';
import adminRouter from './admin';

describe('Admin Routes', () => {
  let adminUser: any;
  let regularUser: any;
  let adminApp: express.Application;
  let userApp: express.Application;

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
    
    // Create test users
    adminUser = await createTestUser({
      auth: { role: 'admin', isVerified: true },
    });
    regularUser = await createTestUser({
      auth: { role: 'user', isVerified: true },
    });
    
    // Create admin app with middleware that injects admin user
    adminApp = express();
    adminApp.use(express.json());
    adminApp.use((req: any, res, next) => {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        req.user = {
          userId: adminUser._id.toString(),
          email: adminUser.email,
          role: 'admin',
        };
      }
      next();
    });
    // Simple requireAdmin check
    adminApp.use((req: any, res, next) => {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
      return next();
    });
    adminApp.use(adminRouter);
    
    // Create regular user app
    userApp = express();
    userApp.use(express.json());
    userApp.use((req: any, res, next) => {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        req.user = {
          userId: regularUser._id.toString(),
          email: regularUser.email,
          role: 'user',
        };
      }
      next();
    });
    // Simple requireAdmin check
    userApp.use((req: any, res, next) => {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
      return next();
    });
    userApp.use(adminRouter);
  });

  describe('GET /api/admin/stats', () => {
    it('should get platform statistics with real data', async () => {
      // Create some test data
      await createTestInterview(regularUser._id, {
        type: 'technical',
        status: 'completed',
        analysis: { overallScore: 85 },
      });

      const response = await request(adminApp)
        .get('/stats')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('interviews');
      expect(response.body.data.users.total).toBeGreaterThanOrEqual(2); // admin + regular user
      expect(response.body.data.interviews.total).toBeGreaterThanOrEqual(1);
    });

    it('should deny access to non-admin users', async () => {
      const response = await request(userApp)
        .get('/stats')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should get all users with pagination and real data', async () => {
      const response = await request(adminApp)
        .get('/users?page=1&limit=10')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2); // admin + regular user
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('should search users by email with real data', async () => {
      const response = await request(adminApp)
        .get(`/users?search=${adminUser.email.split('@')[0]}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].email).toContain(adminUser.email.split('@')[0]);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should get specific user details with real data', async () => {
      // Create interview for the user
      await createTestInterview(regularUser._id, {
        type: 'technical',
        status: 'completed',
      });

      const response = await request(adminApp)
        .get(`/users/${regularUser._id}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(regularUser.email);
      expect(response.body.data.interviews).toBeInstanceOf(Array);
      expect(response.body.data.interviews.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(adminApp)
        .get(`/users/${fakeId}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user with real data', async () => {
      const updates = {
        subscription: { plan: 'pro', status: 'active' },
        auth: { role: 'user' },
      };

      const response = await request(adminApp)
        .put(`/users/${regularUser._id}`)
        .set('Authorization', 'Bearer admin-token')
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription.plan).toBe('pro');
      
      // Verify in database
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser?.subscription.plan).toBe('pro');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user and associated data with real data', async () => {
      // Create interview for the user
      const interview = await createTestInterview(regularUser._id, {
        type: 'technical',
        status: 'completed',
      });

      const response = await request(adminApp)
        .delete(`/users/${regularUser._id}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify user is deleted
      const deletedUser = await User.findById(regularUser._id);
      expect(deletedUser).toBeNull();
      
      // Verify interview is deleted
      const deletedInterview = await Interview.findById(interview._id);
      expect(deletedInterview).toBeNull();
    });
  });

  describe('GET /api/admin/interviews', () => {
    it('should get all interviews with real data', async () => {
      await createTestInterview(regularUser._id, {
        type: 'technical',
        status: 'completed',
      });
      await createTestInterview(adminUser._id, {
        type: 'behavioral',
        status: 'in-progress',
      });

      const response = await request(adminApp)
        .get('/interviews')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by status with real data', async () => {
      await createTestInterview(regularUser._id, {
        type: 'technical',
        status: 'completed',
      });
      await createTestInterview(adminUser._id, {
        type: 'behavioral',
        status: 'in-progress',
      });

      const response = await request(adminApp)
        .get('/interviews?status=completed')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.every((i: any) => i.status === 'completed')).toBe(true);
    });
  });

  describe('GET /api/admin/system-metrics', () => {
    it('should get system metrics with real data', async () => {
      const response = await request(adminApp)
        .get('/system-metrics')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('cpu');
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('database');
      expect(typeof response.body.data.cpu).toBe('number');
      expect(typeof response.body.data.memory).toBe('number');
    });
  });

  describe('GET /api/admin/activity', () => {
    it('should get recent activity with real data', async () => {
      await createTestInterview(regularUser._id, {
        type: 'technical',
        status: 'completed',
        analysis: { overallScore: 85 },
      });

      const response = await request(adminApp)
        .get('/activity')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('user');
      expect(response.body.data[0]).toHaveProperty('action');
    });
  });

  describe('GET /api/admin/ai-metrics', () => {
    it('should get AI performance metrics with real data', async () => {
      await createTestInterview(regularUser._id, {
        type: 'technical',
        status: 'completed',
        analysis: { overallScore: 85 },
      });

      const response = await request(adminApp)
        .get('/ai-metrics')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accuracy');
      expect(response.body.data).toHaveProperty('totalAnalyzed');
      expect(response.body.data.totalAnalyzed).toBeGreaterThanOrEqual(1);
    });
  });

  // ==================== RESUME MANAGEMENT TESTS ====================

  describe('GET /api/admin/resumes', () => {
    it('should get all resumes with pagination and real data', async () => {
      const Resume = require('../models/Resume').default;
      const { createTestResume } = require('../test/helpers');
      
      // Create test resumes
      await createTestResume(regularUser._id, { filename: 'resume1.pdf' });
      await createTestResume(adminUser._id, { filename: 'resume2.pdf' });

      const response = await request(adminApp)
        .get('/resumes?page=1&limit=10')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('should search resumes by filename with real data', async () => {
      const { createTestResume } = require('../test/helpers');
      
      await createTestResume(regularUser._id, { filename: 'john-doe-resume.pdf' });
      await createTestResume(adminUser._id, { filename: 'jane-smith-resume.pdf' });

      const response = await request(adminApp)
        .get('/resumes?search=john')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].filename).toContain('john');
    });
  });

  describe('GET /api/admin/resumes/:id', () => {
    it('should get specific resume details with real data', async () => {
      const { createTestResume } = require('../test/helpers');
      
      const resume = await createTestResume(regularUser._id, {
        filename: 'test-resume.pdf',
        parsedData: {
          name: 'Test User',
          skills: ['JavaScript', 'TypeScript'],
        },
      });

      const response = await request(adminApp)
        .get(`/resumes/${resume._id}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.filename).toBe('test-resume.pdf');
      expect(response.body.data.userId).toBeDefined();
    });

    it('should return 404 for non-existent resume', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(adminApp)
        .get(`/resumes/${fakeId}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Resume not found');
    });
  });

  describe('DELETE /api/admin/resumes/:id', () => {
    it('should delete resume with real data', async () => {
      const { createTestResume } = require('../test/helpers');
      const Resume = require('../models/Resume').default;
      
      const resume = await createTestResume(regularUser._id, {
        filename: 'to-delete.pdf',
      });

      const response = await request(adminApp)
        .delete(`/resumes/${resume._id}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Resume deleted successfully');
      
      // Verify resume is deleted
      const deletedResume = await Resume.findById(resume._id);
      expect(deletedResume).toBeNull();
    });

    it('should return 404 when deleting non-existent resume', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(adminApp)
        .delete(`/resumes/${fakeId}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== INTERVIEW DETAIL MANAGEMENT TESTS ====================

  describe('GET /api/admin/interviews/:id', () => {
    it('should get specific interview details with real data', async () => {
      const interview = await createTestInterview(regularUser._id, {
        type: 'technical',
        status: 'completed',
        analysis: { overallScore: 90 },
      });

      const response = await request(adminApp)
        .get(`/interviews/${interview._id}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('technical');
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.userId).toBeDefined();
    });

    it('should return 404 for non-existent interview', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(adminApp)
        .get(`/interviews/${fakeId}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Interview not found');
    });
  });

  describe('PUT /api/admin/interviews/:id', () => {
    it('should update interview with real data', async () => {
      const interview = await createTestInterview(regularUser._id, {
        type: 'technical',
        status: 'scheduled',
      });

      const updates = {
        status: 'completed',
        type: 'behavioral',
      };

      const response = await request(adminApp)
        .put(`/interviews/${interview._id}`)
        .set('Authorization', 'Bearer admin-token')
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.type).toBe('behavioral');
      
      // Verify in database
      const updatedInterview = await Interview.findById(interview._id);
      expect(updatedInterview?.status).toBe('completed');
      expect(updatedInterview?.type).toBe('behavioral');
    });

    it('should return 404 when updating non-existent interview', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(adminApp)
        .put(`/interviews/${fakeId}`)
        .set('Authorization', 'Bearer admin-token')
        .send({ status: 'completed' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/admin/interviews/:id', () => {
    it('should delete interview with real data', async () => {
      const interview = await createTestInterview(regularUser._id, {
        type: 'technical',
        status: 'completed',
      });

      const response = await request(adminApp)
        .delete(`/interviews/${interview._id}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Interview deleted successfully');
      
      // Verify interview is deleted
      const deletedInterview = await Interview.findById(interview._id);
      expect(deletedInterview).toBeNull();
    });

    it('should return 404 when deleting non-existent interview', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(adminApp)
        .delete(`/interviews/${fakeId}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== BULK OPERATIONS TESTS ====================

  describe('POST /api/admin/users/bulk-delete', () => {
    it('should bulk delete users and their data with real data', async () => {
      // Create test users
      const user1 = await createTestUser({ email: generateUniqueEmail('bulk1') });
      const user2 = await createTestUser({ email: generateUniqueEmail('bulk2') });
      
      // Create interviews for these users
      await createTestInterview(user1._id, { type: 'technical' });
      await createTestInterview(user2._id, { type: 'behavioral' });

      const response = await request(adminApp)
        .post('/users/bulk-delete')
        .set('Authorization', 'Bearer admin-token')
        .send({ userIds: [user1._id.toString(), user2._id.toString()] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Successfully deleted');
      
      // Verify users are deleted
      const deletedUser1 = await User.findById(user1._id);
      const deletedUser2 = await User.findById(user2._id);
      expect(deletedUser1).toBeNull();
      expect(deletedUser2).toBeNull();
      
      // Verify interviews are deleted
      const interviews = await Interview.find({ userId: { $in: [user1._id, user2._id] } });
      expect(interviews.length).toBe(0);
    });

    it('should return error for invalid request', async () => {
      const response = await request(adminApp)
        .post('/users/bulk-delete')
        .set('Authorization', 'Bearer admin-token')
        .send({ userIds: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('userIds array is required');
    });

    it('should return error when userIds is not an array', async () => {
      const response = await request(adminApp)
        .post('/users/bulk-delete')
        .set('Authorization', 'Bearer admin-token')
        .send({ userIds: 'not-an-array' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== EXPORT FEATURES TESTS ====================

  describe('GET /api/admin/export/users', () => {
    it('should export users to CSV with real data', async () => {
      const response = await request(adminApp)
        .get('/export/users')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('users.csv');
      expect(response.text).toContain('Email,First Name,Last Name');
      expect(response.text).toContain(adminUser.email);
      expect(response.text).toContain(regularUser.email);
    });
  });

  describe('GET /api/admin/export/interviews', () => {
    it('should export interviews to CSV with real data', async () => {
      await createTestInterview(regularUser._id, {
        type: 'technical',
        status: 'completed',
        analysis: { overallScore: 85 },
      });

      const response = await request(adminApp)
        .get('/export/interviews')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('interviews.csv');
      expect(response.text).toContain('User Email,Type,Status,Score');
      expect(response.text).toContain('technical');
      expect(response.text).toContain('completed');
    });
  });
});
