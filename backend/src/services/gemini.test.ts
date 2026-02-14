// Mock logger first
jest.mock('../utils/logger', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Set environment variables BEFORE importing anything
process.env.GEMINI_API_KEY = 'test-api-key-123';
process.env.GEMINI_MODEL = 'gemini-2.5-flash';

// Mock Google Generative AI
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

// Now import the service
import geminiService from './gemini';

describe('Gemini Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock to default successful response
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify([
          {
            id: '1',
            text: 'Sample question',
            type: 'technical',
            difficulty: 'medium',
            expectedDuration: 5,
          },
        ]),
      },
    });
  });

  describe('Service Initialization', () => {
    it('should have API key configured', () => {
      expect(process.env.GEMINI_API_KEY).toBeDefined();
    });
  });

  describe('generateInterviewQuestions', () => {
    it('should generate questions successfully', async () => {
      // Mock successful response
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify([
            {
              id: '1',
              text: 'What is your experience with JavaScript?',
              type: 'technical',
              difficulty: 'medium',
              expectedDuration: 5,
            },
            {
              id: '2',
              text: 'Explain closures in JavaScript',
              type: 'technical',
              difficulty: 'medium',
              expectedDuration: 5,
            },
          ]),
        },
      });

      const params = {
        role: 'Software Engineer',
        experienceLevel: 'mid',
        interviewType: 'technical',
        difficulty: 'medium',
        count: 5,
      };

      const result = await geminiService.generateInterviewQuestions(params);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('text');
      expect(result[0]).toHaveProperty('type');
    });

    it('should handle API errors with fallback', async () => {
      // Mock API error
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await geminiService.generateInterviewQuestions({
        role: 'Developer',
        experienceLevel: 'senior',
        interviewType: 'technical',
        difficulty: 'hard',
        count: 3,
      });

      // Should return fallback questions
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle JSON parse errors with fallback', async () => {
      // Mock invalid JSON response
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Invalid JSON response',
        }});

      const result = await geminiService.generateInterviewQuestions({
        role: 'Engineer',
        experienceLevel: 'mid',
        interviewType: 'technical',
        difficulty: 'medium',
        count: 5,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should generate coding questions for coding interviews', async () => {
      // Mock coding questions response
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify([
            {
              id: '1',
              text: 'Two Sum Problem',
              type: 'coding',
              difficulty: 'easy',
              expectedDuration: 15,
              testCases: [{ input: '[2,7,11,15], 9', expectedOutput: '[0,1]' }],
            },
          ]),
        }});

      const result = await geminiService.generateInterviewQuestions({
        role: 'Software Engineer',
        experienceLevel: 'mid',
        interviewType: 'coding',
        difficulty: 'medium',
        count: 3,
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle different difficulty levels', async () => {
      const difficulties = ['easy', 'medium', 'hard'];

      for (const difficulty of difficulties) {
        mockGenerateContent.mockResolvedValue({
          response: {
            text: () => JSON.stringify([
              {
                id: '1',
                text: `${difficulty} question`,
                type: 'technical',
                difficulty,
                expectedDuration: 5,
              },
            ]),
          }});

        const result = await geminiService.generateInterviewQuestions({
          role: 'Engineer',
          experienceLevel: 'mid',
          interviewType: 'technical',
          difficulty,
          count: 3,
        });

        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });

  describe('analyzeResponse', () => {
    it('should analyze response successfully', async () => {
      // Mock successful analysis
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            scores: {
              relevance: 85,
              technicalAccuracy: 80,
              clarity: 90,
            },
            overallScore: 85,
            strengths: ['Clear communication'],
            improvements: ['Add more examples'],
            feedback: 'Good response overall',
          }),
        }});

      const result = await geminiService.analyzeResponse({
        question: 'What is React?',
        answer: 'React is a JavaScript library for building user interfaces',
        role: 'Frontend Developer',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('overallScore');
      expect(typeof result.overallScore).toBe('number');
    });

    it('should handle API errors with fallback analysis', async () => {
      // Mock API error
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await geminiService.analyzeResponse({
        question: 'Test question',
        answer: 'Test answer',
        role: 'Engineer',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('feedback');
    });

    it('should provide fallback analysis for short answers', async () => {
      // Mock error
      mockGenerateContent.mockRejectedValue(new Error('Error'));

      const result = await geminiService.analyzeResponse({
        question: 'Explain closures',
        answer: 'Functions with outer scope access',
        role: 'Developer',
      });

      expect(result).toBeDefined();
      expect(typeof result.overallScore).toBe('number');
    });
  });

  describe('generateFeedback', () => {
    it('should generate feedback successfully', async () => {
      // Mock successful feedback
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            overallRating: 80,
            strengths: ['Good technical knowledge'],
            improvements: ['Time management'],
            recommendations: ['Practice more'],
            detailedFeedback: 'Overall good performance',
          }),
        }});

      const result = await geminiService.generateFeedback({
        interviewData: {
          type: 'technical',
          settings: { role: 'Engineer', difficulty: 'medium' },
          questionsAnswered: 8,
          totalQuestions: 10,
        },
        analysisResults: { overallScore: 85 },
        userProfile: { experienceLevel: 'mid' },
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('overallRating');
    });

    it('should handle API errors with fallback feedback', async () => {
      // Mock API error
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await geminiService.generateFeedback({
        interviewData: {
          type: 'behavioral',
          settings: { role: 'Manager', difficulty: 'easy' },
          questionsAnswered: 5,
          totalQuestions: 5,
        },
        analysisResults: { overallScore: 75 },
        userProfile: { experienceLevel: 'senior' },
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('overallRating');
      expect(result).toHaveProperty('detailedFeedback');
    });
  });

  describe('analyzeResume', () => {
    it('should analyze resume successfully', async () => {
      // Mock successful resume analysis
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            skills: ['JavaScript', 'React', 'Node.js'],
            experience: 3,
            strengths: ['Strong technical skills'],
            score: 85,
          }),
        }});

      const result = await geminiService.analyzeResume({
        resumeText: 'Software Engineer with 3 years experience in JavaScript and React',
        targetRole: 'Frontend Developer',
      });

      expect(result).toBeDefined();
    });

    it('should handle API errors', async () => {
      // Mock API error
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      await expect(
        geminiService.analyzeResume({
          resumeText: 'Test resume',
          targetRole: 'Developer',
        })
      ).rejects.toThrow();
    });
  });

  describe('Fallback Mechanisms', () => {
    it('should provide fallback questions for technical interviews', async () => {
      // Mock API error to trigger fallback
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await geminiService.generateInterviewQuestions({
        role: 'Software Engineer',
        experienceLevel: 'mid',
        interviewType: 'technical',
        difficulty: 'medium',
        count: 5,
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('text');
      expect(result[0]).toHaveProperty('type');
    });

    it('should provide fallback questions for behavioral interviews', async () => {
      // Mock API error
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await geminiService.generateInterviewQuestions({
        role: 'Manager',
        experienceLevel: 'senior',
        interviewType: 'behavioral',
        difficulty: 'medium',
        count: 5,
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should provide fallback questions for coding interviews', async () => {
      // Mock API error
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await geminiService.generateInterviewQuestions({
        role: 'Software Engineer',
        experienceLevel: 'mid',
        interviewType: 'coding',
        difficulty: 'medium',
        count: 3,
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      // Coding questions should have specific properties
      expect(result[0]).toHaveProperty('text');
    });

    it('should provide fallback analysis with scores', async () => {
      // Mock API error
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await geminiService.analyzeResponse({
        question: 'Test question',
        answer: 'Test answer',
        role: 'Engineer',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('scores');
      expect(result).toHaveProperty('strengths');
    });

    it('should provide fallback feedback with completion rate', async () => {
      // Mock API error
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await geminiService.generateFeedback({
        interviewData: {
          type: 'technical',
          settings: { role: 'Engineer', difficulty: 'medium' },
          questionsAnswered: 7,
          totalQuestions: 10,
        },
        analysisResults: { overallScore: 70 },
        userProfile: { experienceLevel: 'mid' },
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('overallRating');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('improvements');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      mockGenerateContent.mockRejectedValue(new Error('Network error'));

      const result = await geminiService.generateInterviewQuestions({
        role: 'Developer',
        experienceLevel: 'mid',
        interviewType: 'technical',
        difficulty: 'medium',
        count: 5,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle malformed JSON responses', async () => {
      // Mock malformed JSON
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '{invalid json}',
        }});

      const result = await geminiService.generateInterviewQuestions({
        role: 'Developer',
        experienceLevel: 'mid',
        interviewType: 'technical',
        difficulty: 'medium',
        count: 5,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty responses', async () => {
      // Mock empty response
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '',
        }});

      const result = await geminiService.generateInterviewQuestions({
        role: 'Developer',
        experienceLevel: 'mid',
        interviewType: 'technical',
        difficulty: 'medium',
        count: 5,
      });

      expect(result).toBeDefined();
    });
  });

  describe('Response Validation', () => {
    it('should return questions with required properties', async () => {
      // Mock valid response
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify([
            {
              id: '1',
              text: 'Sample question',
              type: 'technical',
              difficulty: 'medium',
              expectedDuration: 5,
            },
          ]),
        }});

      const result = await geminiService.generateInterviewQuestions({
        role: 'Engineer',
        experienceLevel: 'mid',
        interviewType: 'technical',
        difficulty: 'medium',
        count: 3,
      });

      expect(result).toBeDefined();
      result.forEach((question: any) => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('text');
        expect(question).toHaveProperty('type');
        expect(question).toHaveProperty('difficulty');
      });
    });

    it('should handle markdown code blocks in responses', async () => {
      // Mock response with markdown code blocks
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '```json\n[{"id":"1","text":"Test","type":"technical","difficulty":"medium","expectedDuration":5}]\n```',
        }});

      const result = await geminiService.generateInterviewQuestions({
        role: 'Engineer',
        experienceLevel: 'junior',
        interviewType: 'technical',
        difficulty: 'easy',
        count: 1,
      });

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Test');
    });
  });
});


