import express from 'express';
import { requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import User from '../models/User';
import logger from '../utils/logger';

const router = express.Router();

// Apply admin middleware to all routes
router.use(requireAdmin);

// Get admin dashboard stats
router.get('/stats', asyncHandler(async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      'auth.lastLogin': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    });

    // TODO: Get interview statistics from Interview model
    const mockStats = {
      totalUsers,
      activeUsers,
      totalInterviews: 1250,
      averageSessionDuration: 42, // minutes
      popularRoles: [
        { role: 'Software Engineer', count: 450, averageScore: 82 },
        { role: 'Data Scientist', count: 320, averageScore: 78 },
        { role: 'Product Manager', count: 280, averageScore: 85 },
        { role: 'DevOps Engineer', count: 200, averageScore: 80 },
      ],
      userGrowth: [
        { date: '2024-01-01', newUsers: 45, totalUsers: 1200 },
        { date: '2024-01-02', newUsers: 52, totalUsers: 1252 },
        { date: '2024-01-03', newUsers: 38, totalUsers: 1290 },
      ],
      systemHealth: {
        apiResponseTime: 120, // ms
        aiProcessingTime: 2500, // ms
        errorRate: 0.02, // 2%
        uptime: 99.9, // %
      },
    };

    res.json({
      success: true,
      data: mockStats,
    });
  } catch (error: any) {
    logger.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get admin stats',
      message: error.message,
    });
  }
}));

// Get all users with pagination
router.get('/users', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const sortBy = req.query.sortBy as string || 'createdAt';
  const sortOrder = req.query.sortOrder as string || 'desc';

  try {
    const query: any = {};
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password');

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Admin get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users',
      message: error.message,
    });
  }
}));

// Get specific user details
router.get('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // TODO: Get user's interview statistics
    const userStats = {
      totalInterviews: user.stats.totalInterviews,
      averageScore: user.stats.averageScore,
      lastInterviewDate: user.stats.lastInterviewDate,
      recentActivity: [
        {
          type: 'interview_completed',
          date: new Date().toISOString(),
          details: 'Behavioral Interview - Software Engineer',
        },
      ],
    };

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        stats: userStats,
      },
    });
  } catch (error: any) {
    logger.error('Admin get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
      message: error.message,
    });
  }
}));

// Update user (admin only)
router.put('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update allowed fields
    if (updates.profile) {
      user.profile = { ...user.profile, ...updates.profile };
    }
    
    if (updates.subscription) {
      user.subscription = { ...user.subscription, ...updates.subscription };
    }

    if (updates.auth) {
      user.auth = { ...user.auth, ...updates.auth };
    }

    await user.save();

    logger.info(`User updated by admin: ${id}`);

    res.json({
      success: true,
      data: user.toJSON(),
      message: 'User updated successfully',
    });
  } catch (error: any) {
    logger.error('Admin update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error.message,
    });
  }
}));

// Delete user (admin only)
router.delete('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // TODO: Delete related data (interviews, resumes, etc.)
    await User.findByIdAndDelete(id);

    logger.info(`User deleted by admin: ${id} (${user.email})`);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    logger.error('Admin delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message,
    });
  }
}));

// Get all interviews (admin view)
router.get('/interviews', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const type = req.query.type as string;

  try {
    // TODO: Implement with Interview model
    const mockInterviews = [
      {
        id: 'interview_1',
        userId: 'user_1',
        userEmail: 'john@example.com',
        type: 'behavioral',
        status: 'completed',
        settings: {
          role: 'Software Engineer',
          difficulty: 'medium',
          duration: 45,
        },
        analysis: {
          overallScore: 85,
        },
        createdAt: new Date().toISOString(),
      },
    ];

    res.json({
      success: true,
      data: mockInterviews,
      pagination: {
        page,
        limit,
        total: mockInterviews.length,
        totalPages: Math.ceil(mockInterviews.length / limit),
      },
    });
  } catch (error: any) {
    logger.error('Admin get interviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get interviews',
      message: error.message,
    });
  }
}));

// System health check
router.get('/health', asyncHandler(async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await User.findOne().limit(1);
    
    // TODO: Check other services (Redis, Cloudinary, AI server)
    const healthStatus = {
      database: dbStatus ? 'healthy' : 'unhealthy',
      redis: 'healthy', // TODO: Implement Redis health check
      cloudinary: 'healthy', // TODO: Implement Cloudinary health check
      aiServer: 'healthy', // TODO: Implement AI server health check
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: healthStatus,
    });
  } catch (error: any) {
    logger.error('Admin health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message,
    });
  }
}));

// System logs
router.get('/logs', asyncHandler(async (req, res) => {
  const level = req.query.level as string || 'info';
  const limit = parseInt(req.query.limit as string) || 100;

  try {
    // TODO: Implement log retrieval from Winston logs
    const mockLogs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'User logged in: john@example.com',
      },
      {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Database connection error',
      },
    ];

    res.json({
      success: true,
      data: mockLogs,
    });
  } catch (error: any) {
    logger.error('Admin get logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get logs',
      message: error.message,
    });
  }
}));

export default router;