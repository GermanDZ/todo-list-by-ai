# TaskFlow

> A high-performance, minimalist To-Do web application designed for professionals who need a "no-friction" way to organize their day.

TaskFlow focuses on **speed**, **keyboard-centric navigation**, and a **clean aesthetic**. Unlike complex project management tools, TaskFlow delivers a stable, responsive MVP that users can rely on for daily task tracking with cloud persistence.

---

## Getting Started

### Prerequisites

- **Node.js** 20.x or later (LTS recommended)
- **Docker** and Docker Compose (for local Postgres database)
- **Git**

### Quick Start (Local Development)

```bash
# Clone the repository
git clone <repository-url>
cd todo-list-by-ai

# Start the database
docker compose -f infra/docker-compose.yml up -d

# Install dependencies (from project root)
npm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Edit .env files with your local settings

# Run database migrations
cd apps/api
npx prisma migrate dev

# Start the development servers (from project root)
# Terminal 1: API server
cd apps/api
npm run dev

# Terminal 2: Web frontend
cd apps/web
npm run dev
```

The API will be available at `http://localhost:3001` and the web app at `http://localhost:5173`.

See [Local Development](docs/local-development.md) for detailed setup instructions.

---

## Project Structure

This project uses a monorepo structure:

```
todo-list-by-ai/
├── apps/
│   ├── web/              # React + Vite frontend
│   └── api/               # Express backend API
├── packages/
│   └── shared/           # Shared TypeScript types (optional)
├── infra/
│   └── docker-compose.yml # Docker Compose for local Postgres
├── docs/
│   ├── how-to-work/      # Workflow documentation
│   ├── features.md       # Product features and requirements
│   ├── local-development.md
│   ├── testing.md
│   └── deployment.md
├── AGENTS.md             # Quick context for AI agents
├── LICENSE
└── README.md             # This file
```

---

## Environment Variables

### API (`apps/api/.env`)

| Variable                 | Description                          | Example                                          |
| ------------------------ | ------------------------------------ | ------------------------------------------------ |
| `DATABASE_URL`           | PostgreSQL connection string         | `postgresql://user:pass@localhost:5432/taskflow` |
| `JWT_SECRET`             | Secret for signing JWT access tokens | `your-secret-key-here`                           |
| `JWT_REFRESH_SECRET`     | Secret for signing refresh tokens    | `your-refresh-secret-here`                       |
| `JWT_ACCESS_EXPIRES_IN`  | Access token expiration              | `15m`                                            |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration             | `7d`                                             |
| `PORT`                   | API server port                      | `3001`                                           |
| `NODE_ENV`               | Environment                          | `development`                                    |
| `CORS_ORIGIN`            | Allowed origin for CORS              | `http://localhost:5173`                          |

### Web (`apps/web/.env`)

| Variable        | Description          | Example                 |
| --------------- | -------------------- | ----------------------- |
| `VITE_API_URL`  | Backend API base URL | `http://localhost:3001` |
| `VITE_APP_NAME` | Application name     | `TaskFlow`              |

---

## Running Tests

```bash
# Run all tests (from project root)
npm test

# Run API tests only
cd apps/api
npm test

# Run web tests only
cd apps/web
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

See [Testing](docs/testing.md) for testing conventions and guidelines.

---

## Local Deployment

This project is configured for local development only. The database runs via Docker Compose.

```bash
# Start all services
docker compose -f infra/docker-compose.yml up -d

# Stop all services
docker compose -f infra/docker-compose.yml down

# View logs
docker compose -f infra/docker-compose.yml logs -f
```

See [Deployment](docs/deployment.md) for detailed deployment instructions.

---

## Documentation

| Document                                         | Description                                             |
| ------------------------------------------------ | ------------------------------------------------------- |
| [Features](docs/features.md)                     | Product features, user stories, and acceptance criteria |
| [Local Development](docs/local-development.md)   | How to set up and run locally                           |
| [Testing](docs/testing.md)                       | Testing strategy and commands                           |
| [Deployment](docs/deployment.md)                 | Local deployment process                                |
| [Architecture](docs/how-to-work/architecture.md) | System design and data flows                            |
| [Tech Stack](docs/how-to-work/stack.md)          | Technology choices                                      |
| [Roadmap](docs/how-to-work/roadmap.md)           | Development roadmap and sprints                         |
| [Conventions](docs/how-to-work/conventions.md)   | Coding standards                                        |

---

## Working with This Project

This project uses a documentation-driven workflow in `/docs/how-to-work`. These docs define how humans and AI agents collaborate to build software, following Agile principles.

### For Developers

Before contributing, read:

1. **[agent.md](docs/how-to-work/agent.md)** — The workflow philosophy and process
2. **[stack.md](docs/how-to-work/stack.md)** — Technology choices
3. **[architecture.md](docs/how-to-work/architecture.md)** — System design
4. **[conventions.md](docs/how-to-work/conventions.md)** — Coding standards
5. **[roadmap.md](docs/how-to-work/roadmap.md)** — Current tasks and priorities

### For AI Agents (Claude Code)

Start every session by reading the docs in this order:

```
docs/how-to-work/agent.md → stack.md → architecture.md → conventions.md → roadmap.md
```

### Workflow Documents

| Document            | Type        | Purpose                               |
| ------------------- | ----------- | ------------------------------------- |
| `architecture.md`   | State       | Current system design                 |
| `stack.md`          | State       | Current tech choices                  |
| `conventions.md`    | State       | Coding standards                      |
| `roadmap.md`        | State       | Tasks and priorities                  |
| `glossary.md`       | State       | Domain terminology                    |
| `decisions.md`      | Incremental | Architectural decisions (append-only) |
| `changelog.md`      | Incremental | Release history (append-only)         |
| `retrospectives.md` | Incremental | Lessons learned (append-only)         |

**State docs** reflect current truth—update them to stay accurate.  
**Incremental docs** are append-only—never modify past entries.

---

## Contributing

1. Check `docs/how-to-work/roadmap.md` for available tasks
2. Create a branch: `feature/issue-{number}-{description}`
3. Make small, atomic commits (each must pass tests)
4. Submit a PR solving exactly one issue
5. Wait for review before merging

See [agent.md](docs/how-to-work/agent.md) for the full workflow.

---

## License

See [LICENSE](LICENSE) for details.

---

## Acknowledgments

TaskFlow is designed for professionals who value simplicity and speed in their task management workflow.
