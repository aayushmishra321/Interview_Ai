import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import interviewRouter from './interview';
import User from '../models/User';
import Interview from '../models/Interview';
import { createTestUser, getAuthToken, cleanupTestData } from '../test/helpers';
import { createTestApp } from '../test/testApp';

describe('Interview Routes', () => {
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
    app = createTestApp(interviewRouter, testUser, '/api/interview');
  });

  describe('POST /api/interview/create', () => {
    it('should create interview with valid data', async () => {
      const interviewData = {
        type: 'technical',
        settings: {
          role: 'Software Engineer',
          difficulty: 'medium',
          duration: 60,
          includeVideo: true,
          includeAudio: true,
          includeCoding: false,
        },
      };

      const response = await request(app)
        .post('/api/interview/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('technical');
      expect(response.body.data.questions).toBeDefined();
      expect(response.body.data.questions.length).toBeGreaterThan(0);
    });

    it('should fail with invalid interview type', async () => {
      const interviewData = {
        type: 'invalid-type',
        settings: {
          role: 'Software Engineer',
          difficulty: 'medium',
          duration: 60,
        },
      };

      const response = await request(app)
        .post('/api/interview/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interviewData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation failed');
    });

    it('should fail with invalid difficulty', async () => {
      const interviewData = {
        type: 'behavioral',
        settings: {
          role: 'Manager',
          difficulty: 'invalid',
          duration: 30,
        },
      };

      const response = await request(app)
        .post('/api/interview/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interviewData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with duration out of range', async () => {
      const interviewData = {
        type: 'coding',
        settings: {
          role: 'Developer',
          difficulty: 'hard',
          duration: 200, // Max is 120
        },
      };

      const response = await request(app)
        .post('/api/interview/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interviewData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const interviewData = {
        type: 'technical',
        settings: {
          role: 'Engineer',
          difficulty: 'medium',
          duration: 60,
        },
      };

      const response = await request(app)
        .post('/api/interview/create')
        .send(interviewData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/interview/:id/start', () => {
    let interviewId: string;

    beforeEach(async () => {
      const interview = await Interview.create({
        userId: testUser._id,
        type: 'technical',
        status: 'scheduled',
        settings: {
          role: 'Engineer',
          difficulty: 'medium',
          duration: 60,
        },
        questions: [
          {
            id: 'q1',
            text: 'Test question',
            type: 'technical',
            difficulty: 'medium',
            expectedDuration: 5,
          },
        ],
        responses: [],
      });
      interviewId = interview._id.toString();
    });

    it('should start interview successfully', async () => {
      const response = await request(app)
        .post(`/api/interview/${interviewId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.startTime).toBeDefined();
    });

    it('should fail to start non-existent interview', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .post(`/api/interview/${fakeId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail to start already started interview', async () => {
      // Start interview first time
      await request(app)
        .post(`/api/interview/${interviewId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to start again
      const response = await request(app)
        .post(`/api/interview/${interviewId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already started');
    });
  });

  describe('POST /api/interview/:id/end', () => {
    let interviewId: string;

    beforeEach(async () => {
      const interview = await Interview.create({
        userId: testUser._id,
        type: 'behavioral',
        status: 'in-progress',
        settings: {
          role: 'Manager',
          difficulty: 'easy',
          duration: 30,
        },
        questions: [],
        responses: [],
        session: {
          startTime: new Date(),
        },
      });
      interviewId = interview._id.toString();
    });

    it('should end interview successfully', async () => {
      const response = await request(app)
        .post(`/api/interview/${interviewId}/end`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.session.endTime).toBeDefined();
    });

    it('should calculate actual duration', async () => {
      const response = await request(app)
        .post(`/api/interview/${interviewId}/end`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.session.actualDuration).toBeDefined();
      expect(typeof response.body.data.session.actualDuration).toBe('number');
    });
  });

  describe('POST /api/interview/:id/response', () => {
    let interviewId: string;

    beforeEach(async () => {
      const interview = await Interview.create({
        userId: testUser._id,
        type: 'technical',
        status: 'in-progress',
        settings: {
          role: 'Engineer',
          difficulty: 'medium',
          duration: 60,
        },
        questions: [
          {
            id: 'q1',
            text: 'What is your experience with Node.js?',
            type: 'technical',
            difficulty: 'medium',
            expectedDuration: 5,
          },
        ],
        responses: [],
      });
      interviewId = interview._id.toString();
    });

    it('should submit response successfully', async () => {
      const responseData = {
        questionId: 'q1',
        answer: 'I have 5 years of experience with Node.js...',
        duration: 180,
      };

      const response = await request(app)
        .post(`/api/interview/${interviewId}/response`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(responseData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toBe(true);
    });

    it('should fail with missing required fields', async () => {
      const responseData = {
        questionId: 'q1',
        // Missing answer
      };

      const response = await request(app)
        .post(`/api/interview/${interviewId}/response`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(responseData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid question ID', async () => {
      const responseData = {
        questionId: 'invalid-id',
        answer: 'Some answer',
        duration: 180,
      };

      const response = await request(app)
        .post(`/api/interview/${interviewId}/response`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(responseData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/interview/history', () => {
    beforeEach(async () => {
      // Create multiple interviews
      await Interview.create([
        {
          userId: testUser._id,
          type: 'technical',
          status: 'completed',
          settings: {
            role: 'Engineer',
            difficulty: 'medium',
            duration: 60,
          },
          questions: [],
          responses: [],
        },
        {
          userId: testUser._id,
          type: 'behavioral',
          status: 'completed',
          settings: {
            role: 'Manager',
            difficulty: 'easy',
            duration: 30,
          },
          questions: [],
          responses: [],
        },
      ]);
    });

    it('should get interview history', async () => {
      const response = await request(app)
        .get('/api/interview/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/interview/history?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/interview/history?status=completed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((i: any) => i.status === 'completed')).toBe(true);
    });
  });

  describe('GET /api/interview/:id', () => {
    let interviewId: string;

    beforeEach(async () => {
      const interview = await Interview.create({
        userId: testUser._id,
        type: 'coding',
        status: 'scheduled',
        settings: {
          role: 'Developer',
          difficulty: 'hard',
          duration: 90,
        },
        questions: [],
        responses: [],
      });
      interviewId = interview._id.toString();
    });

    it('should get specific interview', async () => {
      const response = await request(app)
        .get(`/api/interview/${interviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(interviewId);
      expect(response.body.data.type).toBe('coding');
    });

    it('should fail to get non-existent interview', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/interview/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should not get another user\'s interview', async () => {
      // Create another user
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'Password123!',
        profile: {
          firstName: 'Other',
          lastName: 'User',
        },
      });

      // Create interview for other user
      const otherInterview = await Interview.create({
        userId: otherUser._id,
        type: 'technical',
        status: 'scheduled',
        settings: {
          role: 'Engineer',
          difficulty: 'medium',
          duration: 60,
        },
        questions: [],
        responses: [],
      });

      const response = await request(app)
        .get(`/api/interview/${otherInterview._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/interview/:id/feedback', () => {
    let interviewId: string;

    beforeEach(async () => {
      const interview = await Interview.create({
        userId: testUser._id,
        type: 'behavioral',
        status: 'completed',
        settings: {
          role: 'Manager',
          difficulty: 'medium',
          duration: 60,
        },
        questions: [
          {
            id: 'q1',
            text: 'Tell me about a time...',
            type: 'behavioral',
            difficulty: 'medium',
            expectedDuration: 5,
          },
        ],
        responses: [
          {
            questionId: 'q1',
            answer: 'In my previous role...',
            duration: 180,
            timestamp: new Date(),
          },
        ],
      });
      interviewId = interview._id.toString();
    });

    it('should generate feedback successfully', async () => {
      const response = await request(app)
        .post(`/api/interview/${interviewId}/feedback`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overallRating');
      expect(response.body.data).toHaveProperty('strengths');
      expect(response.body.data).toHaveProperty('improvements');
    });
  });

  describe('GET /api/interview/:id/feedback', () => {
    let interviewId: string;

    beforeEach(async () => {
      const interview = await Interview.create({
        userId: testUser._id,
        type: 'technical',
        status: 'completed',
        settings: {
          role: 'Engineer',
          difficulty: 'hard',
          duration: 90,
        },
        questions: [],
        responses: [],
        feedback: {
          overallRating: 85,
          strengths: ['Good technical knowledge'],
          improvements: ['More examples needed'],
          recommendations: ['Practice algorithms'],
          detailedFeedback: 'Overall good performance...',
          skillAssessment: [],
          nextSteps: ['Review data structures'],
        },
      });
      interviewId = interview._id.toString();
    });

    it('should get existing feedback', async () => {
      const response = await request(app)
        .get(`/api/interview/${interviewId}/feedback`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overallRating).toBe(85);
      expect(response.body.data.strengths).toHaveLength(1);
    });

    it('should fail when feedback not generated', async () => {
      const newInterview = await Interview.create({
        userId: testUser._id,
        type: 'coding',
        status: 'completed',
        settings: {
          role: 'Developer',
          difficulty: 'medium',
          duration: 60,
        },
        questions: [],
        responses: [],
      });

      const response = await request(app)
        .get(`/api/interview/${newInterview._id}/feedback`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not generated');
    });
  });
});

