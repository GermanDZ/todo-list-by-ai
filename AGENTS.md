# AGENTS.md

> Instructions for AI coding agents working on this project.
>
> This file follows the [AGENTS.md](https://agents.md) open standard and works with Claude Code, Cursor, Copilot, Codex, Jules, Windsurf, and other AI coding tools.

---

## Project Overview

**TaskFlow** is a high-performance, minimalist To-Do web application designed for professionals who need a "no-friction" way to organize their day. The application focuses on speed, keyboard-centric navigation, and a clean aesthetic.

**Tech Stack**: React + Vite (frontend), Express + TypeScript (backend), PostgreSQL + Prisma (database), JWT authentication with refresh token rotation.

---

## Quick Start

```bash
# Clone and enter project
git clone <repository-url>
cd todo-list-by-ai

# Start database
docker compose -f infra/docker-compose.yml up -d

# Install dependencies
npm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Run database migrations
cd apps/api
npx prisma migrate dev

# Start development servers (in separate terminals)
# Terminal 1: API
cd apps/api && npm run dev

# Terminal 2: Web
cd apps/web && npm run dev
```

---

## Workflow

This project uses a documentation-driven workflow. Before implementing:

1. Read `docs/how-to-work/agent.md` for collaboration guidelines
2. Read `docs/how-to-work/stack.md` for technology choices
3. Read `docs/how-to-work/architecture.md` for system design
4. Read `docs/how-to-work/conventions.md` for coding standards
5. Check `docs/how-to-work/roadmap.md` for current tasks
6. Review `docs/features.md` for product requirements and acceptance criteria

### Key Principles

- **Small PRs**: Each PR solves exactly one issue
- **Atomic commits**: Each commit does one thing and passes all tests
- **Refactor first**: Preparation commits before feature commits
- **Working software**: Every commit is deployable
- **Simplicity**: YAGNI—don't over-engineer

---

## Commands

### Development

```bash
# Install dependencies (from root)
npm install

# Start API server
cd apps/api && npm run dev

# Start web frontend
cd apps/web && npm run dev

# Start database
docker compose -f infra/docker-compose.yml up -d
```

### Testing

```bash
# Run all tests (from root)
npm test

# Run API tests only
cd apps/api && npm test

# Run web tests only
cd apps/web && npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Linting & Formatting

```bash
# Lint code (from root)
npm run lint

# Format code (from root)
npm run format

# Type check (from root)
npm run type-check
```

### Database

```bash
# Run migrations
cd apps/api && npx prisma migrate dev

# Generate Prisma Client
cd apps/api && npx prisma generate

# Open Prisma Studio
cd apps/api && npx prisma studio

# Reset database (WARNING: deletes all data)
docker compose -f infra/docker-compose.yml down -v
cd apps/api && npx prisma migrate dev
```

---

## Code Style

### General

- Prefer clarity over cleverness
- Keep functions small and focused
- Write self-documenting code
- Comment _why_, not _what_

### Naming

- Variables: `camelCase`
- Functions: `camelCase`
- Classes/Types: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Files: `PascalCase` for components, `camelCase` for utilities

### Imports

1. Standard library
2. External dependencies
3. Internal modules
4. Relative imports

---

## Git Conventions

### Branches

```
feature/issue-{number}-{short-description}
fix/issue-{number}-{short-description}
refactor/{description}
docs/{description}
```

### Commit Messages

```
type(scope): description

Types: feat, fix, refactor, test, docs, chore
```

### Commit Sequence

When implementing a feature, follow this order:

1. `refactor`: Prepare codebase for changes
2. `test`: Add tests for new functionality
3. `feat`/`fix`: Implement the actual change
4. `docs`: Update documentation

Each commit must pass all tests.

### Pull Requests

- Title: `[TYPE] Brief description (#issue)`
- Link to the issue being solved
- Include brief description of approach
- Keep PRs small and focused (<400 lines changed)

---

## Testing

### What to Test

- Business logic and data transformations
- Edge cases and error handling
- Public APIs and interfaces
- Integration points
- Authentication flows
- Task CRUD operations

### Test Naming

Use descriptive names:

```
Good: should_return_401_when_access_token_is_expired
Bad:  test_auth
```

See `docs/testing.md` for detailed testing guidelines.

---

## Architecture

Brief overview of system structure. See `docs/how-to-work/architecture.md` for details.

### Key Directories

```
apps/
  web/          # React + Vite frontend
  api/          # Express backend
packages/
  shared/      # Shared TypeScript types (optional)
infra/         # Docker Compose for local DB
docs/          # Documentation
  how-to-work/ # Workflow docs (read these first)
```

### Important Patterns

- **JWT Authentication**: Access tokens in memory, refresh tokens in httpOnly cookies with rotation
- **Optimistic UI**: Immediate UI updates, sync with server in background
- **API Client Pattern**: Centralized API client with automatic token management
- **Stateless API**: No server-side session storage (JWT-based)

---

## Security Considerations

- Never commit secrets or credentials
- Use environment variables for configuration
- Validate all user input
- Follow principle of least privilege
- Hash passwords with bcrypt (salt rounds: 10)
- Use httpOnly cookies for refresh tokens
- Rotate refresh tokens on each use
- Validate JWT signatures and expiration

---

## When Stuck

1. Check `docs/how-to-work/decisions.md` for past architectural decisions
2. Check `docs/how-to-work/glossary.md` for domain terminology
3. Review `docs/features.md` for product requirements and acceptance criteria
4. Check `docs/how-to-work/roadmap.md` for current tasks and priorities
5. Ask for clarification rather than assuming
6. Surface trade-offs and propose alternatives

---

## Additional Resources

- [Workflow Guide](docs/how-to-work/agent.md)
- [Architecture](docs/how-to-work/architecture.md)
- [Tech Stack](docs/how-to-work/stack.md)
- [Conventions](docs/how-to-work/conventions.md)
- [Roadmap](docs/how-to-work/roadmap.md)
- [Features](docs/features.md)
- [Local Development](docs/local-development.md)
- [Testing](docs/testing.md)
