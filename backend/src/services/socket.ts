import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import webrtcService from './webrtc';
import Interview from '../models/Interview';
import { RateLimiterMemory } from 'rate-limiter-flexible';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  interviewId?: string;
}

// Rate limiter for socket events (10 events per second per user)
const socketRateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 1,
});

// Rate limiter for video/audio frames (30 frames per second)
const frameRateLimiter = new RateLimiterMemory({
  points: 30,
  duration: 1,
});

export function setupSocketHandlers(io: Server) {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Setup WebRTC handlers
  webrtcService.setupWebRTCHandlers(io);

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id}, User: ${socket.userId}`);

    // Join interview room with authorization check
    socket.on('join-interview', async (interviewId: string) => {
      try {
        // SECURITY: Verify user owns this interview
        const interview = await Interview.findById(interviewId);
        
        if (!interview) {
          socket.emit('error', { 
            message: 'Interview not found',
            code: 'INTERVIEW_NOT_FOUND'
          });
          logger.warn(`User ${socket.userId} attempted to join non-existent interview ${interviewId}`);
          return;
        }

        // SECURITY: Verify ownership
        if (interview.userId.toString() !== socket.userId) {
          socket.emit('error', { 
            message: 'Unauthorized access to interview',
            code: 'UNAUTHORIZED_ACCESS'
          });
          logger.warn(`User ${socket.userId} attempted unauthorized access to interview ${interviewId}`);
          return;
        }

        // SECURITY: Check interview status
        if (interview.status === 'cancelled') {
          socket.emit('error', { 
            message: 'Interview has been cancelled',
            code: 'INTERVIEW_CANCELLED'
          });
          return;
        }

        socket.interviewId = interviewId;
        socket.join(`interview-${interviewId}`);
        logger.info(`User ${socket.userId} joined interview ${interviewId}`);
        
        // Notify others in the room
        socket.to(`interview-${interviewId}`).emit('user-joined', {
          userId: socket.userId,
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error(`Error joining interview ${interviewId}:`, error);
        socket.emit('error', { 
          message: 'Failed to join interview',
          code: 'JOIN_ERROR'
        });
      }
    });

    // Leave interview room
    socket.on('leave-interview', (interviewId: string) => {
      socket.leave(`interview-${interviewId}`);
      logger.info(`User ${socket.userId} left interview ${interviewId}`);
      
      socket.to(`interview-${interviewId}`).emit('user-left', {
        userId: socket.userId,
        timestamp: new Date(),
      });
    });

    // Real-time interview updates with rate limiting
    socket.on('interview-update', async (data: any) => {
      try {
        // SECURITY: Rate limiting
        await socketRateLimiter.consume(socket.userId!);

        const { interviewId, type, payload } = data;
        
        // SECURITY: Verify user is in this interview room
        if (socket.interviewId !== interviewId) {
          socket.emit('error', { 
            message: 'Not authorized for this interview',
            code: 'UNAUTHORIZED'
          });
          return;
        }
        
        // Broadcast to all users in the interview room
        io.to(`interview-${interviewId}`).emit('interview-update', {
          type,
          payload,
          timestamp: new Date(),
        });
        
        logger.info(`Interview update: ${type} for interview ${interviewId}`);
      } catch (error: any) {
        if (error.msBeforeNext) {
          socket.emit('error', { 
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT',
            retryAfter: Math.ceil(error.msBeforeNext / 1000)
          });
        } else {
          logger.error('Interview update error:', error);
        }
      }
    });

    // Real-time analysis updates
    socket.on('analysis-update', (data: any) => {
      const { interviewId, analysisType, metrics } = data;
      
      // Send analysis update to the specific user
      socket.emit('analysis-result', {
        analysisType,
        metrics,
        timestamp: new Date(),
      });
      
      logger.info(`Analysis update: ${analysisType} for user ${socket.userId}`);
    });

    // Video frame analysis with rate limiting
    socket.on('video-frame', async (data: any) => {
      try {
        // SECURITY: Rate limiting for video frames
        await frameRateLimiter.consume(socket.userId!);

        const { interviewId, frameData, timestamp } = data;
        
        // SECURITY: Verify authorization
        if (socket.interviewId !== interviewId) {
          return;
        }

        // SECURITY: Validate frame data size (max 1MB)
        if (frameData && frameData.length > 1024 * 1024) {
          socket.emit('error', { 
            message: 'Frame data too large',
            code: 'FRAME_TOO_LARGE'
          });
          return;
        }
        
        // Process video frame (call Python AI server)
        // This is a placeholder - actual implementation would call the AI server
        socket.emit('video-analysis', {
          emotions: {
            happy: 0.7,
            confident: 0.8,
            nervous: 0.2,
          },
          eyeContact: 0.85,
          timestamp,
        });
      } catch (error: any) {
        if (error.msBeforeNext) {
          // Rate limit exceeded - silently drop frame
          return;
        }
        logger.error('Video frame analysis error:', error);
      }
    });

    // Audio chunk analysis with rate limiting
    socket.on('audio-chunk', async (data: any) => {
      try {
        // SECURITY: Rate limiting for audio chunks
        await frameRateLimiter.consume(socket.userId!);

        const { interviewId, audioData, transcript } = data;
        
        // SECURITY: Verify authorization
        if (socket.interviewId !== interviewId) {
          return;
        }

        // SECURITY: Validate audio data size (max 500KB)
        if (audioData && audioData.length > 512 * 1024) {
          socket.emit('error', { 
            message: 'Audio data too large',
            code: 'AUDIO_TOO_LARGE'
          });
          return;
        }
        
        // Process audio chunk (call Python AI server)
        socket.emit('audio-analysis', {
          speechRate: 150,
          fillerWords: ['um', 'uh'],
          clarityScore: 0.85,
          timestamp: Date.now(),
        });
      } catch (error: any) {
        if (error.msBeforeNext) {
          // Rate limit exceeded - silently drop chunk
          return;
        }
        logger.error('Audio chunk analysis error:', error);
      }
    });

    // Code execution updates
    socket.on('code-execution', (data: any) => {
      const { interviewId, language, status } = data;
      
      socket.to(`interview-${interviewId}`).emit('code-execution-update', {
        language,
        status,
        timestamp: new Date(),
      });
    });

    // Typing indicator
    socket.on('typing', (data: any) => {
      const { interviewId, isTyping } = data;
      
      socket.to(`interview-${interviewId}`).emit('user-typing', {
        userId: socket.userId,
        isTyping,
      });
    });

    // Question navigation
    socket.on('question-change', (data: any) => {
      const { interviewId, questionIndex } = data;
      
      socket.to(`interview-${interviewId}`).emit('question-changed', {
        userId: socket.userId,
        questionIndex,
        timestamp: new Date(),
      });
    });

    // Interview status updates
    socket.on('interview-status', (data: any) => {
      const { interviewId, status } = data;
      
      io.to(`interview-${interviewId}`).emit('status-update', {
        status,
        timestamp: new Date(),
      });
      
      logger.info(`Interview ${interviewId} status: ${status}`);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.userId}:`, error);
    });

    // Disconnect with cleanup
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}, User: ${socket.userId}`);
      
      if (socket.interviewId) {
        // Notify others
        socket.to(`interview-${socket.interviewId}`).emit('user-left', {
          userId: socket.userId,
          timestamp: new Date(),
        });

        // SECURITY: Clean up room if empty
        const room = io.sockets.adapter.rooms.get(`interview-${socket.interviewId}`);
        if (!room || room.size === 0) {
          logger.info(`Cleaning up empty interview room: ${socket.interviewId}`);
          // Room is automatically cleaned by Socket.IO when empty
        }
      }
    });
  });

  // Periodic cleanup of stale rooms (every 5 minutes)
  setInterval(() => {
    const rooms = io.sockets.adapter.rooms;
    let cleanedCount = 0;
    
    rooms.forEach((sockets, roomName) => {
      // Only clean interview rooms
      if (roomName.startsWith('interview-') && sockets.size === 0) {
        rooms.delete(roomName);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} empty interview rooms`);
    }
  }, 5 * 60 * 1000);

  logger.info('Socket.IO handlers initialized with security enhancements');
}
