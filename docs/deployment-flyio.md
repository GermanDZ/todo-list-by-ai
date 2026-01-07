# Fly.io Deployment Guide

> Step-by-step instructions for deploying TaskFlow to Fly.io with executable CLI commands.

This guide covers deploying both the backend API and frontend web application to Fly.io, along with setting up a PostgreSQL database.

---

## Prerequisites

### 1. Install Fly.io CLI

**macOS (using Homebrew):**
```bash
brew install flyctl
```

**Linux/macOS (using install script):**
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows (using PowerShell):**
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**Verify installation:**
```bash
flyctl version
```

### 2. Create Fly.io Account

If you don't have a Fly.io account:

```bash
flyctl auth signup
```

Or sign up via web browser:
```bash
flyctl auth signup --web
```

### 3. Login to Fly.io

```bash
flyctl auth login
```

This will open a browser window for authentication. After successful login, you're ready to deploy.

---

## Database Setup

### 1. Create PostgreSQL Database

Create a PostgreSQL database on Fly.io:

```bash
flyctl postgres create --name taskflow-db --region ord --vm-size shared-cpu-1x --volume-size 3
```

**Parameters:**
- `--name taskflow-db`: Name of your database app
- `--region ord`: Region (Chicago). Choose a region close to your users. See available regions with `flyctl platform regions`
- `--vm-size shared-cpu-1x`: VM size (free tier compatible)
- `--volume-size 3`: Storage size in GB (minimum 3GB for free tier)

**Note:** The free tier includes 3GB of volume storage. For production, consider upgrading.

### 2. Get Database Connection String

After creation, Fly.io will display the connection string. Save it for later use. You can also retrieve it:

```bash
flyctl postgres connect -a taskflow-db
```

Or get the connection string directly:

```bash
flyctl postgres connect -a taskflow-db --command "echo \$DATABASE_URL"
```

The connection string format is:
```
postgres://<user>:<password>@<host>:<port>/<database>?sslmode=require
```

**Important:** Save this connection string securely. You'll need it for the backend deployment.

---

## Backend Deployment

### 1. Navigate to API Directory

```bash
cd apps/api
```

### 2. Initialize Fly.io App for Backend

```bash
flyctl launch --name taskflow-api --region ord --no-deploy
```

**Parameters:**
- `--name taskflow-api`: Name of your backend app (must be globally unique)
- `--region ord`: Region (should match database region for lower latency)
- `--no-deploy`: Don't deploy yet, just create the configuration

This creates a `fly.toml` file. We'll customize it in the next step.

### 3. Attach Database to Backend App

Attach the PostgreSQL database to your backend app:

```bash
flyctl postgres attach taskflow-db --app taskflow-api
```

This automatically sets the `DATABASE_URL` secret for your backend app.

### 4. Set Environment Variables

Set the required secrets for the backend:

```bash
# Generate secure JWT secrets (run these commands to generate random secrets)
openssl rand -base64 32  # Use output for JWT_SECRET
openssl rand -base64 32  # Use output for JWT_REFRESH_SECRET

# Set secrets on Fly.io
flyctl secrets set JWT_SECRET="<your-generated-secret>" --app taskflow-api
flyctl secrets set JWT_REFRESH_SECRET="<your-generated-secret>" --app taskflow-api
flyctl secrets set NODE_ENV="production" --app taskflow-api
flyctl secrets set PORT="3001" --app taskflow-api
```

**Note:** The `DATABASE_URL` is automatically set when you attach the database. The `CORS_ORIGIN` will be set after we deploy the frontend and know its URL.

### 5. Deploy Backend

```bash
flyctl deploy --app taskflow-api
```

This will:
1. Build the Docker image using `apps/api/Dockerfile`
2. Push the image to Fly.io
3. Deploy the application

### 6. Run Database Migrations

After the backend is deployed, run Prisma migrations:

```bash
flyctl ssh console --app taskflow-api
```

Once inside the container, run:

```bash
cd /app
npx prisma migrate deploy
```

Exit the container:

```bash
exit
```

**Alternative:** You can run migrations directly without entering the console:

```bash
flyctl ssh console --app taskflow-api -C "cd /app && npx prisma migrate deploy"
```

### 7. Verify Backend Deployment

Check the backend status:

```bash
flyctl status --app taskflow-api
```

Get the backend URL:

```bash
flyctl info --app taskflow-api
```

Test the health endpoint:

```bash
curl https://taskflow-api.fly.dev/api/health
```

You should see:
```json
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

---

## Frontend Deployment

### 1. Navigate to Web Directory

```bash
cd ../../apps/web
```

### 2. Initialize Fly.io App for Frontend

```bash
flyctl launch --name taskflow-web --region ord --no-deploy
```

**Parameters:**
- `--name taskflow-web`: Name of your frontend app (must be globally unique)
- `--region ord`: Region (should match backend region)
- `--no-deploy`: Don't deploy yet

### 3. Get Backend URL

Before deploying the frontend, get your backend URL:

```bash
flyctl info --app taskflow-api | grep "Hostname"
```

Or construct it manually: `https://taskflow-api.fly.dev`

### 4. Get Backend URL

Get your backend URL (if you haven't already):

```bash
flyctl info --app taskflow-api | grep "Hostname"
```

Or construct it manually: `https://taskflow-api.fly.dev`

### 5. Deploy Frontend with Build Arguments

Deploy the frontend with build arguments for Vite environment variables:

```bash
flyctl deploy --app taskflow-web \
  --build-arg VITE_API_URL="https://taskflow-api.fly.dev" \
  --build-arg VITE_APP_NAME="TaskFlow"
```

**Important:** Vite environment variables must be passed as build arguments during the Docker build, as they're embedded at build time (not runtime).

This will:
1. Build the Docker image using `apps/web/Dockerfile`
2. Pass the build arguments to the Docker build
3. Build the Vite application with the environment variables embedded
4. Push and deploy the application

### 6. Get Frontend URL

```bash
flyctl info --app taskflow-web
```

Your frontend will be available at: `https://taskflow-web.fly.dev`

### 7. Update Backend CORS

Now that we know the frontend URL, update the backend CORS_ORIGIN:

```bash
flyctl secrets set CORS_ORIGIN="https://taskflow-web.fly.dev" --app taskflow-api
```

Restart the backend to apply the change:

```bash
flyctl apps restart taskflow-api
```

---

## Post-Deployment Verification

### 1. Check Application Status

**Backend:**
```bash
flyctl status --app taskflow-api
```

**Frontend:**
```bash
flyctl status --app taskflow-web
```

**Database:**
```bash
flyctl status --app taskflow-db
```

### 2. View Application Logs

**Backend logs:**
```bash
flyctl logs --app taskflow-api
```

**Frontend logs:**
```bash
flyctl logs --app taskflow-web
```

### 3. Test the Application

1. Open your frontend URL in a browser: `https://taskflow-web.fly.dev`
2. Try registering a new user
3. Create a task
4. Verify tasks persist after refresh

### 4. Test API Endpoints

```bash
# Health check
curl https://taskflow-api.fly.dev/api/health

# Register a user
curl -X POST https://taskflow-api.fly.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'
```

---

## Managing Your Deployment

### View All Apps

```bash
flyctl apps list
```

### View App Information

```bash
flyctl info --app taskflow-api
flyctl info --app taskflow-web
```

### View Secrets (names only, not values)

```bash
flyctl secrets list --app taskflow-api
flyctl secrets list --app taskflow-web
```

### Update Secrets

```bash
flyctl secrets set KEY="value" --app taskflow-api
```

### Scale Applications

**Scale backend:**
```bash
flyctl scale count 2 --app taskflow-api  # Run 2 instances
```

**Scale memory:**
```bash
flyctl scale vm shared-cpu-2x --app taskflow-api
```

### View Metrics

```bash
flyctl metrics --app taskflow-api
```

### SSH into Container

```bash
flyctl ssh console --app taskflow-api
```

---

## Troubleshooting

### Problem: Backend can't connect to database

**Symptoms:** Database connection errors in logs.

**Solutions:**

1. Verify database is attached:
   ```bash
   flyctl postgres list
   flyctl postgres connect -a taskflow-db
   ```

2. Check DATABASE_URL secret:
   ```bash
   flyctl secrets list --app taskflow-api
   ```

3. Re-attach database:
   ```bash
   flyctl postgres attach taskflow-db --app taskflow-api
   ```

### Problem: CORS errors in browser

**Symptoms:** Browser console shows CORS errors.

**Solutions:**

1. Verify CORS_ORIGIN matches frontend URL:
   ```bash
   flyctl secrets list --app taskflow-api
   ```

2. Update CORS_ORIGIN:
   ```bash
   flyctl secrets set CORS_ORIGIN="https://taskflow-web.fly.dev" --app taskflow-api
   flyctl apps restart taskflow-api
   ```

3. Check backend logs for CORS-related errors:
   ```bash
   flyctl logs --app taskflow-api
   ```

### Problem: Frontend can't reach backend API

**Symptoms:** Network errors or 404s when making API calls.

**Solutions:**

1. Check that VITE_API_URL matches backend URL:
   ```bash
   flyctl info --app taskflow-api
   ```

2. Rebuild frontend with correct API URL using build arguments:
   ```bash
   flyctl deploy --app taskflow-web \
     --build-arg VITE_API_URL="https://taskflow-api.fly.dev" \
     --build-arg VITE_APP_NAME="TaskFlow"
   ```

**Note:** Vite environment variables are embedded at build time (not runtime), so you must pass them as build arguments during `flyctl deploy` and redeploy after changing them.

### Problem: Database migrations fail

**Symptoms:** Migration errors when running `prisma migrate deploy`.

**Solutions:**

1. Check database connection:
   ```bash
   flyctl ssh console --app taskflow-api
   cd /app
   npx prisma db pull  # Test connection
   ```

2. Verify Prisma schema is up to date:
   ```bash
   # In local development
   cd apps/api
   npx prisma migrate dev
   ```

3. Run migrations manually:
   ```bash
   flyctl ssh console --app taskflow-api
   cd /app
   npx prisma migrate deploy
   ```

### Problem: Application crashes on startup

**Symptoms:** App shows as "stopped" or crashes immediately.

**Solutions:**

1. Check logs:
   ```bash
   flyctl logs --app taskflow-api
   ```

2. Verify all required secrets are set:
   ```bash
   flyctl secrets list --app taskflow-api
   ```

3. Test locally with production environment variables:
   ```bash
   cd apps/api
   DATABASE_URL="..." JWT_SECRET="..." npm start
   ```

### Problem: Out of memory errors

**Symptoms:** App crashes with OOM (Out of Memory) errors.

**Solutions:**

1. Scale up memory:
   ```bash
   flyctl scale vm shared-cpu-2x --app taskflow-api
   ```

2. Or use a dedicated CPU:
   ```bash
   flyctl scale vm dedicated-cpu-1x --app taskflow-api
   ```

### Viewing Detailed Logs

```bash
# Follow logs in real-time
flyctl logs --app taskflow-api

# View last 100 lines
flyctl logs --app taskflow-api -n 100

# Filter logs
flyctl logs --app taskflow-api | grep "error"
```

### Checking Database Status

```bash
# Database app status
flyctl status --app taskflow-db

# Connect to database
flyctl postgres connect -a taskflow-db

# View database metrics
flyctl metrics --app taskflow-db
```

---

## Updating Your Deployment

### Deploy Code Changes

**Backend:**
```bash
cd apps/api
flyctl deploy --app taskflow-api
```

**Frontend:**
```bash
cd apps/web
flyctl deploy --app taskflow-web \
  --build-arg VITE_API_URL="https://taskflow-api.fly.dev" \
  --build-arg VITE_APP_NAME="TaskFlow"
```

### Run New Migrations

After deploying backend changes that include database migrations:

```bash
flyctl ssh console --app taskflow-api -C "cd /app && npx prisma migrate deploy"
```

### Update Environment Variables

**Backend:**
```bash
flyctl secrets set KEY="new-value" --app taskflow-api
flyctl apps restart taskflow-api
```

**Frontend:**
```bash
# Vite env vars must be passed as build args during deploy
flyctl deploy --app taskflow-web \
  --build-arg VITE_API_URL="https://taskflow-api.fly.dev" \
  --build-arg VITE_APP_NAME="TaskFlow"
```

---

## Cost Considerations

### Free Tier Limits

Fly.io free tier includes:
- 3 shared-cpu VMs
- 3GB persistent volumes
- 160GB outbound data transfer per month

### Estimated Costs

For a small production deployment:
- **Backend:** 1 shared-cpu-1x VM (~$1.94/month)
- **Frontend:** 1 shared-cpu-1x VM (~$1.94/month)
- **Database:** 1 shared-cpu-1x VM + 3GB volume (~$1.94/month + $0.15/month)
- **Total:** ~$6/month

**Note:** Prices may vary. Check [Fly.io pricing](https://fly.io/docs/about/pricing/) for current rates.

---

## Cleanup (If Needed)

### Remove Applications

```bash
# Remove frontend
flyctl apps destroy taskflow-web

# Remove backend
flyctl apps destroy taskflow-api

# Remove database (WARNING: This deletes all data)
flyctl apps destroy taskflow-db
```

---

## Next Steps

- Set up custom domains: [Fly.io Custom Domains](https://fly.io/docs/app-guides/custom-domains-with-fly/)
- Configure CI/CD: [Fly.io GitHub Actions](https://fly.io/docs/app-guides/continuous-deployment-with-github-actions/)
- Set up monitoring: [Fly.io Monitoring](https://fly.io/docs/app-guides/monitoring/)
- Review security best practices: [Fly.io Security](https://fly.io/docs/app-guides/security/)

---

## References

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io CLI Reference](https://fly.io/docs/flyctl/)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## Quick Reference Commands

```bash
# Authentication
flyctl auth login

# Database
flyctl postgres create --name taskflow-db --region ord
flyctl postgres attach taskflow-db --app taskflow-api

# Backend
cd apps/api
flyctl launch --name taskflow-api --region ord --no-deploy
flyctl secrets set JWT_SECRET="..." --app taskflow-api
flyctl deploy --app taskflow-api
flyctl ssh console --app taskflow-api -C "cd /app && npx prisma migrate deploy"

# Frontend
cd apps/web
flyctl launch --name taskflow-web --region ord --no-deploy
flyctl deploy --app taskflow-web \
  --build-arg VITE_API_URL="https://taskflow-api.fly.dev" \
  --build-arg VITE_APP_NAME="TaskFlow"

# Update CORS
flyctl secrets set CORS_ORIGIN="https://taskflow-web.fly.dev" --app taskflow-api
flyctl apps restart taskflow-api

# Monitoring
flyctl status --app taskflow-api
flyctl logs --app taskflow-api
flyctl metrics --app taskflow-api
```

