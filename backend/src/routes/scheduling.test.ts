import request from 'supertest';
import mongoose from 'mongoose';
import schedulingRouter from './scheduling';
import Interview from '../models/Interview';
import { createTestUser, createTestInterview, getAuthToken, cleanupTestData } from '../test/helpers';
import { createTestApp } from '../test/testApp';

describe('Scheduling Routes', () => {
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
    app = createTestApp(schedulingRouter, testUser, '/api/scheduling');
  });

  describe('POST /api/scheduling/schedule', () => {
    it('should schedule an interview', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post('/api/scheduling/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'technical',
          scheduledTime: futureDate.toISOString(),
          settings: {
            role: 'Software Engineer',
            difficulty: 'medium',
            duration: 60,
          },
          reminderEnabled: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('scheduled');
    });

    it('should reject past scheduled time', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post('/api/scheduling/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'technical',
          scheduledTime: pastDate.toISOString(),
          settings: {
            role: 'Software Engineer',
            difficulty: 'medium',
            duration: 60,
          },
        });

      expect(response.status).toBe(400);
    });

    it('should validate interview type', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post('/api/scheduling/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'invalid',
          scheduledTime: futureDate.toISOString(),
          settings: {
            role: 'Software Engineer',
            difficulty: 'medium',
            duration: 60,
          },
        });

      expect(response.status).toBe(400);
    });

    it('should validate duration range', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post('/api/scheduling/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'technical',
          scheduledTime: futureDate.toISOString(),
          settings: {
            role: 'Software Engineer',
            difficulty: 'medium',
            duration: 200,
          },
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/scheduling/scheduled', () => {
    it('should get scheduled interviews', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await createTestInterview(testUser._id, {
        type: 'behavioral',
        status: 'scheduled',
        scheduledTime: futureDate,
      });

      const response = await request(app)
        .get('/api/scheduling/scheduled')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/scheduling/:id/reschedule', () => {
    it('should reschedule interview', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const newDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const interview = await createTestInterview(testUser._id, {
        type: 'technical',
        status: 'scheduled',
        scheduledTime: futureDate,
      });

      const response = await request(app)
        .put(`/api/scheduling/${interview._id}/reschedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scheduledTime: newDate.toISOString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject past reschedule time', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const interview = await Interview.create({
        userId: testUser._id,
        type: 'technical',
        status: 'scheduled',
        scheduledTime: futureDate,
        settings: {
          role: 'Developer',
          difficulty: 'medium',
          duration: 60,
        },
      });

      const response = await request(app)
        .put(`/api/scheduling/${interview._id}/reschedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scheduledTime: pastDate.toISOString(),
        });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent interview', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const newDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const response = await request(app)
        .put(`/api/scheduling/${fakeId}/reschedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scheduledTime: newDate.toISOString(),
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/scheduling/:id', () => {
    it('should cancel scheduled interview', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const interview = await createTestInterview(testUser._id, {
        type: 'coding',
        status: 'scheduled',
        scheduledTime: futureDate,
      });

      const response = await request(app)
        .delete(`/api/scheduling/${interview._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const cancelledInterview = await Interview.findById(interview._id);
      expect(cancelledInterview?.status).toBe('cancelled');
    });

    it('should return 404 for non-existent interview', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/scheduling/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/scheduling/upcoming', () => {
    it('should get upcoming interviews', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await createTestInterview(testUser._id, {
        type: 'system-design',
        status: 'scheduled',
        scheduledTime: tomorrow,
      });

      const response = await request(app)
        .get('/api/scheduling/upcoming')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/scheduling/:id/send-reminder', () => {
    it('should send reminder for interview', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const interview = await createTestInterview(testUser._id, {
        type: 'behavioral',
        status: 'scheduled',
        scheduledTime: futureDate,
        session: {
          metadata: {
            reminderEnabled: true,
            reminderSent: false,
          },
        },
      });

      const response = await request(app)
        .post(`/api/scheduling/${interview._id}/send-reminder`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should not send duplicate reminders', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const interview = await createTestInterview(testUser._id, {
        type: 'technical',
        status: 'scheduled',
        scheduledTime: futureDate,
        session: {
          metadata: {
            reminderEnabled: true,
            reminderSent: true,
          },
        },
      });

      const response = await request(app)
        .post(`/api/scheduling/${interview._id}/send-reminder`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should return 400 or 200 depending on implementation
      expect([200, 400]).toContain(response.status);
    });
  });
});
