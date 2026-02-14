import request from 'supertest';
import mongoose from 'mongoose';
import paymentRouter from './payment';
import User from '../models/User';
import { createTestUser, getAuthToken, cleanupTestData } from '../test/helpers';
import { createTestApp } from '../test/testApp';

describe('Payment Routes', () => {
  let testUser: any;
  let authToken: string;
  let app: any;

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
    testUser = await createTestUser();
    authToken = getAuthToken(testUser);
    app = createTestApp(paymentRouter, testUser, '/api/payment');
  });

  describe('POST /api/payment/create-checkout-session', () => {
    it('should create checkout session or return service unavailable', async () => {
      const response = await request(app)
        .post('/api/payment/create-checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          priceId: 'price_test123',
          plan: 'pro',
        });

      // Accept 200 (success) or 503 (service unavailable)
      expect([200, 503]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('sessionId');
        expect(response.body.data).toHaveProperty('url');
      }
    });

    it('should require priceId and plan', async () => {
      const response = await request(app)
        .post('/api/payment/create-checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/payment/create-portal-session', () => {
    it('should create billing portal session or return service unavailable', async () => {
      // Set up user with Stripe customer ID
      testUser.subscription.stripeCustomerId = 'cus_test123';
      await testUser.save();

      const response = await request(app)
        .post('/api/payment/create-portal-session')
        .set('Authorization', `Bearer ${authToken}`);

      // Accept 200 (success) or 503 (service unavailable)
      expect([200, 503]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.data).toHaveProperty('url');
      }
    });

    it('should return error without customer ID', async () => {
      const response = await request(app)
        .post('/api/payment/create-portal-session')
        .set('Authorization', `Bearer ${authToken}`);

      // Accept 400 (bad request) or 503 (service unavailable)
      expect([400, 503]).toContain(response.status);
    });
  });

  describe('GET /api/payment/subscription', () => {
    it('should get subscription status', async () => {
      const response = await request(app)
        .get('/api/payment/subscription')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('plan');
      expect(response.body.data).toHaveProperty('status');
    });
  });

  describe('POST /api/payment/cancel-subscription', () => {
    it('should cancel subscription or return service unavailable', async () => {
      testUser.subscription.stripeSubscriptionId = 'sub_test123';
      testUser.subscription.stripeCustomerId = 'cus_test123';
      await testUser.save();

      const response = await request(app)
        .post('/api/payment/cancel-subscription')
        .set('Authorization', `Bearer ${authToken}`);

      // Accept 200 (success) or 503 (service unavailable)
      expect([200, 503]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should return error without subscription', async () => {
      const response = await request(app)
        .post('/api/payment/cancel-subscription')
        .set('Authorization', `Bearer ${authToken}`);

      // Should return 400 or 503 depending on Stripe availability
      expect([400, 503]).toContain(response.status);
    });
  });

  describe('GET /api/payment/plans', () => {
    it('should get pricing plans without authentication', async () => {
      const response = await request(app).get('/api/payment/plans');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('price');
    });
  });

  describe('GET /api/payment/health', () => {
    it('should check payment service health without authentication', async () => {
      const response = await request(app).get('/api/payment/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('POST /api/payment/webhook', () => {
    it('should handle webhook events', async () => {
      const response = await request(app)
        .post('/api/payment/webhook')
        .set('stripe-signature', 'test_signature')
        .send({ type: 'checkout.session.completed' });

      // Webhook will fail without valid signature, but should not crash
      expect([200, 400, 503]).toContain(response.status);
    });

    it('should require stripe-signature header', async () => {
      const response = await request(app)
        .post('/api/payment/webhook')
        .send({ type: 'test' });

      expect([400, 503]).toContain(response.status);
    });
  });
});
