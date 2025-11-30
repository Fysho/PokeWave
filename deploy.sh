#!/bin/bash

# PokeWave Deployment Script
# Usage: ./deploy.sh [command]
#
# Commands:
#   deploy    - Pull latest code and deploy (default)
#   start     - Start containers without rebuilding
#   stop      - Stop all containers
#   restart   - Restart all containers
#   logs      - Show logs (follow mode)
#   status    - Show container status
#   rebuild   - Force rebuild and deploy

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

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

# Ensure shared-proxy-network exists
ensure_network() {
    if ! docker network ls | grep -q "shared-proxy-network"; then
        echo -e "${YELLOW}Creating shared-proxy-network...${NC}"
        docker network create shared-proxy-network
        echo -e "${GREEN}✓ Network created${NC}"
    fi
}

# Commands
deploy() {
    echo -e "${YELLOW}Pulling latest code...${NC}"
    git pull

    ensure_network

    echo -e "${YELLOW}Building and starting containers...${NC}"
    docker compose -f docker-compose.prod.yml up -d --build

    echo -e "${GREEN}✓ Deployment complete!${NC}"
    echo -e "Frontend: https://pokewave.fysho.dev"
    echo -e "API: https://pokewave.fysho.dev/api"

    status
}

start() {
    ensure_network
    echo -e "${YELLOW}Starting containers...${NC}"
    docker compose -f docker-compose.prod.yml up -d
    echo -e "${GREEN}✓ Started${NC}"
    status
}

stop() {
    echo -e "${YELLOW}Stopping containers...${NC}"
    docker compose -f docker-compose.prod.yml down
    echo -e "${GREEN}✓ Stopped${NC}"
}

restart() {
    echo -e "${YELLOW}Restarting containers...${NC}"
    docker compose -f docker-compose.prod.yml restart
    echo -e "${GREEN}✓ Restarted${NC}"
    status
}

logs() {
    docker compose -f docker-compose.prod.yml logs -f
}

status() {
    echo ""
    echo -e "${YELLOW}Container Status:${NC}"
    docker compose -f docker-compose.prod.yml ps
}

rebuild() {
    echo -e "${YELLOW}Forcing rebuild...${NC}"
    ensure_network
    docker compose -f docker-compose.prod.yml up -d --build --force-recreate
    echo -e "${GREEN}✓ Rebuild complete${NC}"
    status
}

# Parse command
COMMAND=${1:-deploy}

case $COMMAND in
    deploy)
        deploy
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    rebuild)
        rebuild
        ;;
    *)
        echo "Usage: ./deploy.sh [deploy|start|stop|restart|logs|status|rebuild]"
        exit 1
        ;;
esac