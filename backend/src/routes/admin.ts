import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAdmin } from '../middleware/auth';
import User from '../models/User';
import Interview from '../models/Interview';
import Resume from '../models/Resume';
import logger from '../utils/logger';
import os from 'os';

const router = express.Router();

// All admin routes require admin authentication
router.use(requireAdmin);

// Get platform statistics
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  console.log('=== ADMIN: Getting platform stats ===');

  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      'auth.lastLogin': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    // Get interview statistics
    const totalInterviews = await Interview.countDocuments();
    const completedInterviews = await Interview.countDocuments({ status: 'completed' });
    const inProgressInterviews = await Interview.countDocuments({ status: 'in-progress' });
    
    // Calculate average success rate
    const interviewsWithScores = await Interview.find({
      status: 'completed',
      'analysis.overallScore': { $exists: true }
    }).select('analysis.overallScore');
    
    const avgSuccessRate = interviewsWithScores.length > 0
      ? Math.round(interviewsWithScores.reduce((sum, i) => sum + (i.analysis?.overallScore || 0), 0) / interviewsWithScores.length)
      : 0;

    // Get interview type breakdown
    const interviewTypes = await Interview.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Get user growth data (last 7 months)
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get subscription breakdown
    const subscriptionStats = await User.aggregate([
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newThisMonth: newUsersThisMonth,
          growth: userGrowth,
          subscriptions: subscriptionStats
        },
        interviews: {
          total: totalInterviews,
          completed: completedInterviews,
          inProgress: inProgressInterviews,
          avgSuccessRate,
          byType: interviewTypes
        },
        timestamp: new Date()
      }
    });
  } catch (error: any) {
    logger.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platform statistics',
      message: error.message
    });
  }
}));

// Get all users (paginated)
router.get('/users', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const plan = req.query.plan as string;

  const query: any = {};
  
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { 'profile.firstName': { $regex: search, $options: 'i' } },
      { 'profile.lastName': { $regex: search, $options: 'i' } }
    ];
  }

  if (plan) {
    query['subscription.plan'] = plan;
  }

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .select('-password');

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

// Get specific user details
router.get('/users/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  // Get user's interviews
  const interviews = await Interview.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(10);

  // Get user's resumes
  const resumes = await Resume.find({ userId: user._id })
    .sort({ uploadDate: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      user,
      interviews,
      resumes
    }
  });
}));

// Update user
router.put('/users/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { subscription, auth, profile } = req.body;
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  // Update subscription if provided
  if (subscription) {
    if (subscription.plan) user.subscription.plan = subscription.plan;
    if (subscription.status) user.subscription.status = subscription.status;
  }

  // Update auth if provided
  if (auth) {
    if (auth.role) user.auth.role = auth.role;
    if (auth.isVerified !== undefined) user.auth.isVerified = auth.isVerified;
  }

  // Update profile if provided
  if (profile) {
    if (profile.firstName) user.profile.firstName = profile.firstName;
    if (profile.lastName) user.profile.lastName = profile.lastName;
  }

  await user.save();

  logger.info(`Admin updated user: ${user.email}`);

  res.json({
    success: true,
    data: user,
    message: 'User updated successfully'
  });
}));

// Delete user
router.delete('/users/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  // Delete user's interviews
  await Interview.deleteMany({ userId: user._id });
  
  // Delete user's resumes
  await Resume.deleteMany({ userId: user._id });
  
  // Delete user
  await User.findByIdAndDelete(req.params.id);

  logger.info(`Admin deleted user: ${user.email}`);

  res.json({
    success: true,
    message: 'User and all associated data deleted successfully'
  });
}));

// Get all interviews (paginated)
router.get('/interviews', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const type = req.query.type as string;

  const query: any = {};
  
  if (status) query.status = status;
  if (type) query.type = type;

  const interviews = await Interview.find(query)
    .populate('userId', 'email profile.firstName profile.lastName')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

  const total = await Interview.countDocuments(query);

  res.json({
    success: true,
    data: interviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

// Get system metrics
router.get('/system-metrics', asyncHandler(async (_req: Request, res: Response) => {
  const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

  // Get database stats
  const dbStats = await mongoose.connection.db.stats();

  res.json({
    success: true,
    data: {
      cpu: Math.round(cpuUsage),
      memory: Math.round(memoryUsage),
      uptime: process.uptime(),
      platform: os.platform(),
      nodeVersion: process.version,
      database: {
        size: dbStats.dataSize,
        collections: dbStats.collections,
        indexes: dbStats.indexes
      },
      timestamp: new Date()
    }
  });
}));

// Get error logs
router.get('/error-logs', asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  
  // This is a simplified version - in production, you'd read from actual log files
  // For now, return mock data structure
  const logs = [
    {
      severity: 'error',
      message: 'Database connection timeout',
      timestamp: new Date(Date.now() - 3600000),
      stack: 'Error: Connection timeout...'
    },
    {
      severity: 'warning',
      message: 'High API response time detected',
      timestamp: new Date(Date.now() - 600000),
      stack: null
    }
  ];

  res.json({
    success: true,
    data: logs.slice(0, limit)
  });
}));

// Get recent activity
router.get('/activity', asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;

  // Get recent interviews
  const recentInterviews = await Interview.find()
    .populate('userId', 'email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('userId type status createdAt analysis.overallScore');

  const activities = recentInterviews.map(interview => ({
    user: (interview.userId as any)?.email || 'Unknown',
    action: `${interview.status === 'completed' ? 'Completed' : 'Started'} ${interview.type} Interview`,
    time: interview.createdAt,
    score: interview.status === 'completed' ? interview.analysis?.overallScore : null
  }));

  res.json({
    success: true,
    data: activities
  });
}));

// Get AI performance metrics
router.get('/ai-metrics', asyncHandler(async (_req: Request, res: Response) => {
  // Calculate AI performance based on interview data
  const completedInterviews = await Interview.find({
    status: 'completed',
    'analysis.overallScore': { $exists: true }
  }).select('analysis createdAt');

  // Calculate metrics
  const accuracy = completedInterviews.length > 0 ? 94 : 0; // Mock for now
  const avgResponseTime = 88; // Mock
  const userSatisfaction = 92; // Mock
  const questionQuality = 89; // Mock
  const feedbackAccuracy = 91; // Mock

  res.json({
    success: true,
    data: {
      accuracy,
      responseTime: avgResponseTime,
      userSatisfaction,
      questionQuality,
      feedbackAccuracy,
      totalAnalyzed: completedInterviews.length
    }
  });
}));

export default router;
