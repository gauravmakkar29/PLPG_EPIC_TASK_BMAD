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
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Pre-commit Hooks

The project uses Husky and lint-staged to run:
- ESLint on staged TypeScript files
- Prettier formatting on all staged files
- Commitlint for commit message validation

---

## Troubleshooting CI Failures

### Lint Failures

```bash
# Run locally to see errors
cd plpg
pnpm lint

# Auto-fix issues
pnpm lint --fix
```

### Type Errors

```bash
# Run locally
cd plpg
pnpm typecheck
```

### Test Failures

```bash
# Run tests locally
cd plpg
pnpm test

# Run with coverage
pnpm test:coverage
```

### Build Failures

```bash
# Run build locally
cd plpg
pnpm build
```

---

## Questions?

For questions about the CI/CD pipeline or contribution process, please open an issue in the repository.
