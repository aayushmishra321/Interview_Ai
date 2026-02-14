# Test Suite Fix Guide

## Root Causes Identified

### 1. Database Isolation Issues
**Problem**: Tests were using hardcoded emails causing duplicate key errors
**Solution**: 
- Implemented `generateUniqueEmail()` function
- Each test now gets a unique email with timestamp and counter
- Proper cleanup order (interviews → resumes → users)

### 2. Authentication Middleware Issues
**Problem**: Global authentication middleware was applied to test apps, blocking all requests
**Solution**:
- Removed global `authenticateToken` middleware from test apps
- Routes handle their own authentication (as they should in production)
- Tests now properly send Authorization headers

### 3. Missing Required Fields
**Problem**: Interview model requires settings.role, settings.difficulty, settings.duration
**Solution**:
- Created `createTestInterview()` helper with all required fields
- Default values: role='Software Engineer', difficulty='medium', duration=60

### 4. Mock Isolation
**Problem**: Mocks were not being reset between tests
**Solution**:
- Added `jest.clearAllMocks()` in beforeEach hooks
- Mocks now properly isolated per test

### 5. Public Endpoints
**Problem**: Some endpoints like `/plans` and `/health` should be public but tests expected auth
**Solution**:
- Identified public endpoints
- Updated tests to not send auth headers for public routes

## Fixed Files

### Core Test Infrastructure
1. `src/test/helpers.ts` - Added unique email generation and interview helper
2. `src/test/testDatabase.ts` - New database management utilities
3. `src/test/setup.ts` - Enhanced with better mocks

### Test Files Fixed
1. `src/routes/user.test.ts` - Removed global auth, unique emails
2. `src/routes/admin.test.ts` - Fixed admin auth checks
3. `src/routes/payment.test.ts` - Fixed public endpoints
4. `src/routes/codeExecution.test.ts` - Fixed auth and interview creation
5. `src/routes/practice.test.ts` - Fixed session management
6. `src/routes/scheduling.test.ts` - Fixed interview creation with required fields
7. `src/routes/resume.test.ts` - Fixed auth and file upload tests
8. `src/routes/interview.test.ts` - Fixed interview creation
9. `src/routes/auth.test.ts` - Fixed user creation

## Changes Made

### helpers.ts
```typescript
// Added unique email generation
export const generateUniqueEmail = (prefix: string = 'test') => {
  emailCounter++;
  return `${prefix}-${Date.now()}-${emailCounter}@test.com`;
};

// Added interview helper
export const createTestInterview = async (userId, overrides = {}) => {
  // Creates interview with all required fields
};
```

### Test Pattern (Before)
```typescript
const app = express();
app.use(express.json());
app.use(authenticateToken); // ❌ Blocks all requests
app.use('/api/user', userRouter);
```

### Test Pattern (After)
```typescript
const app = express();
app.use(express.json());
app.use('/api/user', userRouter); // ✅ Routes handle their own auth
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific file
npm test -- src/routes/user.test.ts

# Run in watch mode
npm test -- --watch

# Clear cache and run
npm test -- --clearCache && npm test
```

## Expected Results After Fixes

- All 95 tests should pass
- Coverage should be 60-70% (before adding new tests)
- No duplicate key errors
- No authentication failures
- Deterministic test results

## Next Steps for 80% Coverage

### High-Value Test Cases to Add

1. **Error Handling** (adds ~10% coverage)
   - Database connection failures
   - Invalid input validation
   - Service unavailability

2. **Edge Cases** (adds ~5% coverage)
   - Empty arrays/objects
   - Boundary values
   - Null/undefined handling

3. **Authorization** (adds ~5% coverage)
   - Non-admin accessing admin routes
   - Accessing other users' data
   - Expired tokens

4. **Service Tests** (adds ~10% coverage)
   - Email service
   - Gemini AI service
   - Stripe service
   - Cloudinary service

5. **Middleware Tests** (adds ~5% coverage)
   - Rate limiter
   - Error handler
   - Cache middleware

Total: ~35% additional coverage = 95-105% total (target achieved)
