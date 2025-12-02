#!/bin/bash

# PokeWave Update Script
# Pulls latest code, rebuilds containers, and restarts services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}Updating PokeWave...${NC}"

# Load environment variables
if [ -f .env.production ]; then
    set -a
    source .env.production
    set +a
    echo -e "${GREEN}✓ Loaded .env.production${NC}"
else
    echo -e "${RED}✗ .env.production not found${NC}"
    exit 1
fi

# Pull latest changes
echo -e "${YELLOW}Pulling latest changes...${NC}"
git pull origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to pull latest changes${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Code updated${NC}"

# Rebuild frontend
echo -e "${YELLOW}Rebuilding frontend...${NC}"
docker stop pokewave-frontend 2>/dev/null || true
docker rm pokewave-frontend 2>/dev/null || true
docker build --no-cache -t pokewave-frontend -f frontend/Dockerfile .
echo -e "${GREEN}✓ Frontend rebuilt${NC}"

# Rebuild backend
echo -e "${YELLOW}Rebuilding backend...${NC}"
docker stop pokewave-backend 2>/dev/null || true
docker rm pokewave-backend 2>/dev/null || true
docker build --no-cache -t pokewave-backend -f backend/Dockerfile .
echo -e "${GREEN}✓ Backend rebuilt${NC}"

# Start services using deploy.sh
echo -e "${YELLOW}Starting services...${NC}"
./deploy.sh start

# Clean up old images
echo -e "${YELLOW}Cleaning up old images...${NC}"
docker image prune -f

echo ""
echo -e "${GREEN}✓ PokeWave updated successfully!${NC}"
echo -e "  Frontend: https://pokewave.fysho.dev"
echo -e "  API: https://pokewave.fysho.dev/api"
