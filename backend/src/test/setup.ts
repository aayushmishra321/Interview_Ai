// Test setup file
// This runs before all tests

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-min-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-chars';
process.env.GEMINI_API_KEY = 'test-gemini-api-key-for-testing';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';

// Increase timeout for async operations
jest.setTimeout(10000);

// Mock Gemini service globally
jest.mock('../services/gemini', () => ({
  __esModule: true,
  default: {
    generateInterviewQuestions: jest.fn().mockResolvedValue([
      { id: 'q1', text: 'Test question 1', type: 'technical', difficulty: 'medium' }
    ]),
    analyzeResponse: jest.fn().mockResolvedValue({
      score: 85,
      feedback: 'Good answer',
      scores: { 
        relevance: 85, 
        technicalAccuracy: 85, 
        clarity: 80,
        structure: 80
      },
      keywordMatches: ['algorithm', 'optimization']
    }),
    analyzeResume: jest.fn().mockResolvedValue({
      skills: ['JavaScript', 'React'],
      score: 80
    }),
    generateFeedback: jest.fn().mockResolvedValue({
      overallRating: 85,
      strengths: ['Good communication', 'Technical knowledge'],
      improvements: ['Time management'],
      recommendations: ['Practice more algorithms'],
      detailedFeedback: 'Overall good performance',
      nextSteps: ['Focus on system design']
    })
  }
}));

// Mock Stripe service
jest.mock('../services/stripe', () => ({
  __esModule: true,
  default: {
    isReady: jest.fn().mockReturnValue(true),
    createCustomer: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
    createCheckoutSession: jest.fn().mockResolvedValue({ 
      id: 'cs_test123', 
      url: 'https://checkout.stripe.com/test' 
    }),
    createBillingPortalSession: jest.fn().mockResolvedValue({ 
      url: 'https://billing.stripe.com/portal/test' 
    }),
    getSubscription: jest.fn().mockResolvedValue({
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      cancel_at_period_end: false
    }),
    cancelSubscription: jest.fn().mockResolvedValue({
      id: 'sub_test123',
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    }),
    handleWebhook: jest.fn().mockResolvedValue({ success: true })
  }
}));

// Mock Code Execution service
jest.mock('../services/codeExecution', () => ({
  __esModule: true,
  default: {
    execute: jest.fn().mockResolvedValue({
      success: true,
      output: 'Hello, World!',
      executionTime: 0.05,
      memory: 1024
    }),
    executeWithTestCases: jest.fn().mockResolvedValue({
      success: true,
      testResults: [
        { input: '5', expectedOutput: '120', actualOutput: '120', passed: true }
      ],
      passedTests: 1,
      totalTests: 1
    }),
    getSupportedLanguages: jest.fn().mockResolvedValue([
      { id: 'javascript', name: 'JavaScript', version: '18.0.0' },
      { id: 'python', name: 'Python', version: '3.10.0' }
    ]),
    testConnection: jest.fn().mockResolvedValue(true)
  }
}));

// Mock Cloudinary service
jest.mock('../services/cloudinary', () => ({
  __esModule: true,
  default: {
    isHealthy: jest.fn().mockReturnValue(true),
    uploadImage: jest.fn().mockResolvedValue({
      secure_url: 'https://cloudinary.com/test-image.jpg',
      public_id: 'test-public-id'
    }),
    uploadResume: jest.fn().mockResolvedValue({
      secure_url: 'https://cloudinary.com/test-resume.pdf',
      public_id: 'test-resume-id'
    }),
    deleteFile: jest.fn().mockResolvedValue({ result: 'ok' })
  }
}));

// Mock Redis service
jest.mock('../services/redis', () => ({
  __esModule: true,
  default: {
    isConnected: jest.fn().mockReturnValue(false),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    disconnect: jest.fn().mockResolvedValue(undefined)
  }
}));

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
