# Local Development

> How to set up and run TaskFlow on your machine.

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** 20.x or later (LTS recommended)
  - Check version: `node --version`
  - Download: [nodejs.org](https://nodejs.org/)
- **Docker** and Docker Compose
  - Check Docker: `docker --version`
  - Check Docker Compose: `docker compose version`
  - Download: [docker.com](https://www.docker.com/get-started)
- **Git**
  - Check version: `git --version`

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd todo-list-by-ai
```

### 2. Start the Database

TaskFlow uses PostgreSQL running in Docker for local development.

```bash
# Start PostgreSQL container
docker compose -f infra/docker-compose.yml up -d

# Verify it's running
docker compose -f infra/docker-compose.yml ps

# View logs (optional)
docker compose -f infra/docker-compose.yml logs -f
```

The database will be available at `localhost:5432` with:

- Database: `taskflow`
- User: `taskflow`
- Password: `taskflow` (change in `infra/docker-compose.yml` for production)

### 3. Install Dependencies

From the project root:

```bash
npm install
```

This will install dependencies for both `apps/api` and `apps/web` (if using a monorepo manager like npm workspaces or pnpm).

Alternatively, install separately:

```bash
# Install API dependencies
cd apps/api
npm install

# Install web dependencies
cd ../web
npm install
```

### 4. Environment Configuration

Create `.env` files from the examples:

```bash
# API environment
cp apps/api/.env.example apps/api/.env

# Web environment
cp apps/web/.env.example apps/web/.env
```

#### Required Environment Variables

**API (`apps/api/.env`)**:

| Variable                 | Description                          | Example                                                  |
| ------------------------ | ------------------------------------ | -------------------------------------------------------- |
| `DATABASE_URL`           | PostgreSQL connection string         | `postgresql://taskflow:taskflow@localhost:5432/taskflow` |
| `JWT_SECRET`             | Secret for signing JWT access tokens | Generate with: `openssl rand -base64 32`                 |
| `JWT_REFRESH_SECRET`     | Secret for signing refresh tokens    | Generate with: `openssl rand -base64 32`                 |
| `JWT_ACCESS_EXPIRES_IN`  | Access token expiration time         | `15m`                                                    |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration time        | `7d`                                                     |
| `PORT`                   | API server port                      | `3001`                                                   |
| `NODE_ENV`               | Environment                          | `development`                                            |
| `CORS_ORIGIN`            | Allowed origin for CORS              | `http://localhost:5173`                                  |

**Web (`apps/web/.env`)**:

| Variable        | Description          | Example                 |
| --------------- | -------------------- | ----------------------- |
| `VITE_API_URL`  | Backend API base URL | `http://localhost:3001` |
| `VITE_APP_NAME` | Application name     | `TaskFlow`              |

### 5. Database Setup

Run Prisma migrations to create the database schema:

```bash
cd apps/api
npx prisma migrate dev
```

This will:

- Create the database schema
- Generate Prisma Client
- Seed the database (if seed script exists)

To view the database in Prisma Studio:

```bash
npx prisma studio
```

### 6. Start the Development Servers

You'll need two terminal windows:

**Terminal 1 - API Server**:

```bash
cd apps/api
npm run dev
```

The API will be available at `http://localhost:3001`.

**Terminal 2 - Web Frontend**:

```bash
cd apps/web
npm run dev
```

The web app will be available at `http://localhost:5173`.

---

## Common Tasks

### Reset Local Database

```bash
# Stop containers
docker compose -f infra/docker-compose.yml down

# Remove volumes (WARNING: deletes all data)
docker compose -f infra/docker-compose.yml down -v

# Start fresh
docker compose -f infra/docker-compose.yml up -d

# Run migrations
cd apps/api
npx prisma migrate dev
```

### Update Dependencies

```bash
# From project root
npm update

# Or update specific packages
cd apps/api
npm update <package-name>
```

### Generate Prisma Client

After modifying `schema.prisma`:

```bash
cd apps/api
npx prisma generate
```

### View Database Schema

```bash
cd apps/api
npx prisma studio
```

This opens a browser interface at `http://localhost:5555` to view and edit data.

---

## Troubleshooting

### Problem: Database connection fails

**Symptoms**: API server can't connect to PostgreSQL.

**Solutions**:

1. Verify Docker container is running: `docker compose -f infra/docker-compose.yml ps`
2. Check `DATABASE_URL` in `apps/api/.env` matches docker-compose.yml settings
3. Restart the database: `docker compose -f infra/docker-compose.yml restart`

### Problem: CORS errors in browser

**Symptoms**: Browser console shows CORS errors when making API requests.

**Solutions**:

1. Verify `CORS_ORIGIN` in `apps/api/.env` matches your web app URL (e.g., `http://localhost:5173`)
2. Ensure API server is running and accessible
3. Check that the web app is using the correct `VITE_API_URL`

### Problem: Refresh token cookie not being set

**Symptoms**: Login works but refresh token isn't stored in browser.

**Solutions**:

1. Verify API is setting cookies with correct flags:
   - `httpOnly: true`
   - `secure: false` (for local development)
   - `sameSite: 'lax'`
2. Check browser DevTools → Application → Cookies to see if cookie is present
3. Ensure API and web app are on compatible origins (localhost with same protocol)

### Problem: Port already in use

**Symptoms**: Error like "Port 3001 is already in use" or "Port 5173 is already in use".

**Solutions**:

1. Find the process using the port:

   ```bash
   # macOS/Linux
   lsof -i :3001
   lsof -i :5173

   # Kill the process
   kill -9 <PID>
   ```

2. Or change the port in `.env` files and restart servers

### Problem: Prisma Client not found

**Symptoms**: Error "Cannot find module '@prisma/client'".

**Solutions**:

1. Generate Prisma Client: `cd apps/api && npx prisma generate`
2. Reinstall dependencies: `cd apps/api && npm install`

### Problem: Database migrations fail

**Symptoms**: `prisma migrate dev` errors.

**Solutions**:

1. Check database is running: `docker compose -f infra/docker-compose.yml ps`
2. Verify `DATABASE_URL` is correct
3. Reset database (see "Reset Local Database" above) if schema is corrupted
4. Check for migration conflicts in `apps/api/prisma/migrations/`

---

## IDE Setup (Optional)

### VS Code / Cursor

Recommended extensions:

- **Prisma** (`Prisma.prisma`) - Syntax highlighting for Prisma schema
- **ESLint** (`dbaeumer.vscode-eslint`) - Linting
- **Prettier** (`esbenp.prettier-vscode`) - Code formatting
- **Thunder Client** or **REST Client** - API testing

Recommended settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  }
}
```

### Database Tools

- **Prisma Studio**: Built-in database browser (`npx prisma studio`)
- **TablePlus**: GUI database client (supports PostgreSQL)
- **DBeaver**: Free, open-source database tool

---

## Next Steps

Once your local environment is set up:

1. Read the [Architecture](how-to-work/architecture.md) documentation
2. Review the [Roadmap](how-to-work/roadmap.md) for current tasks
3. Check [Testing](testing.md) for how to run tests
4. See [Features](features.md) for product requirements
