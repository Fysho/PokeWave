#!/bin/bash

# PokeWave Update Script

set -e

echo "🔄 Updating PokeWave..."

# Pull latest changes
echo "📥 Pulling latest code..."
git pull

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "❌ Error: .env.production file not found!"
    exit 1
fi

# Rebuild images
echo "📦 Rebuilding Docker images..."
docker-compose -f docker-compose.prod.yml build

# Run migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# Restart services with zero downtime
echo "🔄 Restarting services..."
docker-compose -f docker-compose.prod.yml up -d --no-deps backend
docker-compose -f docker-compose.prod.yml up -d --no-deps frontend
docker-compose -f docker-compose.prod.yml up -d --no-deps nginx

echo "✅ Update complete!"
echo "🔍 View logs: docker-compose -f docker-compose.prod.yml logs -f"