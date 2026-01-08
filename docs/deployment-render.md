# Render Deployment Guide

> Step-by-step instructions for deploying TaskFlow to Render.com using the Hobby plan with maximum CLI automation.

This guide covers deploying both the backend API and frontend web application to Render, along with setting up a PostgreSQL database. All operations can be performed via CLI to minimize web interface usage.

---

## Prerequisites

### 1. Install Render CLI

**macOS/Linux (using Homebrew):**
```bash
brew install render
```

**Linux/macOS (using install script):**
```bash
curl -fsSL https://render.com/install.sh | bash
```

**Windows:**
Download the executable from [Render CLI releases](https://github.com/render-oss/render-cli/releases)

**Verify installation:**
```bash
render --version
```

### 2. Create Render Account

If you don't have a Render account, sign up at [render.com](https://render.com). The Hobby plan is free and includes:
- 1 project with 2 environments
- 100 GB bandwidth/month
- 500 build pipeline minutes/month
- Up to 2 custom domains

### 3. Authenticate CLI

```bash
render login
```

This will open a browser window for authentication. After successful login, the CLI stores credentials locally.

### 4. Git Repository

Ensure your code is in a Git repository hosted on GitHub, GitLab, or Bitbucket. Render deploys from Git repositories.

---

## Quick Start (Using render.yaml)

The fastest way to deploy is using the `render.yaml` infrastructure-as-code file:

**Note:** Render blueprints (render.yaml) are deployed through the Render dashboard, not via CLI. After the initial setup via dashboard, you can manage services using the CLI.

### Option 1: Deploy via Dashboard (Recommended for First Time)

1. Push your code (including `render.yaml`) to GitHub/GitLab/Bitbucket
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Blueprint"
4. Connect your repository
5. Render will detect `render.yaml` and create all services

### Option 2: Create Services Manually via CLI

See "Manual Service Creation" section below for CLI commands to create services individually.

After services are created, you'll need to:

1. Set JWT secrets
2. Set `VITE_API_URL` and `CORS_ORIGIN` after services are deployed
3. Run database migrations

See the detailed steps below for complete setup.

---

## Detailed Deployment Steps

### Step 1: Create Services

You have two options:

#### Option A: Deploy via Dashboard (Easiest)

1. Ensure `render.yaml` is committed and pushed to your Git repository
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Blueprint"
4. Connect your repository and select the branch containing `render.yaml`
5. Render will automatically detect and deploy all services defined in `render.yaml`

#### Option B: Create Services Manually via CLI

See the "Manual Service Creation" section below for step-by-step CLI commands.

After services are created, proceed to the next steps.

### Step 2: Get Service URLs

After deployment, get the service URLs:

**Option 1: Use Dashboard**
- Go to [Render Dashboard](https://dashboard.render.com)
- Click on each service to see its URL

**Option 2: Use CLI (if jq is installed)**
```bash
# List services and extract URLs (format may vary)
render services list --output json | jq -r '.[] | select(.name == "taskflow-api") | .serviceDetails.url'
render services list --output json | jq -r '.[] | select(.name == "taskflow-web") | .serviceDetails.url'
```

**Option 3: Interactive CLI**
```bash
render services
# This opens an interactive menu where you can see service URLs"
```

If `jq` is not installed, you can get URLs from the dashboard or use:
```bash
render services list
```

### Step 3: Configure Environment Variables

#### Set JWT Secrets

**Note:** Environment variables must be set via the Render Dashboard. The CLI doesn't currently support setting environment variables directly.

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on the `taskflow-api` service
3. Go to "Environment" tab
4. Add the following environment variables:

Generate secure JWT secrets first:
```bash
# Generate secrets (run locally)
openssl rand -base64 32  # Use this for JWT_SECRET
openssl rand -base64 32  # Use this for JWT_REFRESH_SECRET
```

Then add in dashboard:
- `JWT_SECRET` = (paste first generated value)
- `JWT_REFRESH_SECRET` = (paste second generated value)

#### Set Frontend Build Variables

The frontend needs `VITE_API_URL` at build time. Since it uses Docker, we need to set it and trigger a rebuild:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on the `taskflow-web` service
3. Go to "Environment" tab
4. Add `VITE_API_URL` = `https://taskflow-api.onrender.com` (replace with your actual backend URL)
5. Add `VITE_APP_NAME` = `TaskFlow`
6. Save changes
7. Trigger a rebuild via dashboard or CLI:
   ```bash
   # Get service ID first
   render services list --output json | jq -r '.[] | select(.name == "taskflow-web") | .id'
   # Then deploy (replace <SERVICE_ID> with actual ID)
   render deploys create <SERVICE_ID>
   ```

#### Set Backend CORS

After the frontend is deployed, set the CORS origin:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on the `taskflow-api` service
3. Go to "Environment" tab
4. Add `CORS_ORIGIN` = `https://taskflow-web.onrender.com` (replace with your actual frontend URL)
5. Save changes
6. Restart the service:
   ```bash
   render restart taskflow-api
   ```

### Step 4: Run Database Migrations

After the backend is deployed and connected to the database:

```bash
# Run migrations via one-off job
render run "cd apps/api && npx prisma migrate deploy" --service taskflow-api
```

**Alternative:** If the above doesn't work, you can SSH into the service:

```bash
# SSH into backend service
render ssh --service taskflow-api

# Inside the container, run:
cd apps/api
npx prisma migrate deploy
exit
```

### Step 5: Verify Deployment

#### Check Service Status

```bash
# List all services (interactive menu)
render services

# List services as JSON (for scripting)
render services list --output json

# List services as text
render services list --output text
```

#### View Logs

```bash
# Backend logs
render logs --service taskflow-api

# Frontend logs
render logs --service taskflow-web

# Follow logs in real-time
render logs --service taskflow-api --follow
```

#### Test Health Endpoints

```bash
# Test backend health
curl https://taskflow-api.onrender.com/api/health

# Test frontend health
curl https://taskflow-web.onrender.com/health
```

#### Test the Application

1. Open your frontend URL in a browser: `https://taskflow-web.onrender.com`
2. Register a new user
3. Create a task
4. Verify tasks persist after refresh

---

## Manual Service Creation (Alternative to render.yaml)

If you prefer to create services manually or need more control:

### 1. Create PostgreSQL Database

```bash
render postgres create \
  --name taskflow-db \
  --plan starter \
  --region oregon
```

**Note:** The database connection string will be automatically available as `DATABASE_URL` when you attach it to a service.

### 2. Create Backend Service

```bash
render services create \
  --type web \
  --name taskflow-api \
  --plan starter \
  --region oregon \
  --repo https://github.com/your-username/todo-list-by-ai \
  --branch main \
  --root-dir apps/api \
  --build-command "npm ci && npm run build" \
  --start-command "node dist/server.js" \
  --health-check-path "/api/health"
```

### 3. Attach Database to Backend

```bash
render postgres attach taskflow-db --service taskflow-api
```

This automatically sets the `DATABASE_URL` environment variable.

### 4. Create Frontend Service

```bash
render services create \
  --type web \
  --name taskflow-web \
  --plan starter \
  --region oregon \
  --repo https://github.com/your-username/todo-list-by-ai \
  --branch main \
  --root-dir apps/web \
  --dockerfile-path ./apps/web/Dockerfile \
  --docker-context ./apps/web
```

---

## Environment Variables Reference

### Backend API (`taskflow-api`)

| Variable | Description | Required | Auto-set |
|----------|-------------|----------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | Yes (when database attached) |
| `JWT_SECRET` | Secret for signing JWT access tokens | Yes | No |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | Yes | No |
| `PORT` | API server port | No | No (defaults to 3001) |
| `NODE_ENV` | Environment | No | No (set in render.yaml) |
| `CORS_ORIGIN` | Allowed origin for CORS | Yes | No |

### Frontend (`taskflow-web`)

| Variable | Description | Required | Auto-set |
|----------|-------------|----------|----------|
| `VITE_API_URL` | Backend API base URL | Yes | No |
| `VITE_APP_NAME` | Application name | No | No (defaults to TaskFlow) |

**Important:** Vite environment variables are embedded at build time, not runtime. You must set `VITE_API_URL` before building and trigger a rebuild after changing it.

---

## Managing Your Deployment

### View All Services

```bash
render services list
```

### View Service Details

```bash
# Interactive menu - select service to view details
render services

# Or list as JSON and filter
render services list --output json | jq '.[] | select(.name == "taskflow-api")'
```

### View Environment Variables

**Note:** Environment variables must be viewed and managed via the Render Dashboard.

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on the service
3. Go to "Environment" tab to view/edit variables

The CLI doesn't currently support viewing or setting environment variables directly.

### View Logs

```bash
# View recent logs
render logs --service taskflow-api

# Follow logs in real-time
render logs --service taskflow-api --follow

# View last N lines
render logs --service taskflow-api --tail 100
```

### Restart Services

```bash
render services restart --service taskflow-api
render services restart --service taskflow-web
```

### Trigger Manual Deploy

```bash
# List services to get service ID
render services

# Deploy latest commit from default branch (interactive - will prompt for service)
render deploys create

# Or deploy specific service by ID
render deploys create <SERVICE_ID>

# Deploy specific commit
render deploys create <SERVICE_ID> --commit abc123

# Wait for deployment to complete
render deploys create <SERVICE_ID> --wait
```

### View Deployment History

```bash
render deploys list --service taskflow-api
```

### Rollback to Previous Deployment

```bash
# List deployments to find the ID
render deploys list --service taskflow-api

# Rollback to specific deployment
render deploys rollback --service taskflow-api --deploy-id <DEPLOY_ID>
```

---

## Database Management

### View Database Info

```bash
# List all services (databases are services too)
render services list --output json | jq '.[] | select(.name == "taskflow-db")'

# Or use interactive menu
render services
```

### Connect to Database

```bash
# Use Render's built-in psql command
render psql taskflow-db

# Or use pgcli for a better experience
render pgcli taskflow-db
```

### View Database Logs

```bash
render logs --service taskflow-db
```

### Backup Database

Render automatically backs up your database. For manual backups:

```bash
# Create a backup (via one-off job)
render run "pg_dump $DATABASE_URL > backup.sql" --service taskflow-api
```

### Restore Database

```bash
# Restore from backup (via one-off job)
render run "psql $DATABASE_URL < backup.sql" --service taskflow-api
```

---

## Troubleshooting

### Service Won't Start

**Symptoms:** Service shows as "stopped" or crashes immediately.

**Solutions:**

1. Check logs:
   ```bash
   render logs --service taskflow-api
   ```

2. Verify all required environment variables are set:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click on `taskflow-api` service
   - Check "Environment" tab

3. Check build logs for errors:
   ```bash
   render deploys list --service taskflow-api
   render deploys get <DEPLOY_ID> --service taskflow-api
   ```

### Database Connection Fails

**Symptoms:** Backend logs show database connection errors.

**Solutions:**

1. Verify database is attached:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click on `taskflow-api` service
   - Check "Environment" tab for `DATABASE_URL`
   - If missing, the database needs to be attached

2. Re-attach database:
   - In the dashboard, go to the database service (`taskflow-db`)
   - Find the "Connections" or "Linked Services" section
   - Link it to `taskflow-api` service
   - Or use the CLI (if supported):
     ```bash
     render services  # Interactive menu to manage connections
     ```

3. Check database status:
   ```bash
   render services get taskflow-db
   ```

### CORS Errors

**Symptoms:** Browser console shows CORS errors when making API requests.

**Solutions:**

1. Verify `CORS_ORIGIN` matches frontend URL exactly:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click on `taskflow-api` service
   - Check "Environment" tab for `CORS_ORIGIN`

2. Update CORS_ORIGIN:
   - In the dashboard, edit `CORS_ORIGIN` to match your frontend URL exactly
   - Save changes
   - Restart the service:
     ```bash
     render restart taskflow-api
     ```

3. Ensure no trailing slashes in URLs.

### Frontend Can't Reach Backend

**Symptoms:** Network errors or 404s when frontend makes API calls.

**Solutions:**

1. Verify `VITE_API_URL` is set correctly:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click on `taskflow-web` service
   - Check "Environment" tab for `VITE_API_URL`

2. Rebuild frontend with correct API URL:
   - In the dashboard, set `VITE_API_URL` to your backend URL
   - Save changes
   - Trigger a new deployment (this rebuilds with the new env var):
     ```bash
     # Get service ID and deploy
     render services list --output json | jq -r '.[] | select(.name == "taskflow-web") | .id'
     render deploys create <SERVICE_ID>
     ```

**Note:** Vite environment variables are embedded at build time. You must rebuild after changing them.

### Database Migrations Fail

**Symptoms:** Migration errors when running `prisma migrate deploy`.

**Solutions:**

1. Check database connection:
   ```bash
   render run "cd apps/api && npx prisma db pull" --service taskflow-api
   ```

2. Verify Prisma schema is up to date locally:
   ```bash
   cd apps/api
   npx prisma migrate dev
   ```

3. Run migrations manually:
   ```bash
   render run "cd apps/api && npx prisma migrate deploy" --service taskflow-api
   ```

### Free Tier Spin-Down

**Symptoms:** First request after inactivity is slow (30-60 seconds).

**Explanation:** Render's free tier services spin down after 15 minutes of inactivity. The first request wakes them up, which takes time.

**Solutions:**

1. Accept the delay (free tier limitation)
2. Upgrade to a paid plan for always-on services
3. Use a service like UptimeRobot to ping your service periodically (keeps it awake)

### Build Failures

**Symptoms:** Deployment fails during build phase.

**Solutions:**

1. Check build logs:
   ```bash
   render deploys list --service taskflow-api
   render deploys get <DEPLOY_ID> --service taskflow-api
   ```

2. Verify build commands in `render.yaml` or service settings
3. Test build locally:
   ```bash
   cd apps/api
   npm ci
   npm run build
   ```

4. Check for missing dependencies or TypeScript errors

### Frontend Docker Build Issues

**Symptoms:** Frontend build fails or Vite environment variables are not available.

**Solutions:**

1. Verify environment variables are set before building:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click on `taskflow-web` service
   - Check "Environment" tab

2. Ensure `VITE_API_URL` is set correctly before triggering a build:
   - In the dashboard, set `VITE_API_URL` to your backend URL
   - Save changes
   - Trigger a new deployment:
     ```bash
     render services list --output json | jq -r '.[] | select(.name == "taskflow-web") | .id'
     render deploys create <SERVICE_ID>
     ```

3. **Note:** The frontend Dockerfile uses `ARG` for build-time variables. Render should make environment variables available during Docker builds, but if issues persist, you may need to rebuild after setting environment variables.

4. Test Docker build locally:
   ```bash
   cd apps/web
   docker build --build-arg VITE_API_URL="https://taskflow-api.onrender.com" --build-arg VITE_APP_NAME="TaskFlow" -t taskflow-web .
   ```

---

## Updating Your Deployment

### Deploy Code Changes

After pushing changes to your Git repository:

```bash
# Render automatically deploys on push (if auto-deploy is enabled)
# Or trigger manual deploy:
render deploys create --service taskflow-api
render deploys create --service taskflow-web
```

### Run New Migrations

After deploying backend changes that include database migrations:

```bash
render run "cd apps/api && npx prisma migrate deploy" --service taskflow-api
```

### Update Environment Variables

**Backend:**
- Go to [Render Dashboard](https://dashboard.render.com)
- Click on `taskflow-api` service
- Edit environment variables in "Environment" tab
- Save changes
- Restart service:
  ```bash
  render restart taskflow-api
  ```

**Frontend:**
- Go to [Render Dashboard](https://dashboard.render.com)
- Click on `taskflow-web` service
- Edit environment variables in "Environment" tab
- **Remember:** Vite vars require rebuild, so after saving, trigger a new deployment:
  ```bash
  render services list --output json | jq -r '.[] | select(.name == "taskflow-web") | .id'
  render deploys create <SERVICE_ID>
  ```

---

## Cost Considerations (Hobby Plan)

### Free Tier Includes

- **Backend Service**: Free (starter plan)
- **Frontend Service**: Free (starter plan)
- **Database**: Free (starter plan, 1GB storage)
- **Bandwidth**: 100 GB/month
- **Build Pipeline**: 500 minutes/month

### Limitations

- Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Limited to 1 project with 2 environments
- Database limited to 1GB storage

### Estimated Monthly Cost

**Within Free Tier:** $0/month

If you exceed free tier limits or need always-on services, upgrade to a paid plan starting at $7/month per service.

---

## Cleanup (If Needed)

### Remove Services

```bash
# Remove frontend
render services delete taskflow-web

# Remove backend
render services delete taskflow-api

# Remove database (WARNING: This deletes all data)
render services delete taskflow-db
```

### Remove All Services

```bash
# List all services
render services list

# Delete each service individually
# (There's no bulk delete command)
```

---

## Automation Script

For one-command deployment, use the provided script:

```bash
./scripts/deploy-render.sh
```

See `scripts/deploy-render.sh` for details.

---

## Next Steps

- Set up custom domains: [Render Custom Domains](https://render.com/docs/custom-domains)
- Configure auto-deploy: Enable in service settings or via CLI
- Set up monitoring: Use Render's built-in metrics and logs
- Review security best practices: [Render Security](https://render.com/docs/security)

---

## References

- [Render Documentation](https://render.com/docs)
- [Render CLI Reference](https://render.com/docs/cli)
- [Render Blueprints (render.yaml)](https://render.com/docs/blueprint-spec)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## Quick Reference Commands

```bash
# Authentication
render login

# Note: render.yaml (blueprints) are deployed via dashboard, not CLI
# Go to https://dashboard.render.com → New + → Blueprint

# Database (if creating manually)
render postgres create --name taskflow-db --plan starter
render postgres attach taskflow-db --service taskflow-api

# Environment Variables (set via Dashboard)
# Go to dashboard → service → Environment tab

# Deployments
render services  # List services, then select to deploy
render deploys create <SERVICE_ID>  # Deploy specific service

# Logs
render logs --service taskflow-api --follow

# Services
render services list
render services  # Interactive menu
render restart taskflow-api

# Migrations
render run "cd apps/api && npx prisma migrate deploy" --service taskflow-api
```
