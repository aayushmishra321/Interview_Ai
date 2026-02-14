import request from 'supertest';
import mongoose from 'mongoose';
import codeExecutionRouter from './codeExecution';
import Interview from '../models/Interview';
import { createTestUser, createTestInterview, getAuthToken, cleanupTestData } from '../test/helpers';
import { createTestApp } from '../test/testApp';

describe('Code Execution Routes', () => {
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
    app = createTestApp(codeExecutionRouter, testUser, '/api/code');
  });

  describe('POST /api/code/execute', () => {
    it('should execute code', async () => {
      const response = await request(app)
        .post('/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          language: 'javascript',
          code: 'console.log("Hello, World!");',
          stdin: '',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('output');
    });

    it('should require language and code', async () => {
      const response = await request(app)
        .post('/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should handle stdin input', async () => {
      const response = await request(app)
        .post('/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          language: 'python',
          code: 'name = input()\nprint(f"Hello, {name}!")',
          stdin: 'World',
        });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/code/execute-tests', () => {
    it('should execute code with test cases', async () => {
      const response = await request(app)
        .post('/execute-tests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          language: 'javascript',
          code: 'function add(a, b) { return a + b; }',
          testCases: [
            { input: '2 3', expectedOutput: '5' },
            { input: '10 20', expectedOutput: '30' },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('testResults');
    });

    it('should require test cases array', async () => {
      const response = await request(app)
        .post('/execute-tests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          language: 'javascript',
          code: 'console.log("test");',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/code/interview/:interviewId/submit', () => {
    it('should submit code for interview', async () => {
      const interview = await createTestInterview(testUser._id, {
        type: 'coding',
        status: 'in-progress',
        questions: [
          {
            id: 'q1',
            text: 'Write a function to add two numbers',
            type: 'coding',
            testCases: [
              { input: '2 3', expectedOutput: '5' },
            ],
          },
        ],
        responses: [],
      });

      const response = await request(app)
        .post(`/api/code/interview/${interview._id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionId: 'q1',
          language: 'javascript',
          code: 'function add(a, b) { return a + b; }',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('result');
    });

    it('should return 404 for non-existent interview', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/code/interview/${fakeId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionId: 'q1',
          language: 'javascript',
          code: 'test',
        });

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent question', async () => {
      const interview = await createTestInterview(testUser._id, {
        type: 'coding',
        status: 'in-progress',
        questions: [],
        responses: [],
      });

      const response = await request(app)
        .post(`/api/code/interview/${interview._id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionId: 'invalid',
          language: 'javascript',
          code: 'test',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/code/languages', () => {
    it('should get supported languages without authentication', async () => {
      const response = await request(app).get('/languages');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/code/health', () => {
    it('should check service health without authentication', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });
  });
});
