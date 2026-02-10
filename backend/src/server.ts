import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import resumeRoutes from './routes/resume';
import interviewRoutes from './routes/interview';
import feedbackRoutes from './routes/feedback';
import adminRoutes from './routes/admin';
import codeExecutionRoutes from './routes/codeExecution';
import paymentRoutes from './routes/payment';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { authenticateToken } from './middleware/auth';

// Import services
import { initializeRedis } from './services/redis';
import { initializeCloudinary } from './services/cloudinary';
import { setupSocketHandlers } from './services/socket';
import logger from './utils/logger';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5175', 'http://localhost:5174', process.env.FRONTEND_URL].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true
  },
});

const PORT = process.env.PORT || 5001; // Backend server port

// Check if port is available before starting
const checkPort = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    server.listen(port, () => {
      server.close();
      resolve(true);
    });
    server.on('error', () => {
      resolve(false);
    });
  });
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration - Allow requests from frontend
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5175',
      'http://localhost:5174',
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight request for 10 minutes
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Cloudinary health check endpoint
app.get('/api/health/cloudinary', async (req, res) => {
  try {
    const cloudinaryService = require('./services/cloudinary').default;
    const result = await cloudinaryService.testConnection();
    
    res.status(result.success ? 200 : 503).json({
      service: 'Cloudinary',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      service: 'Cloudinary',
      success: false,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/resume', authenticateToken, resumeRoutes);
app.use('/api/interview', authenticateToken, interviewRoutes);
app.use('/api/feedback', authenticateToken, feedbackRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/code', codeExecutionRoutes);
app.use('/api/payment', paymentRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection with improved error handling
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri || mongoUri.trim() === '') {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Enhanced MongoDB connection options
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    // Connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('✅ Mongoose connected to MongoDB Atlas successfully');
      logger.info(`📊 Connected to database: ${mongoose.connection.name}`);
    });

    mongoose.connection.on('error', (err) => {
      logger.error('❌ Mongoose connection error:', err);
      
      // Check for specific error types
      if (err.message.includes('ENOTFOUND')) {
        logger.error('🌐 DNS Resolution Error: Check your internet connection');
      } else if (err.message.includes('authentication failed')) {
        logger.error('🔐 Authentication Error: Check username/password in connection string');
      } else if (err.message.includes('IP') || err.message.includes('not authorized')) {
        logger.error('🚨 IP WHITELISTING ISSUE DETECTED 🚨');
        logger.error('Please add your current IP address to MongoDB Atlas whitelist:');
        logger.error('1. Go to https://cloud.mongodb.com');
        logger.error('2. Navigate to Network Access');
        logger.error('3. Click "Add IP Address"');
        logger.error('4. Add your current IP or use 0.0.0.0/0 for development');
        logger.error('5. Save and wait 1-2 minutes for changes to take effect');
      }
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ Mongoose disconnected from MongoDB Atlas');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 Mongoose reconnected to MongoDB Atlas');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('🛑 Mongoose connection closed due to app termination');
      process.exit(0);
    });

    // Attempt connection with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await mongoose.connect(mongoUri, options);
        logger.info('🎉 MongoDB Atlas connected successfully');
        break;
      } catch (error: any) {
        retries--;
        logger.error(`❌ Connection attempt failed. Retries left: ${retries}`);
        
        if (retries === 0) {
          throw error;
        }
        
        // Wait 5 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

  } catch (error: any) {
    logger.error('💥 MongoDB connection error:', error.message);
    
    // Detailed error analysis
    if (error.message.includes('IP') || error.message.includes('whitelist') || error.message.includes('not authorized')) {
      logger.error('🚨 IP WHITELISTING ISSUE DETECTED 🚨');
      logger.error('SOLUTION: Add your IP to MongoDB Atlas Network Access');
      logger.error('Current error suggests your IP address is not whitelisted');
    } else if (error.message.includes('authentication failed')) {
      logger.error('🔐 AUTHENTICATION ISSUE DETECTED 🔐');
      logger.error('SOLUTION: Check your username and password in the connection string');
    } else if (error.message.includes('ENOTFOUND')) {
      logger.error('🌐 DNS/NETWORK ISSUE DETECTED 🌐');
      logger.error('SOLUTION: Check your internet connection and cluster URL');
    }
    
    // In development, continue without database
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('🔧 Continuing in development mode without database connection');
      logger.warn('⚠️ Some features requiring database will not work');
    } else {
      logger.error('🚨 Production mode: Cannot continue without database');
      process.exit(1);
    }
  }
};

// Initialize services
const initializeServices = async () => {
  try {
    // Initialize Redis (optional for development)
    try {
      await initializeRedis();
      logger.info('Redis initialized successfully');
    } catch (error) {
      logger.warn('Redis initialization failed - continuing without Redis');
      logger.debug('Redis error:', error);
    }

    // Initialize Cloudinary (optional for development)
    try {
      initializeCloudinary();
      logger.info('Cloudinary initialized successfully');
    } catch (error) {
      logger.warn('Cloudinary initialization failed - continuing without Cloudinary');
      logger.debug('Cloudinary error:', error);
    }

    // Setup Socket.IO handlers
    setupSocketHandlers(io);
    logger.info('Socket.IO handlers initialized successfully');

  } catch (error) {
    logger.error('Service initialization error:', error);
    logger.warn('Some services failed to initialize - continuing with basic functionality');
  }
};

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    mongoose.connection.close().then(() => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // Don't exit on unhandled rejections in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    logger.warn('⚠️  Unhandled rejection detected but continuing in development mode');
  }
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await initializeServices();

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, io };