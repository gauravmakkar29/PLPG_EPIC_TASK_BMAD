/**
 * @fileoverview Integration tests for authentication routes.
 * Tests the registration endpoint with full request/response cycle.
 *
 * @module @plpg/api/routes/auth.routes.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authRoutes } from './auth.routes';

// Mock the prisma client
const mockPrisma = {
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
};

// Mock modules before importing
vi.mock('../lib/prisma', () => ({
  getPrisma: () => mockPrisma,
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

vi.mock('../lib/jwt', () => ({
  generateAccessToken: vi.fn(() => 'mock-access-token'),
  generateRefreshToken: vi.fn(() => 'mock-refresh-token'),
  REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,
}));

// Create test app
function createTestApp() {
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
    mockPrisma.$transaction.mockImplementation(async (callback) => {
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
    });
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
