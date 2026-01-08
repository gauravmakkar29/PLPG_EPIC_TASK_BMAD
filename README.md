# PLPG - Personal Learning Path Generator

A comprehensive AI-powered platform that generates personalized career transition roadmaps, starting with the Backend Developer → ML Engineer pathway.

## Architecture

This project is structured as an npm workspaces monorepo with the following layout:

```
plpg/
├── apps/
│   ├── web/                    # React frontend (Vite + React 18 + TypeScript)
│   └── api/                    # Express backend (Express.js + TypeScript)
├── packages/
│   ├── shared/                 # Shared types, utils, validation, Prisma
│   └── roadmap-engine/         # DAG logic for roadmap generation
├── podman/                     # Container configurations
├── scripts/                    # Utility scripts
├── docs/                       # Documentation
└── .github/                    # GitHub workflows
```

## Prerequisites

- **Node.js**: 20.18.0 LTS (see `.nvmrc`)
- **npm**: 10.0.0 or higher
- **Podman** (or Docker): For containerized local development

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd plpg

# Use correct Node.js version
nvm use

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start infrastructure services
podman-compose -f podman/podman-compose.yml up -d

# Run database migrations
npm run db:migrate -w @plpg/shared

# (Optional) Seed the database with sample data
npm run db:seed -w @plpg/shared

# Start development servers
npm run dev
```

## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React application (Vite) |
| Backend API | http://localhost:3001 | Express.js API |
| MailHog UI | http://localhost:8025 | View captured emails |
| PostgreSQL | localhost:5432 | Database server |
| Redis | localhost:6379 | Cache server |

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all development servers with hot reload |
| `npm run build` | Build all packages and apps |
| `npm run test` | Run all tests across workspaces |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint all packages |
| `npm run typecheck` | Type-check all TypeScript |
| `npm run clean` | Clean all build artifacts |

### Database Scripts

| Script | Description |
|--------|-------------|
| `npm run db:migrate -w @plpg/shared` | Run database migrations |
| `npm run db:seed -w @plpg/shared` | Seed database with sample data |
| `npm run db:studio -w @plpg/shared` | Open Prisma Studio (DB GUI) |
| `npm run db:reset -w @plpg/shared` | Reset database (drop all data) |

## Workspaces

### Apps

- **@plpg/web**: React frontend application (Vite + React 18 + TypeScript)
- **@plpg/api**: Express.js backend API (Express 5 + TypeScript)

### Packages

- **@plpg/shared**: Shared types, utilities, validation schemas, and Prisma client
- **@plpg/config**: Shared ESLint, TypeScript, Prettier, and Tailwind configurations

## Development

### Local Development Setup

#### Step 1: Prerequisites

Ensure you have the following installed:
- Node.js 20 LTS (`nvm use` will select the correct version)
- npm 10.0.0 or higher
- Podman (or Docker) for containerized services

#### Step 2: Clone and Install

```bash
git clone <repository-url>
cd plpg
nvm use
npm install
```

#### Step 3: Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env if needed (defaults work for local development)
```

#### Step 4: Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, and MailHog containers
podman-compose -f podman/podman-compose.yml up -d

# Verify all containers are running
podman-compose -f podman/podman-compose.yml ps

# View logs if needed
podman-compose -f podman/podman-compose.yml logs -f
```

#### Step 5: Database Setup

```bash
# Run database migrations
npm run db:migrate -w @plpg/shared

# (Optional) Seed the database
npm run db:seed -w @plpg/shared

# (Optional) Open Prisma Studio to view data
npm run db:studio -w @plpg/shared
```

#### Step 6: Start Development

```bash
# Start all apps with hot reload
npm run dev

# Or start individual apps
npm run dev -w @plpg/web    # Frontend only
npm run dev -w @plpg/api    # Backend only
```

### Infrastructure Management

#### Container Commands

```bash
# Start all containers
podman-compose -f podman/podman-compose.yml up -d

# Stop all containers
podman-compose -f podman/podman-compose.yml down

# Stop and remove all data (reset)
podman-compose -f podman/podman-compose.yml down -v

# View container logs
podman-compose -f podman/podman-compose.yml logs -f

# View specific service logs
podman-compose -f podman/podman-compose.yml logs -f postgres
```

#### Database Access

```bash
# Connect to PostgreSQL via psql
podman exec -it plpg-postgres psql -U plpg -d plpg_dev

# Connect to Redis via redis-cli
podman exec -it plpg-redis redis-cli
```

### Testing Emails

All emails sent by the application are captured by MailHog:

1. Open http://localhost:8025 in your browser
2. Send an email from the application (e.g., password reset)
3. View the captured email in MailHog's web interface

### Hot Reload

Both frontend and backend support hot reload:

- **Frontend (Vite)**: Changes to React components update instantly
- **Backend (tsx)**: Changes to API code restart the server automatically

### Code Standards

- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Conventional Commits for commit messages
- All public methods must have JSDoc documentation
- Pre-commit hooks enforce linting and formatting

## Troubleshooting

### Container Issues

```bash
# Check container status
podman-compose -f podman/podman-compose.yml ps

# Check container health
podman inspect plpg-postgres --format='{{.State.Health.Status}}'

# Restart a specific container
podman-compose -f podman/podman-compose.yml restart postgres
```

### Database Issues

```bash
# Reset database completely
npm run db:reset -w @plpg/shared

# Regenerate Prisma client
npm run db:generate -w @plpg/shared
```

### Port Conflicts

If ports are already in use, modify the port mappings in:
- `podman/podman-compose.yml` for infrastructure services
- `.env` for application ports

## License

MIT
