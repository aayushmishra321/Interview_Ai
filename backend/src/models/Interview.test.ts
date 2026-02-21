import mongoose from 'mongoose';
import Interview from './Interview';
import User from './User';
import { cleanupTestData, createTestUser } from '../test/helpers';

describe('Interview Model', () => {
  let testUser: any;

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
    
    // Create a test user
    testUser = await createTestUser();
  });

  describe('Interview Creation', () => {
    it('should create an interview with valid data', async () => {
      const interviewData = {
        userId: testUser._id,
        type: 'technical' as const,
        status: 'scheduled' as const,
        settings: {
          role: 'Software Engineer',
          difficulty: 'medium' as const,
          duration: 60,
          includeVideo: true,
          includeAudio: true,
          includeCoding: false,
        },
        questions: [
          {
            id: 'q1',
            text: 'What is your experience with Node.js?',
            type: 'technical' as const,
            difficulty: 'medium',
            expectedDuration: 5,
          },
        ],
        responses: [],
      };

      const interview = await Interview.create(interviewData);

      expect(interview.userId.toString()).toBe(testUser._id.toString());
      expect(interview.type).toBe('technical');
      expect(interview.status).toBe('scheduled');
      expect(interview.questions).toHaveLength(1);
    });

    it('should fail with invalid interview type', async () => {
      const interviewData = {
        userId: testUser._id,
        type: 'invalid-type',
        settings: {
          role: 'Software Engineer',
          difficulty: 'medium',
          duration: 60,
        },
        questions: [],
        responses: [],
      };

      await expect(Interview.create(interviewData)).rejects.toThrow();
    });

    it('should fail with invalid difficulty', async () => {
      const interviewData = {
        userId: testUser._id,
        type: 'technical',
        settings: {
          role: 'Software Engineer',
          difficulty: 'invalid',
          duration: 60,
        },
        questions: [],
        responses: [],
      };

      await expect(Interview.create(interviewData)).rejects.toThrow();
    });

    it('should fail with duration out of range', async () => {
      const interviewData = {
        userId: testUser._id,
        type: 'technical',
        settings: {
          role: 'Software Engineer',
          difficulty: 'medium',
          duration: 200, // Max is 120
        },
        questions: [],
        responses: [],
      };

      await expect(Interview.create(interviewData)).rejects.toThrow();
    });
  });

  describe('Interview Status', () => {
    it('should default to scheduled status', async () => {
      const interview = await Interview.create({
        userId: testUser._id,
        type: 'behavioral',
        settings: {
          role: 'Product Manager',
          difficulty: 'easy',
          duration: 30,
        },
        questions: [],
        responses: [],
      });

      expect(interview.status).toBe('scheduled');
    });

    it('should allow status updates', async () => {
      const interview = await Interview.create({
        userId: testUser._id,
        type: 'coding',
        settings: {
          role: 'Developer',
          difficulty: 'hard',
          duration: 90,
        },
        questions: [],
        responses: [],
      });

      interview.status = 'in-progress';
      await interview.save();

      const updated = await Interview.findById(interview._id);
      expect(updated!.status).toBe('in-progress');
    });
  });

  describe('Questions and Responses', () => {
    it('should add questions to interview', async () => {
      const interview = await Interview.create({
        userId: testUser._id,
        type: 'technical',
        settings: {
          role: 'Engineer',
          difficulty: 'medium',
          duration: 60,
        },
        questions: [
          {
            id: 'q1',
            text: 'Question 1',
            type: 'technical',
            difficulty: 'medium',
            expectedDuration: 5,
          },
          {
            id: 'q2',
            text: 'Question 2',
            type: 'technical',
            difficulty: 'medium',
            expectedDuration: 5,
          },
        ],
        responses: [],
      });

      expect(interview.questions).toHaveLength(2);
    });

    it('should add responses to interview', async () => {
      const interview = await Interview.create({
        userId: testUser._id,
        type: 'behavioral',
        settings: {
          role: 'Manager',
          difficulty: 'easy',
          duration: 30,
        },
        questions: [
          {
            id: 'q1',
            text: 'Tell me about yourself',
            type: 'behavioral',
            difficulty: 'easy',
            expectedDuration: 3,
          },
        ],
        responses: [],
      });

      interview.responses.push({
        questionId: 'q1',
        answer: 'I am a software engineer...',
        duration: 180,
        timestamp: new Date(),
      } as any);

      await interview.save();

      const updated = await Interview.findById(interview._id);
      expect(updated!.responses).toHaveLength(1);
      expect(updated!.responses[0].questionId).toBe('q1');
    });
  });

  describe('Session Management', () => {
    it('should track session start and end times', async () => {
      const interview = await Interview.create({
        userId: testUser._id,
        type: 'technical',
        settings: {
          role: 'Developer',
          difficulty: 'medium',
          duration: 60,
        },
        questions: [],
        responses: [],
      });

      const startTime = new Date();
      interview.session.startTime = startTime;
      await interview.save();

      const endTime = new Date(startTime.getTime() + 3600000); // 1 hour later
      interview.session.endTime = endTime;
      await interview.save();

      const updated = await Interview.findById(interview._id);
      expect(updated!.session.startTime).toBeTruthy();
      expect(updated!.session.endTime).toBeTruthy();
    });

    it('should calculate actual duration', async () => {
      const interview = await Interview.create({
        userId: testUser._id,
        type: 'coding',
        settings: {
          role: 'Developer',
          difficulty: 'hard',
          duration: 90,
        },
        questions: [],
        responses: [],
      });

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 45 * 60 * 1000); // 45 minutes

      interview.session.startTime = startTime;
      interview.session.endTime = endTime;
      interview.session.actualDuration = 45;
      await interview.save();

      const updated = await Interview.findById(interview._id);
      expect(updated!.session.actualDuration).toBe(45);
    });
  });

  describe('Analysis and Feedback', () => {
    it('should store analysis data', async () => {
      const interview = await Interview.create({
        userId: testUser._id,
        type: 'behavioral',
        settings: {
          role: 'Manager',
          difficulty: 'medium',
          duration: 60,
        },
        questions: [],
        responses: [],
        analysis: {
          videoMetrics: {
            eyeContactPercentage: 75,
            emotionAnalysis: [],
            postureScore: 80,
            gestureAnalysis: [],
            confidenceLevel: 70,
          },
          audioMetrics: {
            speechRate: 150,
            pauseAnalysis: [],
            fillerWords: [],
            toneAnalysis: [],
            clarityScore: 85,
          },
          contentMetrics: {
            relevanceScore: 90,
            technicalAccuracy: 85,
            communicationClarity: 88,
            structureScore: 82,
            keywordMatches: ['leadership', 'teamwork'],
          },
          overallScore: 84,
        },
      });

      expect(interview.analysis).toBeTruthy();
      expect(interview.analysis!.overallScore).toBe(84);
      expect(interview.analysis!.videoMetrics.eyeContactPercentage).toBe(75);
    });

    it('should store feedback data', async () => {
      const interview = await Interview.create({
        userId: testUser._id,
        type: 'technical',
        settings: {
          role: 'Engineer',
          difficulty: 'hard',
          duration: 90,
        },
        questions: [],
        responses: [],
        feedback: {
          overallRating: 85,
          strengths: ['Clear communication', 'Technical knowledge'],
          improvements: ['More examples needed'],
          recommendations: ['Practice STAR method'],
          detailedFeedback: 'Good performance overall...',
          skillAssessment: [],
          nextSteps: ['Review algorithms'],
        },
      });

      expect(interview.feedback).toBeTruthy();
      expect(interview.feedback!.overallRating).toBe(85);
      expect(interview.feedback!.strengths).toHaveLength(2);
    });
  });

  describe('Queries and Indexes', () => {
    it('should find interviews by userId', async () => {
      await Interview.create({
        userId: testUser._id,
        type: 'behavioral',
        settings: {
          role: 'Manager',
          difficulty: 'easy',
          duration: 30,
        },
        questions: [],
        responses: [],
      });

      await Interview.create({
        userId: testUser._id,
        type: 'technical',
        settings: {
          role: 'Engineer',
          difficulty: 'medium',
          duration: 60,
        },
        questions: [],
        responses: [],
      });

      const interviews = await Interview.find({ userId: testUser._id });
      expect(interviews).toHaveLength(2);
    });

    it('should find interviews by status', async () => {
      await Interview.create({
        userId: testUser._id,
        type: 'coding',
        status: 'completed',
        settings: {
          role: 'Developer',
          difficulty: 'hard',
          duration: 90,
        },
        questions: [],
        responses: [],
      });

      const completed = await Interview.find({ status: 'completed' });
      expect(completed).toHaveLength(1);
    });
  });
});
