import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';

/**
 * Test helper utilities for Jest tests
 */

// Create valid MongoDB ObjectIds for testing
export const createTestObjectId = () => new mongoose.Types.ObjectId();

// Mock user data
export const mockUser = {
  id: createTestObjectId(),
  userId: createTestObjectId().toString(),
  email: 'test@example.com',
  role: 'user',
};

export const mockAdminUser = {
  id: createTestObjectId(),
  userId: createTestObjectId().toString(),
  email: 'admin@example.com',
  role: 'admin',
};

/**
 * Mock authentication middleware that injects a test user
 */
export const mockAuthMiddleware = (user = mockUser) => {
  return (req: any, res: Response, next: NextFunction) => {
    req.user = user;
    next();
  };
};

/**
 * Mock admin authentication middleware
 */
export const mockAdminMiddleware = (user = mockAdminUser) => {
  return (req: any, res: Response, next: NextFunction) => {
    req.user = user;
    next();
  };
};

/**
 * Create a mock Express request
 */
export const createMockRequest = (overrides: any = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: mockUser,
    get: jest.fn((header: string) => {
      if (header === 'User-Agent') return 'test-agent';
      return overrides.headers?.[header.toLowerCase()] || null;
    }),
    ...overrides,
  } as any;
};

/**
 * Create a mock Express response
 */
export const createMockResponse = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendFile: jest.fn().mockReturnThis(),
    download: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
};

/**
 * Create a mock Next function
 */
export const createMockNext = () => jest.fn() as NextFunction;

/**
 * Mock Mongoose query chain
 */
export const createMockQuery = (resolvedValue: any = []) => {
  const query: any = {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(resolvedValue),
  };
  
  // Make the query thenable so it can be awaited directly
  query.then = (resolve: any) => {
    return Promise.resolve(resolvedValue).then(resolve);
  };
  
  return query;
};

/**
 * Wait for all promises to resolve
 */
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

/**
 * Clean up test data - improved version with proper error handling
 */
export const cleanupTestData = async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    
    // Delete in specific order to avoid foreign key issues
    const collectionOrder = ['interviews', 'resumes', 'users'];
    
    for (const collectionName of collectionOrder) {
      if (collections[collectionName]) {
        await collections[collectionName].deleteMany({});
      }
    }
    
    // Clean up any remaining collections
    for (const key in collections) {
      if (!collectionOrder.includes(key)) {
        await collections[key].deleteMany({});
      }
    }
  }
};

/**
 * Generate unique email for tests to avoid duplicate key errors
 */
let emailCounter = 0;
export const generateUniqueEmail = (prefix: string = 'test') => {
  emailCounter++;
  return `${prefix}-${Date.now()}-${emailCounter}@test.com`;
};

/**
 * Create a test user in the database with unique email
 */
export const createTestUser = async (overrides: any = {}) => {
  const User = require('../models/User').default;
  
  const userData = {
    email: overrides.email || generateUniqueEmail('user'),
    password: overrides.password || 'Test123!@#',
    profile: {
      firstName: overrides.firstName || 'Test',
      lastName: overrides.lastName || 'User',
      ...overrides.profile,
    },
    auth: {
      isVerified: overrides.isVerified !== undefined ? overrides.isVerified : true,
      role: overrides.role || 'user',
      ...overrides.auth,
    },
  };

  const user = new User(userData);
  await user.save();
  return user;
};

/**
 * Get authentication token for a user
 */
export const getAuthToken = (user: any) => {
  const jwt = require('jsonwebtoken');
  
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.auth.role,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * Create test authentication middleware that bypasses database lookup
 * This middleware injects the user directly into the request
 */
export const createTestAuthMiddleware = (testUser: any) => {
  return (req: any, res: any, next: any) => {
    // Extract token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required',
      });
    }

    // Inject test user into request
    req.user = {
      userId: testUser._id.toString(),
      email: testUser.email,
      role: testUser.auth.role,
    };
    
    next();
  };
};

/**
 * Create a test interview with all required fields
 */
export const createTestInterview = async (userId: mongoose.Types.ObjectId, overrides: any = {}) => {
  const Interview = require('../models/Interview').default;
  
  const interviewData = {
    userId,
    type: overrides.type || 'technical',
    status: overrides.status || 'scheduled',
    settings: {
      role: overrides.settings?.role || 'Software Engineer',
      difficulty: overrides.settings?.difficulty || 'medium',
      duration: overrides.settings?.duration || 60,
      includeVideo: overrides.settings?.includeVideo !== false,
      includeAudio: overrides.settings?.includeAudio !== false,
      includeCoding: overrides.settings?.includeCoding || false,
      ...overrides.settings,
    },
    questions: overrides.questions || (overrides.questions === null ? [] : [{
      id: '1',
      text: 'Sample technical question',
      type: 'technical',
      difficulty: 'medium',
      expectedDuration: 5,
    }]),
    responses: overrides.responses || [],
    ...overrides,
  };

  const interview = new Interview(interviewData);
  await interview.save();
  return interview;
};

/**
 * Create a test resume with all required fields
 */
export const createTestResume = async (userId: mongoose.Types.ObjectId, overrides: any = {}) => {
  const Resume = require('../models/Resume').default;
  
  const resumeData = {
    userId,
    filename: overrides.filename || 'test-resume.pdf',
    fileUrl: overrides.fileUrl || 'https://example.com/resume.pdf',
    mimeType: overrides.mimeType || 'application/pdf',
    fileSize: overrides.fileSize || 1024000,
    storageType: overrides.storageType || 'local',
    analysis: {
      skills: overrides.analysis?.skills || ['JavaScript', 'TypeScript', 'Node.js'],
      experience: overrides.analysis?.experience || 3,
      education: overrides.analysis?.education || [{
        degree: 'Bachelor of Science',
        institution: 'Test University',
        year: 2020,
      }],
      certifications: overrides.analysis?.certifications || [],
      achievements: overrides.analysis?.achievements || [],
      industries: overrides.analysis?.industries || ['Technology'],
      leadership: overrides.analysis?.leadership || [],
      summary: overrides.analysis?.summary || 'Experienced software engineer',
      score: overrides.analysis?.score || 85,
      recommendations: overrides.analysis?.recommendations || [],
      ...overrides.analysis,
    },
    metadata: {
      uploadedAt: overrides.metadata?.uploadedAt || new Date(),
      processingStatus: overrides.metadata?.processingStatus || 'completed',
      analysisVersion: overrides.metadata?.analysisVersion || '1.0.0',
      ...overrides.metadata,
    },
    ...overrides,
  };

  const resume = new Resume(resumeData);
  await resume.save();
  return resume;
};
