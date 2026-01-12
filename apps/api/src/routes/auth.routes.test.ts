/**
 * @fileoverview Integration tests for authentication routes.
 * Tests the registration endpoint with full request/response cycle.
 *
 * @module @plpg/api/routes/auth.routes.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRoutes from './auth.routes';

// JWT secret for tests - must match process.env.JWT_SECRET
const TEST_JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long';

// Set environment variable for auth middleware which reads directly from process.env
process.env['JWT_SECRET'] = TEST_JWT_SECRET;

// Use vi.hoisted to define mockPrisma before vi.mock (which is hoisted)
const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  subscription: {
    create: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

// Mock modules before importing
vi.mock('../lib/prisma', () => ({
  getPrisma: () => mockPrisma,
  prisma: mockPrisma,
}));

// Mock rate limiter to prevent 429 errors in tests
vi.mock('../middleware/rateLimiter.middleware', () => ({
  authRateLimiter: (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) => next(),
  passwordResetRateLimiter: (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) => next(),
}));

vi.mock('../lib/env', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long',
    JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-at-least-32-characters-long',
    BCRYPT_ROUNDS: '4', // Lower rounds for faster tests
    TRIAL_DURATION_DAYS: '14',
  },
  getBcryptRounds: () => 4, // Lower for faster tests
  getTrialDurationDays: () => 14,
}));

vi.mock('../lib/jwt', async () => {
  const jwt = await import('jsonwebtoken');
  const { AuthenticationError } = await import('@plpg/shared');
  const secret = 'test-jwt-secret-at-least-32-characters-long';

  return {
    generateAccessToken: vi.fn(() => 'mock-access-token'),
    generateRefreshToken: vi.fn(() => 'mock-refresh-token'),
    REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,
    verifyAccessToken: (token: string) => {
      try {
        const decoded = jwt.default.verify(token, secret, {
          issuer: 'plpg-api',
          audience: 'plpg-client',
        });
        return decoded;
      } catch (error) {
        if (error instanceof jwt.default.TokenExpiredError) {
          throw new AuthenticationError('Token has expired');
        }
        throw new AuthenticationError('Invalid token');
      }
    },
  };
});

// Create test app
function createTestApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);

  // Error handler
  app.use(
    (
      err: Error & { status?: number; code?: string },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      res.status(err.status || 500).json({
        error: err.name,
        message: err.message,
        code: err.code,
      });
    }
  );

  return app;
}

describe('POST /auth/register', () => {
  let app: express.Application;

  const validRegistrationData = {
    email: 'test@example.com',
    password: 'SecurePass123!',
    name: 'Test User',
  };

  const mockCreatedUser = {
    id: 'new-user-id',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
    role: 'free' as const,
    emailVerified: false,
    createdAt: new Date('2026-01-09'),
    updatedAt: new Date('2026-01-09'),
    passwordHash: 'hashed-password',
  };

  const mockRefreshToken = {
    id: 'token-id',
    token: 'token-uuid',
    userId: 'new-user-id',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();

    // Default mock implementations
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => {
        return callback({
          user: {
            create: vi.fn().mockResolvedValue(mockCreatedUser),
          },
          subscription: {
            create: vi.fn().mockResolvedValue({}),
          },
          refreshToken: {
            create: vi.fn().mockResolvedValue(mockRefreshToken),
          },
        });
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create user and return 201 with tokens', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(validRegistrationData)
      .expect(201);

    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });

  it('should return user object without password', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(validRegistrationData)
      .expect(201);

    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.user).not.toHaveProperty('passwordHash');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).toHaveProperty('email');
    expect(response.body.user).toHaveProperty('name');
  });

  it('should return 409 for duplicate email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing-user',
      email: validRegistrationData.email,
    });

    const response = await request(app)
      .post('/auth/register')
      .send(validRegistrationData)
      .expect(409);

    expect(response.body.error).toBe('ConflictError');
    expect(response.body.message).toContain('already exists');
  });

  it('should return 400 for invalid email format', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        ...validRegistrationData,
        email: 'invalid-email',
      })
      .expect(400);

    expect(response.body.error).toBe('Validation Error');
    expect(response.body.details.body.email).toBeDefined();
  });

  it('should return 400 for weak password - too short', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        ...validRegistrationData,
        password: 'Short1!',
      })
      .expect(400);

    expect(response.body.error).toBe('Validation Error');
    expect(response.body.details.body.password).toBeDefined();
  });

  it('should return 400 for password without uppercase', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        ...validRegistrationData,
        password: 'lowercase123!',
      })
      .expect(400);

    expect(response.body.error).toBe('Validation Error');
  });

  it('should return 400 for password without lowercase', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        ...validRegistrationData,
        password: 'UPPERCASE123!',
      })
      .expect(400);

    expect(response.body.error).toBe('Validation Error');
  });

  it('should return 400 for password without number', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        ...validRegistrationData,
        password: 'NoNumbers!Pass',
      })
      .expect(400);

    expect(response.body.error).toBe('Validation Error');
  });

  it('should return 400 for password without special character', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        ...validRegistrationData,
        password: 'NoSpecialChar123',
      })
      .expect(400);

    expect(response.body.error).toBe('Validation Error');
  });

  it('should return 400 for missing name', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email: validRegistrationData.email,
        password: validRegistrationData.password,
      })
      .expect(400);

    expect(response.body.error).toBe('Validation Error');
  });

  it('should return 400 for empty request body', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({})
      .expect(400);

    expect(response.body.error).toBe('Validation Error');
  });

  it('should normalize email to lowercase', async () => {
    const uppercaseEmailData = {
      ...validRegistrationData,
      email: 'TEST@EXAMPLE.COM',
    };

    await request(app)
      .post('/auth/register')
      .send(uppercaseEmailData)
      .expect(201);

    // The email should be normalized when checking for existing user
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
  });

  it('should reject email with leading/trailing whitespace', async () => {
    // The email schema validates format before trimming,
    // so whitespace around email causes validation failure
    const emailWithWhitespace = {
      ...validRegistrationData,
      email: '  test@example.com  ',
    };

    const response = await request(app)
      .post('/auth/register')
      .send(emailWithWhitespace)
      .expect(400);

    expect(response.body.error).toBe('Validation Error');
  });

  it('should set correct content-type header', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(validRegistrationData)
      .expect(201);

    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
});

describe('GET /auth/me', () => {
  let app: express.Application;

  const mockUserWithSubscription = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'free' as const,
    emailVerified: false,
    subscription: {
      id: 'sub-123',
      userId: 'user-123',
      plan: 'free',
      status: 'active' as const,
      expiresAt: new Date('2026-01-23'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app)
      .get('/auth/me')
      .expect(401);

    expect(response.body.error).toBe('AuthenticationError');
    expect(response.body.message).toBe('Authentication required');
  });

  it('should return 401 with invalid token', async () => {
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body.error).toBe('AuthenticationError');
  });

  it('should return 401 with malformed authorization header', async () => {
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', 'NotBearer token')
      .expect(401);

    expect(response.body.error).toBe('AuthenticationError');
  });

  it('should return user data with valid token', async () => {
    // Mock prisma to return user with subscription
    mockPrisma.user.findUnique.mockResolvedValue(mockUserWithSubscription);

    // We need to create a valid JWT token for testing
    // Import jwt to sign a test token
    const jwt = await import('jsonwebtoken');
    const validToken = jwt.default.sign(
      { userId: 'user-123', email: 'test@example.com', role: 'free' },
      TEST_JWT_SECRET,
      { expiresIn: '15m' }
    );

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('userId', 'user-123');
    expect(response.body).toHaveProperty('email', 'test@example.com');
    expect(response.body).toHaveProperty('name', 'Test User');
    expect(response.body).toHaveProperty('subscriptionStatus');
    expect(response.body).toHaveProperty('isVerified');
    expect(response.body).toHaveProperty('role');
  });

  it('should return all required fields in response', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUserWithSubscription);

    const jwt = await import('jsonwebtoken');
    const validToken = jwt.default.sign(
      { userId: 'user-123', email: 'test@example.com', role: 'free' },
      TEST_JWT_SECRET,
      { expiresIn: '15m' }
    );

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    // Verify all required fields are present
    expect(response.body).toHaveProperty('userId');
    expect(response.body).toHaveProperty('email');
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('subscriptionStatus');
    expect(response.body).toHaveProperty('trialEndsAt');
    expect(response.body).toHaveProperty('isVerified');
    expect(response.body).toHaveProperty('role');
  });

  it('should return correct subscriptionStatus', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUserWithSubscription);

    const jwt = await import('jsonwebtoken');
    const validToken = jwt.default.sign(
      { userId: 'user-123', email: 'test@example.com', role: 'free' },
      TEST_JWT_SECRET,
      { expiresIn: '15m' }
    );

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(response.body.subscriptionStatus).toBe('active');
  });

  it('should return trialEndsAt for free users on trial', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUserWithSubscription);

    const jwt = await import('jsonwebtoken');
    const validToken = jwt.default.sign(
      { userId: 'user-123', email: 'test@example.com', role: 'free' },
      TEST_JWT_SECRET,
      { expiresIn: '15m' }
    );

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(response.body.trialEndsAt).not.toBeNull();
  });

  it('should return null trialEndsAt for non-trial users', async () => {
    const proUser = {
      ...mockUserWithSubscription,
      role: 'pro' as const,
      subscription: {
        ...mockUserWithSubscription.subscription,
        plan: 'pro',
        expiresAt: null,
      },
    };
    mockPrisma.user.findUnique.mockResolvedValue(proUser);

    const jwt = await import('jsonwebtoken');
    const validToken = jwt.default.sign(
      { userId: 'user-123', email: 'test@example.com', role: 'pro' },
      TEST_JWT_SECRET,
      { expiresIn: '15m' }
    );

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(response.body.trialEndsAt).toBeNull();
  });

  it('should return 401 with expired token', async () => {
    const jwt = await import('jsonwebtoken');
    // Create an expired token
    const expiredToken = jwt.default.sign(
      { userId: 'user-123', email: 'test@example.com', role: 'free' },
      TEST_JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(response.body.error).toBe('AuthenticationError');
  });

  it('should return 401 when user not found in database', async () => {
    // User exists in JWT but not in database
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const jwt = await import('jsonwebtoken');
    const validToken = jwt.default.sign(
      { userId: 'non-existent-user', email: 'test@example.com', role: 'free' },
      TEST_JWT_SECRET,
      { expiresIn: '15m' }
    );

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(401);

    expect(response.body.error).toBe('AuthenticationError');
  });
});
