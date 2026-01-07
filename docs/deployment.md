# Local Deployment

> How to run TaskFlow locally using Docker Compose.

**Note**: This document covers local development deployment only. Production deployment documentation will be added in a future version.

---

## Overview

TaskFlow uses Docker Compose to run PostgreSQL locally. The API and web applications run as Node.js processes (not containerized for local development).

---

## Prerequisites

- **Docker** and Docker Compose installed
- **Node.js** 20.x or later
- All dependencies installed (see [Local Development](local-development.md))

---

## Local Deployment Process

### 1. Start the Database

```bash
# Start PostgreSQL container
docker compose -f infra/docker-compose.yml up -d

# Verify it's running
docker compose -f infra/docker-compose.yml ps
```

The database will be available at `localhost:5432`.

### 2. Run Database Migrations

```bash
cd apps/api
npx prisma migrate dev
```

This creates the database schema and generates Prisma Client.

### 3. Start the API Server

```bash
cd apps/api
npm run dev
```

The API will be available at `http://localhost:3001`.

### 4. Start the Web Application

In a separate terminal:

```bash
cd apps/web
npm run dev
```

The web app will be available at `http://localhost:5173`.

---

## Docker Compose Services

### PostgreSQL Service

**Configuration** (`infra/docker-compose.yml`):

```yaml
services:
  postgres:
    image: postgres:16
    container_name: taskflow-db
    environment:
      POSTGRES_USER: taskflow
      POSTGRES_PASSWORD: taskflow
      POSTGRES_DB: taskflow
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskflow"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

**Connection String**:

```
postgresql://taskflow:taskflow@localhost:5432/taskflow
```

---

## Managing the Database

### View Logs

```bash
docker compose -f infra/docker-compose.yml logs -f postgres
```

### Stop the Database

```bash
docker compose -f infra/docker-compose.yml stop
```

### Start the Database

```bash
docker compose -f infra/docker-compose.yml start
```

### Restart the Database

```bash
docker compose -f infra/docker-compose.yml restart postgres
```

### Remove Database (WARNING: Deletes All Data)

```bash
# Stop and remove containers
docker compose -f infra/docker-compose.yml down

# Remove containers and volumes (deletes data)
docker compose -f infra/docker-compose.yml down -v
```

---

## Environment Variables

### API Environment

Ensure `apps/api/.env` is configured:

```env
DATABASE_URL=postgresql://taskflow:taskflow@localhost:5432/taskflow
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Web Environment

Ensure `apps/web/.env` is configured:

```env
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=TaskFlow
```

---

## Health Checks

### Database Health

```bash
# Check if database is running
docker compose -f infra/docker-compose.yml ps

# Test database connection
docker compose -f infra/docker-compose.yml exec postgres pg_isready -U taskflow
```

### API Health

```bash
# Check API health endpoint (once implemented)
curl http://localhost:3001/api/health
```

### Web Application

Open `http://localhost:5173` in your browser.

---

## Troubleshooting

### Database Won't Start

**Problem**: Docker container fails to start.

**Solutions**:
1. Check if port 5432 is already in use:
   ```bash
   lsof -i :5432
   ```
2. Check Docker logs:
   ```bash
   docker compose -f infra/docker-compose.yml logs postgres
   ```
3. Remove and recreate container:
   ```bash
   docker compose -f infra/docker-compose.yml down -v
   docker compose -f infra/docker-compose.yml up -d
   ```

### Database Connection Errors

**Problem**: API can't connect to database.

**Solutions**:
1. Verify database is running: `docker compose -f infra/docker-compose.yml ps`
2. Check `DATABASE_URL` in `apps/api/.env` matches docker-compose.yml settings
3. Verify network connectivity: `docker compose -f infra/docker-compose.yml exec postgres psql -U taskflow -d taskflow -c "SELECT 1;"`

### Port Conflicts

**Problem**: Port 5432, 3001, or 5173 already in use.

**Solutions**:
1. Find process using the port:
   ```bash
   lsof -i :5432
   lsof -i :3001
   lsof -i :5173
   ```
2. Kill the process or change ports in configuration files

---

## Data Persistence

Database data is persisted in a Docker volume (`postgres_data`). Data survives container restarts but is deleted when you run `docker compose down -v`.

### Backup Database

```bash
# Create backup
docker compose -f infra/docker-compose.yml exec postgres pg_dump -U taskflow taskflow > backup.sql

# Restore backup
docker compose -f infra/docker-compose.yml exec -T postgres psql -U taskflow taskflow < backup.sql
```

### Reset Database

```bash
# Stop and remove containers and volumes
docker compose -f infra/docker-compose.yml down -v

# Start fresh
docker compose -f infra/docker-compose.yml up -d

# Run migrations
cd apps/api
npx prisma migrate dev
```

---

## Production Deployment

Production deployment documentation will be added in a future version. For now, TaskFlow is designed for local development only.

When production deployment is implemented, it will include:
- Hosting platform selection (e.g., Railway, Render, Fly.io)
- Environment variable management
- Database hosting (managed PostgreSQL)
- CI/CD pipeline for deployments
- Monitoring and logging setup

---

## References

- [Local Development](local-development.md) - Detailed setup instructions
- [Architecture](how-to-work/architecture.md) - System design
- [Docker Compose Documentation](https://docs.docker.com/compose/)
