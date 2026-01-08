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

# Step 3: Check if services exist
log_info "Checking if services already exist..."

cd "$PROJECT_ROOT"

# Check if services exist (this will fail if they don't exist, which is fine)
SERVICES_EXIST=false
if render services list --output json 2>/dev/null | grep -q "$BACKEND_SERVICE\|$FRONTEND_SERVICE\|$DATABASE_SERVICE"; then
    SERVICES_EXIST=true
    log_info "Services found ✓"
else
    log_warn "Services not found. You need to create them first."
    log_warn ""
    log_warn "Option 1: Deploy via Dashboard (Recommended):"
    log_warn "  1. Go to https://dashboard.render.com"
    log_warn "  2. Click 'New +' → 'Blueprint'"
    log_warn "  3. Connect your repository"
    log_warn "  4. Render will detect render.yaml and create all services"
    log_warn ""
    log_warn "Option 2: Create services manually via CLI (see docs/deployment-render.md)"
    log_warn ""
    read -p "Have you created the services? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Please create services first, then run this script again"
        exit 1
    fi
fi

# Step 4: Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 10

# Step 5: Get Service URLs
log_info "Retrieving service URLs..."

# Try to get URLs (may fail if services aren't fully ready)
BACKEND_URL=""
FRONTEND_URL=""

# Get service URLs from services list
if command -v jq &> /dev/null; then
    # Try to get service info - note: exact command may vary
    BACKEND_INFO=$(render services list --output json 2>/dev/null | jq -r ".[] | select(.name == \"$BACKEND_SERVICE\") | .url // empty" | head -1)
    FRONTEND_INFO=$(render services list --output json 2>/dev/null | jq -r ".[] | select(.name == \"$FRONTEND_SERVICE\") | .url // empty" | head -1)
    
    if [ -n "$BACKEND_INFO" ] && [ "$BACKEND_INFO" != "null" ]; then
        BACKEND_URL="$BACKEND_INFO"
    fi
    if [ -n "$FRONTEND_INFO" ] && [ "$FRONTEND_INFO" != "null" ]; then
        FRONTEND_URL="$FRONTEND_INFO"
    fi
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

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

log_warn "Render CLI doesn't support setting environment variables directly."
log_warn "Please set the following environment variables in the Render Dashboard:"
log_warn ""
log_warn "1. Go to https://dashboard.render.com"
log_warn "2. Click on '$BACKEND_SERVICE' service"
log_warn "3. Go to 'Environment' tab"
log_warn "4. Add these variables:"
log_warn "   JWT_SECRET=$JWT_SECRET"
log_warn "   JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
log_warn ""
read -p "Press Enter after you've set the environment variables..."

# Step 7: Set Frontend Build Variables
log_info "Setting frontend build variables..."

log_warn "Please set frontend environment variables in the Render Dashboard:"
log_warn ""
log_warn "1. Go to https://dashboard.render.com"
log_warn "2. Click on '$FRONTEND_SERVICE' service"
log_warn "3. Go to 'Environment' tab"
log_warn "4. Add these variables:"
log_warn "   VITE_API_URL=$BACKEND_URL"
log_warn "   VITE_APP_NAME=TaskFlow"
log_warn "5. Save changes"
log_warn ""
read -p "Press Enter after you've set the environment variables..."

# Trigger frontend rebuild with new env vars
log_info "Triggering frontend rebuild..."
FRONTEND_SERVICE_ID=$(render services list --output json 2>/dev/null | jq -r ".[] | select(.name == \"$FRONTEND_SERVICE\") | .id" | head -1)
if [ -n "$FRONTEND_SERVICE_ID" ] && [ "$FRONTEND_SERVICE_ID" != "null" ]; then
    render deploys create "$FRONTEND_SERVICE_ID" --wait || log_warn "Frontend rebuild may still be in progress"
else
    log_warn "Could not get frontend service ID. Please trigger deployment manually via dashboard."
fi

# Step 8: Set Backend CORS
log_info "Setting backend CORS origin..."

log_warn "Please set CORS_ORIGIN in the Render Dashboard:"
log_warn ""
log_warn "1. Go to https://dashboard.render.com"
log_warn "2. Click on '$BACKEND_SERVICE' service"
log_warn "3. Go to 'Environment' tab"
log_warn "4. Add/update: CORS_ORIGIN=$FRONTEND_URL"
log_warn "5. Save changes"
log_warn ""
read -p "Press Enter after you've set CORS_ORIGIN..."

# Restart backend to apply CORS change
log_info "Restarting backend to apply CORS changes..."
render restart "$BACKEND_SERVICE" || log_warn "Backend restart may still be in progress"

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
