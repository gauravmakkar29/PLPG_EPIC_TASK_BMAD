# PLPG Architecture Document (Local-First Edition)

**Project:** Personalized Learning Path Generator (PLPG)
**Version:** 2.0.0
**Last Updated:** 2026-01-08
**Status:** Draft - Simplified for Local Development

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [High Level Architecture](#2-high-level-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Data Models](#4-data-models)
5. [API Specification](#5-api-specification)
6. [Components](#6-components)
7. [Authentication System](#7-authentication-system)
8. [Core Workflows](#8-core-workflows)
9. [Database Schema](#9-database-schema)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Backend Architecture](#11-backend-architecture)
12. [Project Structure](#12-project-structure)
13. [Development Workflow](#13-development-workflow)
14. [Local Services Setup](#14-local-services-setup)
15. [Security & Performance](#15-security--performance)
16. [Testing Strategy](#16-testing-strategy)
17. [Coding Standards](#17-coding-standards)
18. [Error Handling](#18-error-handling)
19. [Logging & Debugging](#19-logging--debugging)

---

## 1. Introduction

### 1.1 Project Overview

PLPG (Personalized Learning Path Generator) is a web application that helps backend developers transition to ML engineering roles through personalized, time-aware learning roadmaps. The platform uses a DAG-based skill dependency engine to generate optimized learning paths based on user constraints.

### 1.2 Architecture Philosophy

**Local-First Design** - This architecture is optimized for:
- Running entirely on localhost with no external service dependencies
- Simple setup with Podman Compose for all services
- Self-hosted authentication (no third-party auth providers)
- Mock services for payments and email during development
- Easy debugging and development workflow

### 1.3 Monorepo Strategy

**npm workspaces** (simplified from Turborepo) for managing the fullstack application:

```
plpg/
├── apps/
│   ├── web/          # React frontend (Vite)
│   └── api/          # Express backend
├── packages/
│   ├── shared/       # Shared types, utilities
│   └── roadmap-engine/  # DAG-based roadmap generation
├── podman/           # Podman configs
└── docs/             # Documentation
```

### 1.4 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo | npm workspaces | Simple, built-in Node.js feature, no extra tooling |
| Frontend | React + Vite | Fast builds, excellent DX, no config needed |
| Backend | Express.js | Simple, battle-tested, easy to understand |
| Database | PostgreSQL (Podman) | Reliable, runs locally, Prisma support |
| ORM | Prisma | Type-safe, great migrations, local-friendly |
| Auth | JWT + bcrypt | Self-hosted, no external dependencies |
| Cache | Redis (Podman) | Optional, for session storage |
| Email | MailHog (Podman) | Catches all emails locally for testing |

---

## 2. High Level Architecture

### 2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PLPG Local Architecture                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐                                                          │
│   │   Browser   │                                                          │
│   │   Client    │                                                          │
│   └──────┬──────┘                                                          │
│          │                                                                  │
│          ▼                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    localhost (Development)                           │  │
│   └─────────────────────────────┬───────────────────────────────────────┘  │
│                                 │                                          │
│          ┌──────────────────────┴──────────────────────┐                   │
│          │                                             │                   │
│          ▼                                             ▼                   │
│   ┌─────────────┐                               ┌─────────────┐           │
│   │   Vite      │                               │   Express   │           │
│   │  :5173      │◄─────────────────────────────►│   :3001     │           │
│   │  React SPA  │         REST API              │  Backend    │           │
│   └─────────────┘                               └──────┬──────┘           │
│                                                        │                   │
│          ┌─────────────────────────────────────────────┤                   │
│          │                     │                       │                   │
│          ▼                     ▼                       ▼                   │
│   ┌─────────────┐       ┌─────────────┐       ┌─────────────┐            │
│   │ PostgreSQL  │       │    Redis    │       │   MailHog   │            │
│   │   :5432     │       │   :6379     │       │   :8025     │            │
│   │  (Podman)   │       │  (Podman)   │       │  (Podman)   │            │
│   └─────────────┘       └─────────────┘       └─────────────┘            │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │                    Podman Compose Services                       │    │
│   │  • PostgreSQL - Primary database                                 │    │
│   │  • Redis - Session cache (optional)                              │    │
│   │  • MailHog - Email testing UI                                    │    │
│   └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Infrastructure Components

| Component | Service | Port | Purpose |
|-----------|---------|------|---------|
| Frontend | Vite Dev Server | 5173 | React SPA with HMR |
| Backend | Express.js | 3001 | REST API server |
| Database | PostgreSQL | 5432 | Primary data store |
| Cache | Redis | 6379 | Session storage (optional) |
| Email | MailHog | 8025 | Email testing UI |
| Email SMTP | MailHog | 1025 | SMTP for sending |

### 2.3 Communication Patterns

- **Frontend ↔ Backend**: REST API over HTTP with JSON payloads
- **Backend ↔ Database**: Prisma ORM with direct connection
- **Backend ↔ Cache**: ioredis for session data (optional)
- **Backend ↔ Email**: Nodemailer to MailHog SMTP

---

## 3. Tech Stack

### 3.1 Complete Technology Matrix

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Frontend** |
| Framework | React | 18.x | UI library |
| Build Tool | Vite | 5.x | Fast builds, HMR |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| Components | Shadcn/ui | latest | Accessible components |
| State (Server) | TanStack Query | 5.x | Server state management |
| State (Client) | Zustand | 4.x | Client state management |
| Routing | React Router | 6.x | Client-side routing |
| Forms | React Hook Form | 7.x | Form handling |
| Validation | Zod | 3.x | Schema validation |
| Charts | Recharts | 2.x | Progress visualization |
| **Backend** |
| Runtime | Node.js | 20 LTS | JavaScript runtime |
| Framework | Express.js | 4.x | HTTP server |
| Language | TypeScript | 5.x | Type safety |
| ORM | Prisma | 5.x | Database access |
| Validation | Zod | 3.x | Request validation |
| **Database** |
| Primary | PostgreSQL | 15 | Relational data (Podman) |
| Cache | Redis | 7.x | Session storage (Podman) |
| **Auth & Security** |
| Password Hashing | bcrypt | 5.x | Secure password storage |
| Tokens | jsonwebtoken | 9.x | JWT authentication |
| Sessions | express-session | 1.x | Session management |
| Rate Limiting | express-rate-limit | 7.x | API protection |
| **Email** |
| Transport | Nodemailer | 6.x | Email sending |
| Testing | MailHog | latest | Email capture (Podman) |
| **DevOps** |
| Package Manager | npm | 10.x | Built-in, simple |
| Containers | Podman | latest | Local services |
| Orchestration | Podman Compose | latest | Multi-container setup |
| **Logging** |
| Logger | Pino | 8.x | Structured JSON logs |
| Pretty Print | pino-pretty | 10.x | Dev-friendly output |
| **Testing** |
| Unit | Vitest | 1.x | Fast unit tests |
| Component | Testing Library | 14.x | React testing |
| E2E | Playwright | 1.x | Browser testing |
| API | Supertest | 6.x | HTTP testing |

### 3.2 Package Architecture

```
packages/
├── shared/           # @plpg/shared
│   ├── types/        # TypeScript interfaces
│   ├── constants/    # Shared constants
│   ├── utils/        # Utility functions
│   └── validation/   # Zod schemas
└── roadmap-engine/   # @plpg/roadmap-engine
    ├── dag/          # DAG operations
    ├── scheduler/    # Time calculation
    └── generator/    # Roadmap generation
```

---

## 4. Data Models

### 4.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PLPG Data Model                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐         ┌──────────────────┐         ┌──────────────┐   │
│   │     User     │────────►│OnboardingResponse│         │    Skill     │   │
│   ├──────────────┤   1:1   ├──────────────────┤         ├──────────────┤   │
│   │ id           │         │ id               │         │ id           │   │
│   │ email        │         │ userId           │    ┌───►│ name         │   │
│   │ passwordHash │         │ currentRole      │    │    │ phase        │   │
│   │ name         │         │ targetRole       │    │    │ estimatedHrs │   │
│   │ role (enum)  │         │ weeklyHours      │    │    │ isOptional   │   │
│   │ isVerified   │         │ skillsToSkip[]   │    │    └──────┬───────┘   │
│   └──────┬───────┘         └──────────────────┘    │           │           │
│          │                                          │           │ N:M       │
│          │ 1:1                                      │    ┌──────▼───────┐   │
│          │                                          │    │ SkillPrereq  │   │
│          ▼                                          │    ├──────────────┤   │
│   ┌──────────────┐         ┌──────────────────┐    │    │ skillId      │   │
│   │ Subscription │         │    Roadmap       │────┘    │ prerequisite │   │
│   ├──────────────┤    1:1  ├──────────────────┤         └──────────────┘   │
│   │ id           │◄────────│ id               │                            │
│   │ userId       │         │ userId           │         ┌──────────────┐   │
│   │ plan (enum)  │         │ weeklyHours      │         │   Resource   │   │
│   │ status       │         │ totalHours       │    ┌───►├──────────────┤   │
│   │ expiresAt    │         │ projectedEnd     │    │    │ id           │   │
│   └──────────────┘         └────────┬─────────┘    │    │ skillId      │   │
│                                     │              │    │ title        │   │
│                                     │ 1:N         │    │ url          │   │
│                                     ▼              │    │ type         │   │
│                            ┌──────────────────┐    │    └──────────────┘   │
│                            │  RoadmapModule   │────┘                       │
│                            ├──────────────────┤         ┌──────────────┐   │
│                            │ id               │         │   Feedback   │   │
│                            │ roadmapId        │         ├──────────────┤   │
│                            │ skillId          │         │ id           │   │
│                            │ status           │         │ userId       │   │
│                            └────────┬─────────┘         │ rating       │   │
│                                     │                   └──────────────┘   │
│                                     │ 1:1                                  │
│                                     ▼                                      │
│                            ┌──────────────────┐                            │
│                            │    Progress      │                            │
│                            ├──────────────────┤                            │
│                            │ id               │                            │
│                            │ moduleId         │                            │
│                            │ completedAt      │                            │
│                            └──────────────────┘                            │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 TypeScript Interfaces

```typescript
// packages/shared/src/types/user.ts
export interface User {
  id: string;
  email: string;
  passwordHash: string;  // bcrypt hashed
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'free' | 'pro' | 'admin';

// packages/shared/src/types/auth.ts
export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

// packages/shared/src/types/subscription.ts
export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionPlan = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

// packages/shared/src/types/skill.ts
export interface Skill {
  id: string;
  name: string;
  slug: string;
  description: string;
  phase: Phase;
  estimatedHours: number;
  isOptional: boolean;
  prerequisites: string[];
  resources: Resource[];
}

export type Phase = 'foundation' | 'core_ml' | 'deep_learning';

// packages/shared/src/types/resource.ts
export interface Resource {
  id: string;
  skillId: string;
  title: string;
  url: string;
  type: ResourceType;
  source: string;
  estimatedMinutes: number;
  description: string | null;
}

export type ResourceType = 'video' | 'documentation' | 'tutorial' | 'mini_project';

// packages/shared/src/types/roadmap.ts
export interface Roadmap {
  id: string;
  userId: string;
  weeklyHours: number;
  totalHours: number;
  completedHours: number;
  projectedCompletion: Date;
  createdAt: Date;
  updatedAt: Date;
  modules: RoadmapModule[];
}

export interface RoadmapModule {
  id: string;
  roadmapId: string;
  skillId: string;
  phase: Phase;
  sequenceOrder: number;
  status: ModuleStatus;
  skill: Skill;
  progress: Progress | null;
}

export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'skipped';

// packages/shared/src/types/progress.ts
export interface Progress {
  id: string;
  moduleId: string;
  startedAt: Date | null;
  completedAt: Date | null;
  timeSpentMinutes: number;
}
```

---

## 5. API Specification

### 5.1 API Overview

- **Base URL**: `http://localhost:3001/api/v1`
- **Authentication**: Bearer token (JWT)
- **Content-Type**: `application/json`
- **Rate Limiting**: 100 requests/minute per IP

### 5.2 Endpoint Reference

#### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Create new account | None |
| POST | `/auth/login` | Login, get tokens | None |
| POST | `/auth/logout` | Invalidate tokens | Required |
| POST | `/auth/refresh` | Refresh access token | Refresh token |
| GET | `/auth/me` | Get current user | Required |
| POST | `/auth/forgot-password` | Send reset email | None |
| POST | `/auth/reset-password` | Reset password | Reset token |
| POST | `/auth/verify-email` | Verify email address | Verify token |

#### User Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/profile` | Get user profile | Required |
| PATCH | `/users/profile` | Update profile | Required |
| PATCH | `/users/password` | Change password | Required |
| DELETE | `/users/account` | Delete account | Required |

#### Onboarding Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/onboarding/status` | Check completion | Required |
| POST | `/onboarding/step/:step` | Submit step | Required |
| GET | `/onboarding/skills` | Get skills list | Required |
| POST | `/onboarding/complete` | Generate roadmap | Required |

#### Roadmap Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/roadmap` | Get user's roadmap | Required |
| GET | `/roadmap/module/:id` | Get module details | Required |
| GET | `/roadmap/progress` | Get progress summary | Required |
| POST | `/roadmap/recalculate` | Recalculate timeline | Required |

#### Progress Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/progress/module/:id/start` | Start module | Required |
| POST | `/progress/module/:id/complete` | Complete module | Required |

#### Subscription Endpoints (Mock)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/subscription` | Get subscription | Required |
| POST | `/subscription/upgrade` | Upgrade to Pro (mock) | Required |
| POST | `/subscription/cancel` | Cancel subscription | Required |

#### Content Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/skills` | List all skills | Public |
| GET | `/skills/:id` | Get skill details | Public |
| GET | `/resources/:id` | Get resource details | Public |

### 5.3 Request/Response Examples

#### Register User

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

```json
{
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "free",
    "isVerified": false,
    "createdAt": "2026-01-08T10:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

```json
{
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "free"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Get Roadmap

```http
GET /api/v1/roadmap
Authorization: Bearer <accessToken>
```

```json
{
  "id": "rm_abc123",
  "weeklyHours": 10,
  "totalHours": 150,
  "completedHours": 45,
  "projectedCompletion": "2026-06-15T00:00:00Z",
  "phases": [
    {
      "phase": "foundation",
      "name": "Foundation",
      "totalModules": 5,
      "completedModules": 3,
      "status": "in_progress",
      "modules": [
        {
          "id": "mod_xyz789",
          "skillId": "skill_python",
          "name": "Python for ML",
          "status": "completed",
          "estimatedHours": 8
        }
      ]
    }
  ]
}
```

### 5.4 Error Response Format

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "status": 401
  }
}
```

---

## 6. Components

### 6.1 Frontend Component Architecture

```
apps/web/src/
├── components/
│   ├── common/              # Shared UI components
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Badge/
│   │   ├── Progress/
│   │   ├── Skeleton/
│   │   └── Toast/
│   ├── layout/              # Layout components
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── Footer/
│   │   └── PageContainer/
│   ├── auth/                # Auth-related components
│   │   ├── LoginForm/
│   │   ├── RegisterForm/
│   │   ├── ForgotPasswordForm/
│   │   └── ProtectedRoute/
│   ├── onboarding/          # Onboarding flow
│   │   ├── OnboardingLayout/
│   │   ├── StepIndicator/
│   │   ├── RoleSelector/
│   │   ├── HoursSlider/
│   │   ├── SkillAssessment/
│   │   └── OnboardingSummary/
│   ├── dashboard/           # Dashboard components
│   │   ├── ProgressOverview/
│   │   ├── PhaseCard/
│   │   ├── CurrentModule/
│   │   └── QuickActions/
│   ├── roadmap/             # Roadmap components
│   │   ├── RoadmapView/
│   │   ├── PhaseSection/
│   │   ├── ModuleCard/
│   │   ├── ModuleDetail/
│   │   └── ResourceList/
│   └── progress/            # Progress tracking
│       ├── ProgressBar/
│       ├── CompletionModal/
│       └── MilestoneAlert/
├── pages/                   # Route pages
│   ├── Landing/
│   ├── Login/
│   ├── Register/
│   ├── ForgotPassword/
│   ├── Onboarding/
│   ├── Dashboard/
│   ├── Roadmap/
│   ├── Module/
│   ├── Settings/
│   └── NotFound/
├── hooks/                   # Custom hooks
│   ├── useAuth.ts
│   ├── useRoadmap.ts
│   ├── useProgress.ts
│   └── useSubscription.ts
├── services/               # API service layer
│   ├── api.ts              # Axios instance
│   ├── auth.service.ts
│   ├── roadmap.service.ts
│   └── progress.service.ts
├── stores/                 # Zustand stores
│   ├── authStore.ts        # Auth state
│   ├── uiStore.ts          # UI state
│   └── onboardingStore.ts  # Onboarding wizard
├── contexts/               # React contexts
│   └── AuthContext.tsx
└── lib/                    # Utilities
    ├── utils.ts
    └── constants.ts
```

### 6.2 Component Hierarchy Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         App (Root)                                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    AuthProvider                                │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │                 QueryClientProvider                      │  │  │
│  │  │  ┌───────────────────────────────────────────────────┐  │  │  │
│  │  │  │                   Router                           │  │  │  │
│  │  │  │                                                    │  │  │  │
│  │  │  │   ┌─────────┐  ┌─────────────┐  ┌────────────┐   │  │  │  │
│  │  │  │   │ Landing │  │ Auth Pages  │  │ Protected  │   │  │  │  │
│  │  │  │   │  Page   │  │Login/Signup │  │   Routes   │   │  │  │  │
│  │  │  │   └─────────┘  └─────────────┘  └─────┬──────┘   │  │  │  │
│  │  │  │                                       │          │  │  │  │
│  │  │  │                        ┌──────────────┴──────────┤  │  │  │
│  │  │  │                        │                         │  │  │  │
│  │  │  │                        ▼                         │  │  │  │
│  │  │  │              ┌─────────────────┐                 │  │  │  │
│  │  │  │              │   MainLayout    │                 │  │  │  │
│  │  │  │              │ ┌─────────────┐ │                 │  │  │  │
│  │  │  │              │ │   Header    │ │                 │  │  │  │
│  │  │  │              │ ├─────────────┤ │                 │  │  │  │
│  │  │  │              │ │   Content   │ │                 │  │  │  │
│  │  │  │              │ │   Outlet    │ │                 │  │  │  │
│  │  │  │              │ └─────────────┘ │                 │  │  │  │
│  │  │  │              └─────────────────┘                 │  │  │  │
│  │  │  │                                                  │  │  │  │
│  │  │  └──────────────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.3 Backend Service Architecture

```
apps/api/src/
├── controllers/            # HTTP request handlers
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── onboarding.controller.ts
│   ├── roadmap.controller.ts
│   ├── progress.controller.ts
│   ├── subscription.controller.ts
│   └── content.controller.ts
├── services/               # Business logic
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── onboarding.service.ts
│   ├── roadmap.service.ts
│   ├── progress.service.ts
│   ├── subscription.service.ts
│   └── email.service.ts
├── repositories/           # Data access layer
│   ├── user.repository.ts
│   ├── roadmap.repository.ts
│   ├── progress.repository.ts
│   └── subscription.repository.ts
├── middleware/             # Express middleware
│   ├── auth.middleware.ts      # JWT validation
│   ├── subscription.middleware.ts
│   ├── rateLimiter.middleware.ts
│   ├── errorHandler.middleware.ts
│   └── logger.middleware.ts
├── routes/                 # Route definitions
│   ├── index.ts
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── onboarding.routes.ts
│   ├── roadmap.routes.ts
│   ├── progress.routes.ts
│   ├── subscription.routes.ts
│   └── content.routes.ts
├── lib/                    # Utilities
│   ├── prisma.ts           # Prisma client
│   ├── redis.ts            # Redis client (optional)
│   ├── email.ts            # Nodemailer config
│   ├── jwt.ts              # JWT utilities
│   └── logger.ts           # Pino logger
├── validators/             # Zod schemas
│   ├── auth.validator.ts
│   ├── user.validator.ts
│   └── progress.validator.ts
└── types/                  # Local types
    ├── express.d.ts
    └── env.d.ts
```

---

## 7. Authentication System

### 7.1 JWT-Based Authentication

Self-hosted authentication using JWT tokens with bcrypt password hashing.

```typescript
// apps/api/src/lib/jwt.ts
import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '@plpg/shared';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export function generateAccessToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as AuthTokenPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: string };
}
```

### 7.2 Auth Middleware

```typescript
// apps/api/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { AuthenticationError } from '@plpg/shared';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token');
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = verifyAccessToken(token);
    } catch {
      // Token invalid, but that's ok for optional auth
    }
  }

  next();
}
```

### 7.3 Password Hashing

```typescript
// apps/api/src/services/auth.service.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 7.4 Frontend Auth Context

```typescript
// apps/web/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '@plpg/shared';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await authService.register({ email, password, name });
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## 8. Core Workflows

### 8.1 User Registration Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │   API   │     │   DB    │     │ MailHog │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ POST /register│               │               │
     │──────────────>│               │               │
     │               │               │               │
     │               │ Hash password │               │
     │               │ Create user   │               │
     │               │──────────────>│               │
     │               │               │               │
     │               │ Send verify   │               │
     │               │ email         │               │
     │               │──────────────────────────────>│
     │               │               │               │
     │               │ Generate JWT  │               │
     │               │               │               │
     │ Return tokens │               │               │
     │<──────────────│               │               │
     │               │               │               │
     │ Redirect to   │               │               │
     │ Onboarding    │               │               │
     │               │               │               │
```

### 8.2 Login Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │   API   │     │   DB    │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     │ POST /login   │               │
     │──────────────>│               │
     │               │               │
     │               │ Find user     │
     │               │──────────────>│
     │               │               │
     │               │ Verify        │
     │               │ password      │
     │               │               │
     │               │ Generate      │
     │               │ access +      │
     │               │ refresh tokens│
     │               │               │
     │ Return tokens │               │
     │ + user data   │               │
     │<──────────────│               │
     │               │               │
```

### 8.3 Onboarding Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │   API   │     │   DB    │     │ Engine  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Step 1:       │               │               │
     │ Current Role  │               │               │
     │──────────────>│               │               │
     │               │ Save Response │               │
     │               │──────────────>│               │
     │               │               │               │
     │ Step 2:       │               │               │
     │ Weekly Hours  │               │               │
     │──────────────>│               │               │
     │               │ Save Response │               │
     │               │──────────────>│               │
     │               │               │               │
     │ Step 3:       │               │               │
     │ Skip Skills   │               │               │
     │──────────────>│               │               │
     │               │ Save Response │               │
     │               │──────────────>│               │
     │               │               │               │
     │ Complete      │               │               │
     │──────────────>│               │               │
     │               │ Generate      │               │
     │               │ Roadmap       │               │
     │               │──────────────────────────────>│
     │               │               │               │
     │               │               │ DAG + Schedule│
     │               │<──────────────────────────────│
     │               │               │               │
     │               │ Save Roadmap  │               │
     │               │──────────────>│               │
     │               │               │               │
     │ Roadmap Ready │               │               │
     │<──────────────│               │               │
     │               │               │               │
```

### 8.4 Module Completion Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │     │   API   │     │   DB    │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     │ POST complete │               │
     │──────────────>│               │
     │               │               │
     │               │ Update        │
     │               │ Progress      │
     │               │──────────────>│
     │               │               │
     │               │ Recalculate   │
     │               │ completion    │
     │               │ estimate      │
     │               │──────────────>│
     │               │               │
     │               │ Unlock next   │
     │               │ modules       │
     │               │──────────────>│
     │               │               │
     │ Updated       │               │
     │ roadmap       │               │
     │<──────────────│               │
     │               │               │
```

---

## 9. Database Schema

### 9.1 Prisma Schema

```prisma
// packages/shared/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER MANAGEMENT
// ============================================

enum UserRole {
  free
  pro
  admin
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String?
  avatarUrl     String?
  role          UserRole  @default(free)
  isVerified    Boolean   @default(false)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  onboarding    OnboardingResponse?
  roadmap       Roadmap?
  subscription  Subscription?
  feedback      Feedback[]
  refreshTokens RefreshToken[]

  @@index([email])
  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}

model OnboardingResponse {
  id           String   @id @default(uuid())
  userId       String   @unique
  currentRole  String
  targetRole   String   @default("ml_engineer")
  weeklyHours  Int
  skillsToSkip String[] @default([])
  completedAt  DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("onboarding_responses")
}

// ============================================
// SKILL & CONTENT MANAGEMENT
// ============================================

enum Phase {
  foundation
  core_ml
  deep_learning
}

model Skill {
  id             String  @id @default(uuid())
  name           String
  slug           String  @unique
  description    String
  phase          Phase
  estimatedHours Decimal @db.Decimal(4, 1)
  isOptional     Boolean @default(false)
  sequenceOrder  Int     @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  resources     Resource[]
  prerequisites SkillPrerequisite[] @relation("SkillPrereqs")
  dependents    SkillPrerequisite[] @relation("SkillDependents")
  modules       RoadmapModule[]

  @@index([phase])
  @@index([slug])
  @@map("skills")
}

model SkillPrerequisite {
  id             String @id @default(uuid())
  skillId        String
  prerequisiteId String

  skill        Skill @relation("SkillPrereqs", fields: [skillId], references: [id], onDelete: Cascade)
  prerequisite Skill @relation("SkillDependents", fields: [prerequisiteId], references: [id], onDelete: Cascade)

  @@unique([skillId, prerequisiteId])
  @@map("skill_prerequisites")
}

enum ResourceType {
  video
  documentation
  tutorial
  mini_project
}

model Resource {
  id               String       @id @default(uuid())
  skillId          String
  title            String
  url              String
  type             ResourceType
  source           String
  estimatedMinutes Int
  description      String?
  sequenceOrder    Int          @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  skill   Skill           @relation(fields: [skillId], references: [id], onDelete: Cascade)
  modules RoadmapModule[]

  @@index([skillId])
  @@map("resources")
}

// ============================================
// ROADMAP & PROGRESS
// ============================================

model Roadmap {
  id                  String    @id @default(uuid())
  userId              String    @unique
  weeklyHours         Int
  totalHours          Decimal   @db.Decimal(6, 1)
  completedHours      Decimal   @default(0) @db.Decimal(6, 1)
  projectedCompletion DateTime

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user    User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  modules RoadmapModule[]

  @@map("roadmaps")
}

enum ModuleStatus {
  locked
  available
  in_progress
  completed
  skipped
}

model RoadmapModule {
  id            String       @id @default(uuid())
  roadmapId     String
  skillId       String
  resourceId    String?
  phase         Phase
  sequenceOrder Int
  status        ModuleStatus @default(locked)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  roadmap  Roadmap   @relation(fields: [roadmapId], references: [id], onDelete: Cascade)
  skill    Skill     @relation(fields: [skillId], references: [id])
  resource Resource? @relation(fields: [resourceId], references: [id])
  progress Progress?
  feedback Feedback[]

  @@unique([roadmapId, skillId])
  @@index([roadmapId])
  @@index([status])
  @@map("roadmap_modules")
}

model Progress {
  id               String    @id @default(uuid())
  moduleId         String    @unique
  startedAt        DateTime?
  completedAt      DateTime?
  timeSpentMinutes Int       @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  module RoadmapModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  @@map("progress")
}

// ============================================
// SUBSCRIPTION (Simplified)
// ============================================

enum SubscriptionStatus {
  active
  expired
  cancelled
}

model Subscription {
  id        String             @id @default(uuid())
  userId    String             @unique
  plan      String             @default("free")
  status    SubscriptionStatus @default(active)
  expiresAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}

// ============================================
// FEEDBACK
// ============================================

model Feedback {
  id       String  @id @default(uuid())
  userId   String
  moduleId String
  rating   Int
  comment  String?

  createdAt DateTime @default(now())

  user   User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  module RoadmapModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  @@index([moduleId])
  @@index([userId])
  @@map("feedback")
}
```

---

## 10. Frontend Architecture

### 10.1 State Management Strategy

**TanStack Query** for server state:
- API data caching
- Automatic refetching
- Optimistic updates

**Zustand** for client state:
- UI state (modals, toasts)
- Onboarding wizard steps

```typescript
// Example: TanStack Query hook
export function useRoadmap() {
  return useQuery({
    queryKey: ['roadmap'],
    queryFn: () => roadmapService.getRoadmap(),
    staleTime: 1000 * 60 * 5,
  });
}

// Example: Zustand store
interface UIStore {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
```

### 10.2 Routing Structure

```typescript
// apps/web/src/routes.tsx
const routes = [
  // Public routes
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },

  // Protected routes
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/onboarding', element: <Onboarding /> },
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/roadmap', element: <Roadmap /> },
      { path: '/roadmap/module/:id', element: <ModuleDetail /> },
      { path: '/settings', element: <Settings /> },
    ],
  },

  // Fallback
  { path: '*', element: <NotFound /> },
];
```

### 10.3 API Service Layer

```typescript
// apps/web/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api.request(error.config);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 11. Backend Architecture

### 11.1 Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Request Flow                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   HTTP Request                                                      │
│        │                                                            │
│        ▼                                                            │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                      Middleware Layer                        │  │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │  │
│   │  │ Logger  │→│  Auth   │→│  Rate   │→│ Validate│→│ Error │ │  │
│   │  │         │ │  (JWT)  │ │ Limiter │ │  (Zod)  │ │Handler│ │  │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────┘ │  │
│   └─────────────────────────────┬───────────────────────────────┘  │
│                                 │                                   │
│                                 ▼                                   │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                     Controller Layer                         │  │
│   │  • Parse request parameters                                  │  │
│   │  • Call service methods                                      │  │
│   │  • Format HTTP responses                                     │  │
│   └─────────────────────────────┬───────────────────────────────┘  │
│                                 │                                   │
│                                 ▼                                   │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                      Service Layer                           │  │
│   │  • Business logic                                            │  │
│   │  • Data transformation                                       │  │
│   │  • Email sending                                             │  │
│   └─────────────────────────────┬───────────────────────────────┘  │
│                                 │                                   │
│                                 ▼                                   │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                    Repository Layer                          │  │
│   │  • Database queries (Prisma)                                 │  │
│   │  • Data access abstraction                                   │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.2 Express App Setup

```typescript
// apps/api/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import routes from './routes';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));

// Parsing
app.use(express.json());

// Logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// Routes
app.use('/api/v1', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling (must be last)
app.use(errorHandler);

export default app;
```

---

## 12. Project Structure

### 12.1 Complete Directory Tree

```
plpg/
├── apps/
│   ├── web/                          # React Frontend
│   │   ├── public/
│   │   │   └── favicon.ico
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── stores/
│   │   │   ├── contexts/
│   │   │   ├── lib/
│   │   │   ├── styles/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── routes.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                          # Express Backend
│       ├── src/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── repositories/
│       │   ├── middleware/
│       │   ├── routes/
│       │   ├── lib/
│       │   ├── validators/
│       │   ├── types/
│       │   ├── app.ts
│       │   └── server.ts
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── shared/                       # Shared Code
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── constants/
│   │   │   ├── utils/
│   │   │   └── validation/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── roadmap-engine/               # DAG Engine
│       ├── src/
│       │   ├── dag/
│       │   ├── scheduler/
│       │   ├── generator/
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── podman/
│   ├── podman-compose.yml            # All services
│   └── podman-compose.dev.yml        # Development overrides
│
├── scripts/
│   ├── setup.sh                      # Initial setup script
│   └── seed.ts                       # Database seeding
│
├── package.json                      # Root package.json
├── .env.example                      # Environment template
├── .gitignore
└── README.md
```

---

## 13. Development Workflow

### 13.1 Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/plpg.git
cd plpg

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Start Podman services (PostgreSQL, Redis, MailHog)
podman-compose up -d

# 5. Run database migrations
npm run db:migrate

# 6. Seed database with initial data
npm run db:seed

# 7. Start development servers
npm run dev
```

### 13.2 Available Scripts

```json
{
  "scripts": {
    "dev": "npm run dev --workspaces --if-present",
    "dev:web": "npm run dev --workspace=apps/web",
    "dev:api": "npm run dev --workspace=apps/api",
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present",
    "db:migrate": "prisma migrate dev --schema=packages/shared/prisma/schema.prisma",
    "db:push": "prisma db push --schema=packages/shared/prisma/schema.prisma",
    "db:seed": "ts-node packages/shared/prisma/seed.ts",
    "db:studio": "prisma studio --schema=packages/shared/prisma/schema.prisma",
    "podman:up": "podman-compose up -d",
    "podman:down": "podman-compose down",
    "podman:logs": "podman-compose logs -f"
  }
}
```

### 13.3 Development URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | React application |
| Backend API | http://localhost:3001 | Express API |
| API Docs | http://localhost:3001/api/v1 | API endpoints |
| MailHog UI | http://localhost:8025 | Email testing |
| Prisma Studio | http://localhost:5555 | Database GUI |

---

## 14. Local Services Setup

### 14.1 Podman Compose Configuration

```yaml
# podman/podman-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: plpg-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: plpg
      POSTGRES_PASSWORD: plpg_local_password
      POSTGRES_DB: plpg_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U plpg -d plpg_dev"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: plpg-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  mailhog:
    image: mailhog/mailhog:latest
    container_name: plpg-mailhog
    ports:
      - "1025:1025"   # SMTP
      - "8025:8025"   # Web UI
    logging:
      driver: none

volumes:
  postgres_data:
  redis_data:
```

### 14.2 Environment Variables

```bash
# .env.example

# Application
NODE_ENV=development
PORT=3001

# Frontend
VITE_API_URL=http://localhost:3001/api/v1

# Database
DATABASE_URL=postgresql://plpg:plpg_local_password@localhost:5432/plpg_dev

# Redis (optional)
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate your own for production!)
ACCESS_TOKEN_SECRET=your-super-secret-access-token-key-change-in-production
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-in-production

# Email (MailHog for local development)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@plpg.local

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 14.3 Email Configuration (Nodemailer + MailHog)

```typescript
// apps/api/src/lib/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: false,
  // No auth needed for MailHog
});

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@plpg.local',
    ...options,
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Verify your PLPG account',
    html: `
      <h1>Welcome to PLPG!</h1>
      <p>Click the link below to verify your email:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset your PLPG password',
    html: `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
    `,
  });
}
```

---

## 15. Security & Performance

### 15.1 Security Measures

| Category | Implementation |
|----------|----------------|
| Authentication | JWT tokens with bcrypt password hashing |
| Authorization | Role-based (free/pro/admin) middleware |
| Password Storage | bcrypt with 12 salt rounds |
| Input Validation | Zod schemas on all endpoints |
| Rate Limiting | 100 req/min per IP |
| CORS | Whitelist frontend origin only |
| Headers | Helmet.js security headers |
| Secrets | Environment variables |

### 15.2 Performance Targets

| Metric | Target |
|--------|--------|
| API Response | < 200ms p95 |
| Database Query | < 50ms p95 |
| Page Load | < 1s (local) |

---

## 16. Testing Strategy

### 16.1 Test Categories

| Type | Tool | Location |
|------|------|----------|
| Unit (Backend) | Vitest | `apps/api/src/**/*.test.ts` |
| Unit (Frontend) | Vitest | `apps/web/src/**/*.test.tsx` |
| Integration | Supertest | `apps/api/src/**/*.integration.ts` |
| E2E | Playwright | `e2e/` |

### 16.2 Running Tests

```bash
# All tests
npm test

# Backend only
npm test --workspace=apps/api

# Frontend only
npm test --workspace=apps/web

# E2E tests
npm run test:e2e
```

---

## 17. Coding Standards

### 17.1 TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### 17.2 Code Conventions

**Naming**:
- Components: PascalCase (`ModuleCard.tsx`)
- Hooks: camelCase with `use` prefix (`useRoadmap.ts`)
- Services: camelCase with `.service` suffix (`roadmap.service.ts`)
- Types: PascalCase (`RoadmapModule`)

---

## 18. Error Handling

### 18.1 Error Types

```typescript
// packages/shared/src/errors/index.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, unknown>) {
    super('VALIDATION_ERROR', 'Invalid request data', 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}
```

### 18.2 Error Handler Middleware

```typescript
// apps/api/src/middleware/errorHandler.ts
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
```

---

## 19. Logging & Debugging

### 19.1 Logging Strategy

```typescript
// apps/api/src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    },
  },
});

// Usage
logger.info({ userId, action: 'login' }, 'User logged in');
logger.error({ err, context }, 'Failed to process request');
```

### 19.2 Debugging Tools

| Tool | URL | Purpose |
|------|-----|---------|
| Prisma Studio | localhost:5555 | Visual database browser |
| MailHog | localhost:8025 | View sent emails |
| VS Code Debugger | - | Breakpoint debugging |

---

## Appendix A: Migration from Cloud Architecture

If migrating from the cloud-based architecture:

| Cloud Service | Local Replacement |
|---------------|-------------------|
| Clerk | JWT + bcrypt |
| Neon | PostgreSQL (Podman) |
| Upstash | Redis (Podman) |
| Vercel | Vite dev server |
| Railway | Express dev server |
| PostHog | Console logging |
| Sentry | Pino + error middleware |
| Resend | Nodemailer + MailHog |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **DAG** | Directed Acyclic Graph - skill dependency structure |
| **Phase** | Learning stage (Foundation, Core ML, Deep Learning) |
| **Module** | Single learning unit in a roadmap |
| **Roadmap** | Personalized learning path for a user |
| **JWT** | JSON Web Token - stateless authentication |

---

*Architecture document updated for local-first development - BMAD methodology*
