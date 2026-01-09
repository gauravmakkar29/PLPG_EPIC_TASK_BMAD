# Epic 1: User Authentication & Profile

**Epic ID:** E1
**Priority:** P0 (MVP)
**Functional Requirements:** FR1-FR5

---

## Epic Overview

Implement user authentication flows using self-hosted JWT + bcrypt authentication. This epic builds on E0's foundation (auth middleware, database schema, API structure) to deliver the user-facing authentication experience without any external authentication service dependencies.

### Business Value
- Required for personalized learning paths
- Enables user retention tracking
- Foundation for subscription management
- First user touchpoint - critical for conversion
- No external service dependencies = full control

### Dependencies
- **E0: Technical Foundation** (REQUIRED)
  - Auth middleware (`requireAuth`, `requirePro`) from `apps/api/src/middleware/`
  - User schema from `packages/shared/prisma/schema.prisma`
  - Zod validation schemas from `packages/shared/src/validation/auth.schema.ts`
  - API service layer from `apps/web/src/services/api.ts`
  - Test utilities from E0's testing infrastructure

### Dependents
- E2: Onboarding requires authenticated user
- E7: Billing requires user identity (can develop in parallel)

---

## User Stories

### Story 1.1: Auth Provider Integration

**As a** user visiting the application
**I want** authentication UI to be available
**So that** I can sign up or log in

**Acceptance Criteria:**
- [ ] AuthProvider wraps the application in `apps/web/src/App.tsx`
- [ ] Auth context provides user state, login, logout, register functions
- [ ] Token stored securely in localStorage
- [ ] Redirect URLs configured for post-auth navigation
- [ ] Loading state shown while checking auth status

**Technical Notes:**
```typescript
// apps/web/src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string | null;
  subscriptionStatus: 'free' | 'trial' | 'pro';
  trialEndsAt: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch {
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('auth_token', response.data.token);
    setUser(response.data.user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    localStorage.setItem('auth_token', response.data.token);
    setUser(response.data.user);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

**Imports from E0:**
- QueryClient configuration from `apps/web/src/lib/queryClient.ts`

---

### Story 1.2: Sign Up Page (Email & Password)

**As a** new user
**I want to** create an account using email/password
**So that** I can save my learning progress

**Acceptance Criteria:**
- [ ] `/sign-up` route renders registration form
- [ ] Email/password registration with validation
- [ ] Name field (optional)
- [ ] Password requirements enforced (8+ chars, 1 uppercase, 1 number)
- [ ] Email format validation
- [ ] Duplicate email shows clear error
- [ ] Success redirects to `/onboarding` (or `/dashboard` if onboarding complete)
- [ ] Analytics event: `signup_started`, `signup_completed`

**Technical Notes:**
```typescript
// apps/web/src/pages/SignUp.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, Alert } from '@plpg/ui';
import { registerSchema } from '@plpg/shared/validation';

export function SignUpPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate input
    const result = registerSchema.safeParse({ email, password, name });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, name || undefined);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>

        {error && <Alert variant="error" className="mb-4">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <p className="text-sm text-gray-500">
            Password must be 8+ characters with 1 uppercase and 1 number
          </p>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm">
          Already have an account? <Link to="/sign-in" className="text-blue-600">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
```

**Validation (from E0):**
- Use `registerSchema` from `@plpg/shared/validation`

---

### Story 1.3: Sign In Page

**As a** registered user
**I want to** log in with my credentials
**So that** I can access my personalized learning path

**Acceptance Criteria:**
- [ ] `/sign-in` route renders login form
- [ ] Email/password login
- [ ] Invalid credentials show generic error (security)
- [ ] "Forgot password?" link available
- [ ] Success redirects to `/dashboard` (or `/onboarding` if incomplete)
- [ ] "Remember me" checkbox (extends token expiry)
- [ ] Failed attempts tracked (5 failures = 15 min lockout)
- [ ] Analytics event: `login_completed`

**Technical Notes:**
```typescript
// apps/web/src/pages/SignIn.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card, Alert, Checkbox } from '@plpg/ui';

export function SignInPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold mb-6">Sign In</h1>

        {error && <Alert variant="error" className="mb-4">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex items-center justify-between">
            <Checkbox
              label="Remember me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <Link to="/forgot-password" className="text-sm text-blue-600">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm">
          Don't have an account? <Link to="/sign-up" className="text-blue-600">Sign up</Link>
        </p>
      </Card>
    </div>
  );
}
```

---

### Story 1.4: Registration API Endpoint

**As the** system
**I want to** handle user registration securely
**So that** users can create accounts with hashed passwords

**Acceptance Criteria:**
- [ ] `POST /v1/auth/register` endpoint created
- [ ] Password hashed with bcrypt (cost factor 12)
- [ ] Email uniqueness validated
- [ ] JWT token generated and returned
- [ ] Set `trialStartDate` to now
- [ ] Set `trialEndDate` to now + 14 days
- [ ] Track `signup_completed` event

**Technical Notes:**
```typescript
// apps/api/src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { registerSchema } from '@plpg/shared/validation';
import { ConflictError, ValidationError } from '@plpg/shared/errors';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate input
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const { email, password, name } = result.data;

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionStatus: 'trial',
        trialEndsAt: user.trialEndDate?.toISOString(),
      },
      token,
    });
  } catch (error) {
    next(error);
  }
}
```

**Imports from E0:**
- Prisma client from `apps/api/src/lib/prisma.ts`

---

### Story 1.5: Login API Endpoint

**As the** system
**I want to** authenticate users securely
**So that** users can log in with their credentials

**Acceptance Criteria:**
- [ ] `POST /v1/auth/login` endpoint created
- [ ] Password verified with bcrypt
- [ ] JWT token generated and returned
- [ ] Failed attempts tracked for rate limiting
- [ ] Return 401 for invalid credentials (generic message)

**Technical Notes:**
```typescript
// apps/api/src/controllers/auth.controller.ts (continued)
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Determine subscription status
    let subscriptionStatus: 'free' | 'trial' | 'pro' = 'free';
    const now = new Date();
    if (user.subscription?.status === 'active') {
      subscriptionStatus = 'pro';
    } else if (user.trialEndDate && user.trialEndDate > now) {
      subscriptionStatus = 'trial';
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionStatus,
        trialEndsAt: user.trialEndDate?.toISOString(),
      },
      token,
    });
  } catch (error) {
    next(error);
  }
}
```

---

### Story 1.6: Protected Route Wrapper

**As a** developer
**I want** a frontend route guard component
**So that** unauthenticated users are redirected to sign-in

**Acceptance Criteria:**
- [ ] `ProtectedRoute` component created
- [ ] Checks authentication state from AuthContext
- [ ] Redirects to `/sign-in` if not authenticated
- [ ] Shows loading spinner while checking auth
- [ ] Passes through to children if authenticated
- [ ] Optional: Check onboarding completion, redirect to `/onboarding`

**Technical Notes:**
```typescript
// apps/web/src/components/auth/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOnboardingStatus } from '../../hooks/useOnboardingStatus';
import { Spinner } from '@plpg/ui';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const { data: onboardingStatus, isLoading: onboardingLoading } = useOnboardingStatus();
  const location = useLocation();

  if (isLoading || onboardingLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if not complete
  if (onboardingStatus && !onboardingStatus.completedAt && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
```

**Imports from E0:**
- Spinner component from `@plpg/ui`

---

### Story 1.7: Get Current Session Endpoint

**As a** frontend application
**I want** an API endpoint to get the current user session
**So that** I can display user info and subscription status

**Acceptance Criteria:**
- [ ] `GET /v1/auth/me` endpoint created
- [ ] Requires authentication (uses `requireAuth` from E0)
- [ ] Returns user data with subscription status
- [ ] Returns 401 if not authenticated
- [ ] Response matches `Session` schema from E0

**Technical Notes:**
```typescript
// apps/api/src/controllers/auth.controller.ts (continued)
export async function getMe(req: Request, res: Response) {
  // req.user populated by requireAuth middleware from E0
  const { id, email, subscriptionStatus, trialEndsAt } = req.user!;

  // Fetch full user data
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, avatarUrl: true },
  });

  res.json({
    userId: id,
    email,
    name: user?.name,
    avatarUrl: user?.avatarUrl,
    subscriptionStatus,
    trialEndsAt: trialEndsAt?.toISOString() ?? null,
  });
}

// apps/api/src/routes/auth.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware';
import { register, login, getMe, logout } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.post('/logout', requireAuth, logout);

export default router;
```

**Imports from E0:**
- `requireAuth` middleware from `apps/api/src/middleware/`
- `Session` type from `@plpg/shared/types`

---

### Story 1.8: User Profile Page

**As a** logged-in user
**I want to** view and edit my profile
**So that** I can keep my information accurate

**Acceptance Criteria:**
- [ ] `/settings/profile` route created
- [ ] Display: name, email, avatar, account created date
- [ ] Edit name via form
- [ ] Show subscription status badge (Free/Trial/Pro)
- [ ] Show trial expiration date if applicable
- [ ] Link to billing settings

**Technical Notes:**
```typescript
// apps/web/src/pages/Settings/Profile.tsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Avatar, Button, Input } from '@plpg/ui';
import { api } from '../../services/api';

export function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch('/users/me', { name });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-4">
        <Avatar src={user?.avatarUrl} alt={user?.name || 'User'} />
        <div>
          <h2>{user?.name || 'Anonymous'}</h2>
          <p className="text-muted">{user?.email}</p>
          <Badge variant={user?.subscriptionStatus}>
            {user?.subscriptionStatus === 'pro' ? 'Pro' :
             user?.subscriptionStatus === 'trial' ? 'Trial' : 'Free'}
          </Badge>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {user?.subscriptionStatus === 'trial' && user.trialEndsAt && (
        <p className="mt-4 text-sm text-amber-600">
          Trial ends: {new Date(user.trialEndsAt).toLocaleDateString()}
        </p>
      )}
    </Card>
  );
}
```

**Imports from E0:**
- UI components from `@plpg/ui`

---

### Story 1.9: Sign Out Flow

**As a** logged-in user
**I want to** sign out of my account
**So that** I can secure my session on shared devices

**Acceptance Criteria:**
- [ ] Sign out button in header/settings
- [ ] Calls logout function from AuthContext
- [ ] Clears local state (localStorage, TanStack Query cache, Zustand stores)
- [ ] Redirects to landing page or sign-in
- [ ] Analytics event: `logout_completed`

**Technical Notes:**
```typescript
// apps/web/src/components/auth/SignOutButton.tsx
import { useAuth } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@plpg/ui';

export function SignOutButton() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleSignOut = () => {
    queryClient.clear(); // Clear all cached data
    logout();
    navigate('/');
  };

  return (
    <Button variant="ghost" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}
```

---

### Story 1.10: Password Reset Flow

**As a** user who forgot my password
**I want to** reset my password via email
**So that** I can regain access to my account

**Acceptance Criteria:**
- [ ] `/forgot-password` route with email input
- [ ] `POST /v1/auth/forgot-password` generates reset token
- [ ] Reset token stored with expiry (1 hour)
- [ ] Email sent via Nodemailer to MailHog (dev)
- [ ] `/reset-password/:token` route for new password
- [ ] `POST /v1/auth/reset-password` validates token and updates password
- [ ] Success redirects to sign-in with success message
- [ ] Rate limiting: max 3 requests per email per hour

**Technical Notes:**
```typescript
// apps/api/src/controllers/auth.controller.ts (continued)
import crypto from 'crypto';
import { sendEmail } from '../lib/email';

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success (don't reveal if email exists)
    if (!user) {
      return res.json({ success: true });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetTokenHash, resetTokenExpiry },
    });

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;

    // Hash token and find user
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Update password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
```

---

### Story 1.11: Email Service Setup

**As the** system
**I want** to send emails for password resets and notifications
**So that** users can recover their accounts

**Acceptance Criteria:**
- [ ] Nodemailer configured with SMTP settings
- [ ] MailHog captures all emails in development
- [ ] Email templates for password reset
- [ ] Error handling for failed sends

**Technical Notes:**
```typescript
// apps/api/src/lib/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: false, // MailHog doesn't use TLS
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@plpg.local',
    ...options,
  });
}
```

---

## API Endpoints Summary

| Method | Endpoint | Description | Auth | Handler |
|--------|----------|-------------|------|---------|
| POST | `/v1/auth/register` | Create new user | None | `auth.controller.register` |
| POST | `/v1/auth/login` | Authenticate user | None | `auth.controller.login` |
| GET | `/v1/auth/me` | Get current session | Required | `auth.controller.getMe` |
| POST | `/v1/auth/logout` | End session | Required | `auth.controller.logout` |
| POST | `/v1/auth/forgot-password` | Request password reset | None | `auth.controller.forgotPassword` |
| POST | `/v1/auth/reset-password` | Reset password with token | None | `auth.controller.resetPassword` |

---

## Non-Functional Requirements Mapping

| NFR | Requirement | Implementation |
|-----|-------------|----------------|
| NFR11 | TLS 1.3 encryption | HTTPS in production |
| NFR13 | bcrypt hashing | bcrypt with cost factor 12 |
| NFR14 | 24hr token expiry | JWT expiresIn configuration |
| NFR15 | Rate limiting | E0 middleware for API |
| NFR18 | Auth event logging | Pino structured logging |

---

## Testing Requirements

### Unit Tests
```typescript
// apps/api/src/controllers/auth.controller.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register, login, getMe } from './auth.controller';
import { createMockRequest, createMockResponse } from '../test/utils';
import bcrypt from 'bcrypt';

vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('AuthController', () => {
  describe('register', () => {
    it('creates user with hashed password', async () => {
      // Test implementation
    });

    it('returns 409 for duplicate email', async () => {
      // Test implementation
    });
  });

  describe('login', () => {
    it('returns token for valid credentials', async () => {
      // Test implementation
    });

    it('returns 401 for invalid password', async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests
```typescript
// apps/api/src/routes/auth.routes.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { seedTestData, createTestPrisma } from '../test/db';

describe('Auth Routes', () => {
  const prisma = createTestPrisma();

  beforeAll(async () => {
    await seedTestData(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /v1/auth/register', () => {
    it('creates new user and returns token', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({
          email: 'new@example.com',
          password: 'Password123',
          name: 'New User',
        });

      expect(response.status).toBe(201);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('new@example.com');
    });
  });

  describe('GET /v1/auth/me', () => {
    it('returns 401 without auth token', async () => {
      const response = await request(app).get('/v1/auth/me');
      expect(response.status).toBe(401);
    });
  });
});
```

---

## Acceptance Testing Checklist

- [ ] New user can register with email/password
- [ ] User record created in database with hashed password
- [ ] JWT token returned on registration
- [ ] Existing user can log in
- [ ] Invalid credentials show error
- [ ] Password reset email sent via MailHog
- [ ] Password reset flow works end-to-end
- [ ] Profile page displays user info and subscription status
- [ ] Sign out clears session and redirects
- [ ] Protected routes redirect unauthenticated users
- [ ] `useAuth` hook returns correct data

---

## Definition of Done

- [ ] All 11 stories implemented and passing tests
- [ ] AuthProvider integrated in frontend
- [ ] Registration and login endpoints working
- [ ] `requireAuth` middleware (from E0) working on protected endpoints
- [ ] `useAuth` hook available for frontend components
- [ ] Password reset via email (MailHog in dev)
- [ ] Unit tests: >80% coverage on auth controller
- [ ] Integration tests: auth endpoints tested
- [ ] Component tests: ProtectedRoute tested
- [ ] Analytics events firing for auth actions
- [ ] No console errors in browser
- [ ] Accessible (keyboard navigation, screen reader friendly)

---

*Epic document generated with BMAD methodology*
