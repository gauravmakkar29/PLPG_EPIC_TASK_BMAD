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

# Start development servers
npm run dev
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all development servers |
| `npm run build` | Build all packages and apps |
| `npm run test` | Run all tests across workspaces |
| `npm run lint` | Lint all packages |
| `npm run typecheck` | Type-check all TypeScript |
| `npm run clean` | Clean all build artifacts |

## Workspaces

### Apps

- **@plpg/web**: React frontend application
- **@plpg/api**: Express.js backend API

### Packages

- **@plpg/shared**: Shared types, utilities, validation schemas, and Prisma client
- **@plpg/roadmap-engine**: DAG-based roadmap generation engine

## Development

### Local Development Setup

1. Ensure you have Node.js 20 LTS installed (use `nvm use`)
2. Run `npm install` from the root directory
3. Start Podman containers: `podman-compose -f podman/podman-compose.yml up -d`
4. Run database migrations: `npm run db:migrate -w @plpg/shared`
5. Start development: `npm run dev`

### Code Standards

- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Conventional Commits for commit messages
- All public methods must have JSDoc documentation

## License

MIT
