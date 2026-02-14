import mongoose from 'mongoose';
import User from './User';
import { cleanupTestData, generateUniqueEmail } from '../test/helpers';

describe('User Model', () => {
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
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: generateUniqueEmail('test'),
        password: 'Password123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        preferences: {
          role: 'Software Engineer',
          experienceLevel: 'mid' as const,
          industries: ['Technology'],
          interviewTypes: ['technical' as const],
        },
      };

      const user = await User.create(userData);

      expect(user.email).toBe(userData.email);
      expect(user.profile.firstName).toBe(userData.profile.firstName);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        email: generateUniqueEmail('duplicate'),
        password: 'Password123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      await User.create(userData);

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should fail with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const userData = {
        email: generateUniqueEmail('defaults'),
        password: 'Password123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const user = await User.create(userData);

      expect(user.subscription.plan).toBe('free');
      expect(user.subscription.status).toBe('active');
      expect(user.auth.isVerified).toBe(false);
      expect(user.auth.role).toBe('user');
      expect(user.stats.totalInterviews).toBe(0);
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const userData = {
        email: generateUniqueEmail('hash'),
        password: 'PlainPassword123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const user = await User.create(userData);
      const savedUser = await User.findById(user._id).select('+password');

      expect(savedUser!.password).not.toBe(userData.password);
      expect(savedUser!.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });

    it('should not rehash password if not modified', async () => {
      const user = await User.create({
        email: generateUniqueEmail('nohash'),
        password: 'Password123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      });

      const originalHash = (await User.findById(user._id).select('+password'))!.password;

      user.profile.firstName = 'Jane';
      await user.save();

      const updatedHash = (await User.findById(user._id).select('+password'))!.password;

      expect(updatedHash).toBe(originalHash);
    });
  });

  describe('Password Comparison', () => {
    it('should correctly compare valid password', async () => {
      const password = 'TestPassword123!';
      const user = await User.create({
        email: generateUniqueEmail('compare'),
        password,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword!.comparePassword(password);

      expect(isMatch).toBe(true);
    });

    it('should reject invalid password', async () => {
      const user = await User.create({
        email: generateUniqueEmail('reject'),
        password: 'CorrectPassword123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      });

      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword!.comparePassword('WrongPassword123!');

      expect(isMatch).toBe(false);
    });
  });

  describe('Account Locking', () => {
    it('should lock account after 5 failed attempts', async () => {
      const user = await User.create({
        email: generateUniqueEmail('lock'),
        password: 'Password123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      });

      // Simulate 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await user.incLoginAttempts();
      }

      const lockedUser = await User.findById(user._id);
      expect(lockedUser!.isAccountLocked()).toBe(true);
    });

    it('should not be locked initially', async () => {
      const user = await User.create({
        email: generateUniqueEmail('notlocked'),
        password: 'Password123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      });

      expect(user.isAccountLocked()).toBe(false);
    });
  });

  describe('JSON Transformation', () => {
    it('should not include password in JSON', async () => {
      const user = await User.create({
        email: generateUniqueEmail('json'),
        password: 'Password123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      });

      const json = user.toJSON();

      expect(json).not.toHaveProperty('password');
      expect(json).not.toHaveProperty('auth.verificationToken');
      expect(json).not.toHaveProperty('auth.resetPasswordToken');
    });
  });

  describe('User Queries', () => {
    it('should find user by email', async () => {
      await User.create({
        email: generateUniqueEmail('find'),
        password: 'Password123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      });

      const user = await User.findOne({ email: generateUniqueEmail('find') });

      expect(user).toBeTruthy();
      expect(user!.email).toBe('find@example.com');
    });

    it('should not include password by default', async () => {
      await User.create({
        email: generateUniqueEmail('nopass'),
        password: 'Password123!',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      });

      const user = await User.findOne({ email: generateUniqueEmail('nopass') });

      expect(user).not.toHaveProperty('password');
    });
  });
});
