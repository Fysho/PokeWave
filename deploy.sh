#!/bin/bash

# PokeWave Deployment Script
# Usage: ./deploy.sh [command]
#
# Commands:
#   start     - Start all containers (default)
#   stop      - Stop all containers
#   restart   - Restart all containers
#   status    - Show container status
#   logs      - Show logs (follow mode)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables
if [ -f .env.production ]; then
    set -a
    source .env.production
    set +a
else
    echo -e "${RED}✗ .env.production not found${NC}"
    exit 1
fi

# Validate required environment variables
validate_env() {
    if [ -z "$JWT_SECRET" ] || [ -z "$POSTGRES_PASSWORD" ]; then
        echo -e "${RED}✗ Missing required environment variables (JWT_SECRET, POSTGRES_PASSWORD)${NC}"
        exit 1
    fi
}

# Ensure networks exist
ensure_networks() {
    docker network create pokewave_pokewave-network 2>/dev/null || true
    docker network create shared-proxy-network 2>/dev/null || true
}

# Get container name for postgres/redis (handles prefix variations)
get_postgres_container() {
    docker ps -a --format '{{.Names}}' | grep -E 'pokewave.*postgres' | head -1
}

get_redis_container() {
    docker ps -a --format '{{.Names}}' | grep -E 'pokewave.*redis' | head -1
}

start_databases() {
    echo -e "${YELLOW}Starting database services...${NC}"

    POSTGRES=$(get_postgres_container)
    REDIS=$(get_redis_container)

    if [ -n "$POSTGRES" ]; then
        docker start "$POSTGRES" 2>/dev/null || true
    fi

    if [ -n "$REDIS" ]; then
        docker start "$REDIS" 2>/dev/null || true
    fi

    # Wait for databases to be ready
    sleep 3
    echo -e "${GREEN}✓ Database services started${NC}"
}

start_backend() {
    echo -e "${YELLOW}Starting backend...${NC}"

    # Try to start existing container first
    if docker start pokewave-backend 2>/dev/null; then
        echo -e "${GREEN}✓ Backend started (existing container)${NC}"
        return
    fi

    # Get the correct postgres container name for DATABASE_URL
    POSTGRES=$(get_postgres_container)
    POSTGRES_HOST="${POSTGRES:-pokewave-postgres}"

    # Get the correct redis container name
    REDIS=$(get_redis_container)
    REDIS_HOST="${REDIS:-pokewave-redis}"

    docker run -d \
        --name pokewave-backend \
        --network pokewave_pokewave-network \
        --restart unless-stopped \
        -e NODE_ENV=production \
        -e PORT=4000 \
        -e REDIS_HOST="$REDIS_HOST" \
        -e REDIS_PORT=6379 \
        -e DISABLE_REDIS=false \
        -e USE_DATABASE=true \
        -e "DATABASE_URL=postgresql://pokewave:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/pokewave_db" \
        -e "JWT_SECRET=${JWT_SECRET}" \
        -e LOG_LEVEL=info \
        -l "traefik.enable=true" \
        -l "traefik.docker.network=shared-proxy-network" \
        -l "traefik.http.routers.pokewave-api.rule=Host(\`pokewave.fysho.dev\`) && (PathPrefix(\`/api\`) || Path(\`/health\`))" \
        -l "traefik.http.routers.pokewave-api.entrypoints=websecure" \
        -l "traefik.http.routers.pokewave-api.tls=true" \
        -l "traefik.http.routers.pokewave-api.tls.certresolver=letsencrypt" \
        -l "traefik.http.services.pokewave-api.loadbalancer.server.port=4000" \
        -l "traefik.http.routers.pokewave-api.service=pokewave-api" \
        -l "traefik.http.routers.pokewave-api.priority=2" \
        -l "traefik.http.routers.pokewave-ws.rule=Host(\`pokewave.fysho.dev\`) && PathPrefix(\`/ws\`)" \
        -l "traefik.http.routers.pokewave-ws.entrypoints=websecure" \
        -l "traefik.http.routers.pokewave-ws.tls=true" \
        -l "traefik.http.routers.pokewave-ws.tls.certresolver=letsencrypt" \
        -l "traefik.http.routers.pokewave-ws.service=pokewave-api" \
        -l "traefik.http.routers.pokewave-ws.priority=3" \
        pokewave-backend \
        sh -c "npx prisma migrate deploy && node dist/app.js"

    docker network connect shared-proxy-network pokewave-backend 2>/dev/null || true
    echo -e "${GREEN}✓ Backend started (new container)${NC}"
}

start_frontend() {
    echo -e "${YELLOW}Starting frontend...${NC}"

    # Try to start existing container first
    if docker start pokewave-frontend 2>/dev/null; then
        echo -e "${GREEN}✓ Frontend started (existing container)${NC}"
        return
    fi

    docker run -d \
        --name pokewave-frontend \
        --network pokewave_pokewave-network \
        --restart unless-stopped \
        -l "traefik.enable=true" \
        -l "traefik.docker.network=shared-proxy-network" \
        -l "traefik.http.routers.pokewave.rule=Host(\`pokewave.fysho.dev\`)" \
        -l "traefik.http.routers.pokewave.entrypoints=websecure" \
        -l "traefik.http.routers.pokewave.tls=true" \
        -l "traefik.http.routers.pokewave.tls.certresolver=letsencrypt" \
        -l "traefik.http.services.pokewave.loadbalancer.server.port=80" \
        -l "traefik.http.routers.pokewave.service=pokewave" \
        -l "traefik.http.routers.pokewave.priority=1" \
        pokewave-frontend

    docker network connect shared-proxy-network pokewave-frontend 2>/dev/null || true
    echo -e "${GREEN}✓ Frontend started (new container)${NC}"
}

start() {
    validate_env
    ensure_networks
    start_databases
    start_backend
    start_frontend

    echo ""
    echo -e "${GREEN}✓ PokeWave started!${NC}"
    echo -e "  Frontend: https://pokewave.fysho.dev"
    echo -e "  API: https://pokewave.fysho.dev/api"
    echo ""
    status
}

stop() {
    echo -e "${YELLOW}Stopping PokeWave...${NC}"
    docker stop pokewave-frontend pokewave-backend 2>/dev/null || true
    echo -e "${GREEN}✓ Stopped${NC}"
}

restart() {
    echo -e "${YELLOW}Restarting PokeWave...${NC}"
    docker restart pokewave-frontend pokewave-backend 2>/dev/null || true
    echo -e "${GREEN}✓ Restarted${NC}"
    status
}

status() {
    echo -e "${YELLOW}Container Status:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(pokewave|NAMES)" || echo "No PokeWave containers running"
}

logs() {
    docker logs -f pokewave-backend pokewave-frontend 2>&1
}

# Parse command
COMMAND=${1:-start}

case $COMMAND in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    *)
        echo "Usage: ./deploy.sh [start|stop|restart|status|logs]"
        exit 1
        ;;
esac
