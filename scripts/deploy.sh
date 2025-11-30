#!/bin/bash

# PokeWave Deployment Script

set -e

echo "🚀 Deploying PokeWave..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "❌ Error: .env.production file not found!"
    echo "Please copy .env.production.example and configure it."
    exit 1
fi

# Validate required variables
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-very-long-random-jwt-secret-change-this-in-production" ]; then
    echo "❌ Error: JWT_SECRET must be changed from default value!"
    exit 1
fi

if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "change-this-strong-password" ]; then
    echo "❌ Error: POSTGRES_PASSWORD must be changed from default value!"
    exit 1
fi

# Build and start services
echo "📦 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "🔄 Starting services..."
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

echo "🚀 Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Deployment complete!"
echo ""
echo "📌 Next steps:"
echo "1. Make sure DNS is configured: pokewave.fysho.dev → $(curl -s ifconfig.me)"
echo "2. If this is first deployment, run: ./scripts/init-ssl.sh your-email@example.com"
echo "3. Access your app at: https://pokewave.fysho.dev"
echo ""
echo "🔍 View logs: docker-compose -f docker-compose.prod.yml logs -f"