#!/bin/bash

# Render Deployment Script for TaskFlow
# This script automates the deployment of TaskFlow to Render.com
# Usage: ./scripts/deploy-render.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_SERVICE="taskflow-api"
FRONTEND_SERVICE="taskflow-web"
DATABASE_SERVICE="taskflow-db"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

# Step 1: Validate Prerequisites
log_info "Validating prerequisites..."

check_command "render"
check_command "openssl"

if [ ! -f "$PROJECT_ROOT/render.yaml" ]; then
    log_error "render.yaml not found in project root"
    exit 1
fi

log_info "Prerequisites validated ✓"

# Step 2: Check Authentication
log_info "Checking Render CLI authentication..."

if ! render whoami &> /dev/null; then
    log_warn "Not authenticated. Please log in..."
    render login
    if [ $? -ne 0 ]; then
        log_error "Authentication failed"
        exit 1
    fi
fi

log_info "Authenticated ✓"

# Step 3: Deploy Infrastructure from render.yaml
log_info "Deploying infrastructure from render.yaml..."

cd "$PROJECT_ROOT"

# Check if services already exist
if render services get "$BACKEND_SERVICE" &> /dev/null; then
    log_warn "Services already exist. Updating existing services..."
    render deploy --update
else
    log_info "Creating new services..."
    render deploy
fi

if [ $? -ne 0 ]; then
    log_error "Deployment failed"
    exit 1
fi

log_info "Infrastructure deployed ✓"

# Step 4: Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 10

# Step 5: Get Service URLs
log_info "Retrieving service URLs..."

# Try to get URLs (may fail if services aren't fully ready)
BACKEND_URL=""
FRONTEND_URL=""

if command -v jq &> /dev/null; then
    BACKEND_URL=$(render services get "$BACKEND_SERVICE" --format json 2>/dev/null | jq -r '.service.serviceDetails.url // empty')
    FRONTEND_URL=$(render services get "$FRONTEND_SERVICE" --format json 2>/dev/null | jq -r '.service.serviceDetails.url // empty')
fi

if [ -z "$BACKEND_URL" ] || [ "$BACKEND_URL" == "null" ]; then
    log_warn "Could not automatically get backend URL. Please set it manually:"
    log_warn "  render services get $BACKEND_SERVICE"
    read -p "Enter backend URL (e.g., https://taskflow-api.onrender.com): " BACKEND_URL
fi

if [ -z "$FRONTEND_URL" ] || [ "$FRONTEND_URL" == "null" ]; then
    log_warn "Could not automatically get frontend URL. Please set it manually:"
    log_warn "  render services get $FRONTEND_SERVICE"
    read -p "Enter frontend URL (e.g., https://taskflow-web.onrender.com): " FRONTEND_URL
fi

log_info "Backend URL: $BACKEND_URL"
log_info "Frontend URL: $FRONTEND_URL"

# Step 6: Set JWT Secrets
log_info "Setting JWT secrets..."

# Check if secrets already exist
if render env list --service "$BACKEND_SERVICE" 2>/dev/null | grep -q "JWT_SECRET"; then
    log_warn "JWT_SECRET already exists. Skipping..."
else
    JWT_SECRET=$(openssl rand -base64 32)
    render env set JWT_SECRET="$JWT_SECRET" --service "$BACKEND_SERVICE"
    log_info "JWT_SECRET set ✓"
fi

if render env list --service "$BACKEND_SERVICE" 2>/dev/null | grep -q "JWT_REFRESH_SECRET"; then
    log_warn "JWT_REFRESH_SECRET already exists. Skipping..."
else
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    render env set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" --service "$BACKEND_SERVICE"
    log_info "JWT_REFRESH_SECRET set ✓"
fi

# Step 7: Set Frontend Build Variables
log_info "Setting frontend build variables..."

# Set VITE_API_URL
render env set VITE_API_URL="$BACKEND_URL" --service "$FRONTEND_SERVICE" 2>/dev/null || true
log_info "VITE_API_URL set to $BACKEND_URL"

# Set VITE_APP_NAME if not already set
if ! render env list --service "$FRONTEND_SERVICE" 2>/dev/null | grep -q "VITE_APP_NAME"; then
    render env set VITE_APP_NAME="TaskFlow" --service "$FRONTEND_SERVICE"
    log_info "VITE_APP_NAME set ✓"
fi

# Trigger frontend rebuild with new env vars
log_info "Triggering frontend rebuild with new environment variables..."
render deploys create --service "$FRONTEND_SERVICE" --wait || log_warn "Frontend rebuild may still be in progress"

# Step 8: Set Backend CORS
log_info "Setting backend CORS origin..."

render env set CORS_ORIGIN="$FRONTEND_URL" --service "$BACKEND_SERVICE" 2>/dev/null || true
log_info "CORS_ORIGIN set to $FRONTEND_URL"

# Restart backend to apply CORS change
log_info "Restarting backend to apply CORS changes..."
render services restart --service "$BACKEND_SERVICE" || log_warn "Backend restart may still be in progress"

# Step 9: Run Database Migrations
log_info "Running database migrations..."

# Wait a bit for backend to be ready
sleep 5

# Try to run migrations
if render run "cd apps/api && npx prisma migrate deploy" --service "$BACKEND_SERVICE" 2>/dev/null; then
    log_info "Database migrations completed ✓"
else
    log_warn "Migration command failed. You may need to run migrations manually:"
    log_warn "  render run \"cd apps/api && npx prisma migrate deploy\" --service $BACKEND_SERVICE"
    log_warn "  Or SSH into the service:"
    log_warn "  render ssh --service $BACKEND_SERVICE"
fi

# Step 10: Verify Deployment
log_info "Verifying deployment..."

# Wait for services to be fully ready
sleep 10

# Check service status
log_info "Service status:"
render services list | grep -E "($BACKEND_SERVICE|$FRONTEND_SERVICE|$DATABASE_SERVICE)" || true

# Test health endpoints
log_info "Testing health endpoints..."

if curl -f -s "$BACKEND_URL/api/health" > /dev/null 2>&1; then
    log_info "Backend health check passed ✓"
else
    log_warn "Backend health check failed. Service may still be starting..."
fi

if curl -f -s "$FRONTEND_URL/health" > /dev/null 2>&1; then
    log_info "Frontend health check passed ✓"
else
    log_warn "Frontend health check failed. Service may still be starting..."
fi

# Summary
echo ""
log_info "=========================================="
log_info "Deployment Summary"
log_info "=========================================="
log_info "Backend URL:  $BACKEND_URL"
log_info "Frontend URL: $FRONTEND_URL"
log_info ""
log_info "Next steps:"
log_info "1. Wait a few minutes for services to fully start"
log_info "2. Visit $FRONTEND_URL to test the application"
log_info "3. Check logs if needed:"
log_info "   render logs --service $BACKEND_SERVICE"
log_info "   render logs --service $FRONTEND_SERVICE"
log_info ""
log_info "If migrations failed, run manually:"
log_info "   render run \"cd apps/api && npx prisma migrate deploy\" --service $BACKEND_SERVICE"
log_info "=========================================="
