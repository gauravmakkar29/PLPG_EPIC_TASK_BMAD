# Contributing to PLPG

This document outlines the development workflow, CI/CD pipeline, and branch protection rules for the Personalized Learning Path Generator (PLPG) project.

## Table of Contents

- [Development Workflow](#development-workflow)
- [CI/CD Pipeline](#cicd-pipeline)
- [Branch Protection Rules](#branch-protection-rules)
- [Code Quality Standards](#code-quality-standards)

---

## Development Workflow

### Branch Strategy

1. **main** - Production-ready code. Protected branch.
2. **feature/*** - Feature branches for new development
3. **fix/*** - Bug fix branches
4. **epic-*** - Epic branches for large feature sets

### Pull Request Process

1. Create a feature branch from `main`
2. Implement changes following code quality standards
3. Push changes and create a Pull Request
4. Ensure all CI checks pass
5. Request code review from team members
6. Merge after approval and passing checks

---

## CI/CD Pipeline

The CI pipeline is defined in `.github/workflows/ci.yml` and runs automatically on:
- Every push to the `main` branch
- Every pull request targeting `main`

### Pipeline Architecture

```
+----------+    +------------+    +-------+
|   Lint   |    | Typecheck  |    | Test  |
+----------+    +------------+    +-------+
     |               |               |
     +---------------+---------------+
                     |
                     v
               +---------+
               |  Build  |
               +---------+
```

### Jobs

| Job | Description | Duration |
|-----|-------------|----------|
| **Lint** | Runs ESLint across all packages | ~1-2 min |
| **Typecheck** | Validates TypeScript types | ~1-2 min |
| **Test** | Executes test suite with coverage | ~2-3 min |
| **Build** | Compiles all packages | ~2-3 min |

### Concurrency

The pipeline uses concurrency controls to:
- Cancel in-progress runs when new commits are pushed
- Prevent resource waste from outdated pipeline runs
- Group runs by workflow and branch reference

---

## Branch Protection Rules

### Recommended GitHub Settings for `main` Branch

Configure these settings in **Repository Settings > Branches > Branch protection rules**:

#### Required Status Checks

Enable **"Require status checks to pass before merging"** with the following required checks:

| Check Name | Description |
|------------|-------------|
| `Lint` | ESLint code quality verification |
| `Type Check` | TypeScript type validation |
| `Test` | Full test suite execution |
| `Build` | Compilation and artifact verification |

#### Pull Request Requirements

| Setting | Recommended Value |
|---------|-------------------|
| Require a pull request before merging | **Enabled** |
| Required approvals | **1** (minimum) |
| Dismiss stale PR approvals on new pushes | **Enabled** |
| Require review from Code Owners | **Optional** |

#### Additional Protections

| Setting | Recommended Value |
|---------|-------------------|
| Require conversation resolution before merging | **Enabled** |
| Require signed commits | **Optional** |
| Require linear history | **Recommended** |
| Do not allow bypassing the above settings | **Enabled** |
| Allow force pushes | **Disabled** |
| Allow deletions | **Disabled** |

### Setting Up Branch Protection (Step-by-Step)

1. Navigate to your GitHub repository
2. Go to **Settings** > **Branches**
3. Click **Add branch protection rule**
4. Set **Branch name pattern** to `main`
5. Enable the following:
   - [x] Require a pull request before merging
   - [x] Require approvals (set to 1)
   - [x] Dismiss stale pull request approvals when new commits are pushed
   - [x] Require status checks to pass before merging
   - [x] Require branches to be up to date before merging
6. Under **Status checks that are required**, search and add:
   - `Lint`
   - `Type Check`
   - `Test`
   - `Build`
7. Enable additional settings as needed:
   - [x] Require conversation resolution before merging
   - [x] Do not allow bypassing the above settings
8. Click **Create** to save the rule

---

## Code Quality Standards

### ESLint Rules

The project enforces consistent code style through ESLint:
- TypeScript strict mode enabled
- React hooks rules
- Import ordering
- No unused variables

### TypeScript

- Strict type checking enabled
- No implicit `any` types
- Explicit return types for public functions

### Testing

- Unit tests required for business logic
- Integration tests for API endpoints
- Minimum coverage thresholds maintained
- Coverage reports uploaded to Codecov

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

#### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature or functionality | `feat(web): add user dashboard` |
| `fix` | Bug fix | `fix(api): resolve auth token expiry` |
| `docs` | Documentation changes | `docs(shared): update API docs` |
| `style` | Code style changes (formatting) | `style(web): fix indentation` |
| `refactor` | Code refactoring | `refactor(api): simplify auth flow` |
| `perf` | Performance improvements | `perf(web): optimize bundle size` |
| `test` | Adding or updating tests | `test(shared): add validation tests` |
| `build` | Build system changes | `build(config): update webpack` |
| `ci` | CI/CD changes | `ci: add coverage reporting` |
| `chore` | Maintenance tasks | `chore(deps): upgrade vitest` |
| `revert` | Reverting commits | `revert: feat(web): add dashboard` |

#### Commit Scopes

| Scope | Description |
|-------|-------------|
| `web` | Frontend web application |
| `api` | Backend API service |
| `shared` | Shared types, utilities, validation |
| `config` | Shared configuration packages |
| `ui` | UI component library |
| `auth` | Authentication and authorization |
| `roadmap` | Roadmap generation engine |
| `onboarding` | User onboarding flow |
| `dashboard` | Dashboard and progress tracking |
| `infra` | Infrastructure and deployment |
| `ci` | CI/CD pipelines |
| `docker` | Docker/containerization |
| `deps` | Dependency updates |
| `release` | Release-related changes |

#### Commit Message Examples

```bash
# Feature with scope
feat(web): add user authentication flow

# Bug fix with detailed body
fix(api): resolve database connection timeout

The connection pool was exhausting due to unclosed connections.
Added proper cleanup in the finally block.

Closes #123

# Documentation update
docs(shared): update API type definitions

# Dependency update
chore(deps): upgrade vitest to v3.2.3

# Breaking change (use ! after type)
feat(api)!: change auth response format

BREAKING CHANGE: The auth endpoint now returns { token, user }
instead of just the token string.
```

### Pre-commit Hooks

The project uses **Husky** and **lint-staged** to enforce code quality before commits.

#### What Runs on Pre-commit

| File Type | Actions |
|-----------|---------|
| `*.ts, *.tsx` | ESLint (with auto-fix) + Prettier |
| `*.js, *.jsx, *.cjs, *.mjs` | ESLint (with auto-fix) + Prettier |
| `*.json, *.md, *.yaml, *.yml` | Prettier |
| `*.css` | Prettier |

#### What Runs on Commit Message

- **Commitlint** validates the commit message format
- Rejects commits that don't follow Conventional Commits
- Provides helpful error messages on rejection

#### Bypassing Hooks (Use Sparingly)

```bash
# Bypass pre-commit and commit-msg hooks
git commit --no-verify -m "your message"

# Or use the shorthand
git commit -n -m "your message"
```

> **Warning:** Only bypass hooks in exceptional circumstances. All CI checks
> will still run, and non-compliant code will be rejected.

#### Troubleshooting Hooks

```bash
# If hooks aren't running after fresh clone
npm install  # This runs 'prepare' script which sets up husky

# Manually re-initialize husky
npm run prepare

# Test lint-staged manually
npx lint-staged

# Test commitlint manually
echo "feat(web): test message" | npx commitlint
```

---

## Troubleshooting CI Failures

### Lint Failures

```bash
# Run locally to see errors
npm run lint

# Auto-fix issues (in specific workspace)
npm run lint --workspace=@plpg/web -- --fix
```

### Type Errors

```bash
# Run locally
npm run typecheck
```

### Test Failures

```bash
# Run tests locally
npm test

# Run with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Build Failures

```bash
# Run build locally
npm run build
```

### Pre-commit Hook Failures

```bash
# Run lint-staged manually to see errors
npx lint-staged --verbose

# Check commitlint configuration
npx commitlint --from HEAD~1 --to HEAD --verbose
```

---

## Questions?

For questions about the CI/CD pipeline or contribution process, please open an issue in the repository.
