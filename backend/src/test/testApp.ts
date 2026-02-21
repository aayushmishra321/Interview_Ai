import express from 'express';

/**
 * Create a test Express app with authentication middleware that injects test user
 * This bypasses the database lookup in authenticateToken middleware
 * 
 * @param router - The router to mount
 * @param testUser - The test user to inject
 * @param basePath - The base path to mount the router (e.g., '/api/interview')
 */
export function createTestApp(router: express.Router, testUser?: any, basePath: string = '/api') {
  const app = express();
  
  // Parse JSON bodies
  app.use(express.json());
  
  // Test authentication middleware - injects user without database lookup
  if (testUser) {
    app.use((req: any, res, next) => {
      const authHeader = req.headers.authorization;
      
      // If no auth header, let the route handle it (for testing 401 responses)
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      // Inject test user into request
      req.user = {
        userId: testUser._id.toString(),
        email: testUser.email,
        role: testUser.subscription?.plan || testUser.auth?.role || 'free',
      };
      
      next();
    });
  }
  
  // Mount the router at the base path
  app.use(basePath, router);
  
  return app;
}

/**
 * Create a test app for admin routes with role checking
 * This mocks both authenticateToken and requireAdmin middleware
 */
export function createAdminTestApp(router: express.Router, testUser: any) {
  const app = express();
  
  app.use(express.json());
  
  // Mock requireAdmin middleware - bypass database lookup
  app.use((req: any, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Inject test user into request
    req.user = {
      userId: testUser._id.toString(),
      email: testUser.email,
      role: testUser.auth?.role || 'admin',
    };
    
    // Check if user has admin role (mock requireAdmin behavior)
    if (testUser.auth?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
      return;
    }
    
    next();
  });
  
  // Mount the router - the requireAdmin middleware will be mocked
  app.use(router);
  
  return app;
}
