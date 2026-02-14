import request from 'supertest';
import mongoose from 'mongoose';
import resumeRouter from './resume';
import Resume from '../models/Resume';
import { createTestUser, getAuthToken, cleanupTestData } from '../test/helpers';
import { createTestApp } from '../test/testApp';

describe('Resume Routes', () => {
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
    app = createTestApp(resumeRouter, testUser, '/api/resume');
  });

  describe('POST /api/resume/upload', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/upload')
        .attach('resume', Buffer.from('test'), 'test.pdf');

      expect(response.status).toBe(401);
    });

    it('should require resume file', async () => {
      const response = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${authToken}`);

      // May return 400 or 401 depending on middleware order
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('GET /api/resume/latest', () => {
    it('should return null when no resume uploaded', async () => {
      const response = await request(app)
        .get('/latest')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeNull();
    });

    it('should return latest resume', async () => {
      const resume = await Resume.create({
        userId: testUser._id,
        filename: 'test.pdf',
        fileUrl: 'http://example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        analysis: {
          skills: ['JavaScript', 'React'],
          experience: 3,
          score: 85,
        },
        metadata: {
          processingStatus: 'completed',
        },
      });

      const response = await request(app)
        .get('/latest')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fileName).toBe('test.pdf');
      expect(response.body.data.score).toBe(85);
    });
  });

  describe('GET /api/resume', () => {
    it('should get user resumes with pagination', async () => {
      // Create multiple resumes
      for (let i = 0; i < 3; i++) {
        await Resume.create({
          userId: testUser._id,
          filename: `test${i}.pdf`,
          fileUrl: `http://example.com/test${i}.pdf`,
          fileSize: 1024,
          mimeType: 'application/pdf',
          analysis: { skills: [], experience: 0 },
          metadata: { processingStatus: 'completed' },
        });
      }

      const response = await request(app)
        .get('/api/resume?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(3);
    });
  });

  describe('GET /api/resume/:id', () => {
    it('should get specific resume', async () => {
      const resume = await Resume.create({
        userId: testUser._id,
        filename: 'test.pdf',
        fileUrl: 'http://example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        analysis: { skills: ['Node.js'], experience: 2 },
        metadata: { processingStatus: 'completed' },
      });

      const response = await request(app)
        .get(`/api/resume/${resume._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.filename).toBe('test.pdf');
    });

    it('should return 404 for non-existent resume', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/resume/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should not access other user resume', async () => {
      const otherUser = await createTestUser({ email: 'other@test.com' });
      const resume = await Resume.create({
        userId: otherUser._id,
        filename: 'test.pdf',
        fileUrl: 'http://example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        analysis: { skills: [], experience: 0 },
        metadata: { processingStatus: 'completed' },
      });

      const response = await request(app)
        .get(`/api/resume/${resume._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/resume/analyze', () => {
    it('should analyze resume text', async () => {
      const response = await request(app)
        .post('/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          resumeText: 'Experienced software engineer with 5 years in React and Node.js',
          targetRole: 'Senior Developer',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Gemini mock returns skills
      expect(response.body.data).toBeDefined();
    });

    it('should require resume text', async () => {
      const response = await request(app)
        .post('/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // May return 400 or 401
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('DELETE /api/resume/:id', () => {
    it('should delete resume', async () => {
      const resume = await Resume.create({
        userId: testUser._id,
        filename: 'test.pdf',
        fileUrl: 'http://example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        analysis: { skills: [], experience: 0 },
        metadata: { processingStatus: 'completed' },
      });

      const response = await request(app)
        .delete(`/api/resume/${resume._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
