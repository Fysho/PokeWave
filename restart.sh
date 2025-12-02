#!/bin/bash

# PokeWave Restart Script
# Restarts all PokeWave services (frontend, backend, redis, postgres)

set -e

cd /opt/apps/PokeWave

echo "🔄 Restarting PokeWave services..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "❌ Error: .env.production file not found!"
    exit 1
fi

# Restart all services
echo "🛑 Stopping services..."
docker stop pokewave-frontend pokewave-backend pokewave-redis pokewave-postgres 2>/dev/null || true

echo "🚀 Starting services..."
docker start pokewave-postgres pokewave-redis 2>/dev/null || true

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

docker start pokewave-backend 2>/dev/null || true

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

docker start pokewave-frontend 2>/dev/null || true

echo "✅ All services restarted!"
echo ""
echo "🔍 Check status: docker ps | grep pokewave"
echo "📋 View logs: docker logs -f pokewave-backend"
