#!/bin/bash

echo "Updating PokeWave project..."

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed. Please install git first."
    exit 1
fi

# Pull latest changes from git
echo "Pulling latest changes from repository..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Failed to pull latest changes. Please check your git configuration."
    exit 1
fi

# Rebuild Docker images
echo "Rebuilding Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

if [ $? -ne 0 ]; then
    echo "❌ Failed to rebuild Docker images."
    exit 1
fi

# Stop current services
echo "Stopping current services..."
docker-compose -f docker-compose.prod.yml down

# Start updated services
echo "Starting updated services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 5

# Check if services are running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ PokeWave updated and restarted successfully!"
    echo ""
    echo "Updated services are now running at:"
    echo "  - Frontend: https://localhost (or your domain)"
    echo "  - Backend API: https://localhost/api"
    
    # Clean up old images
    echo ""
    echo "Cleaning up old Docker images..."
    docker image prune -f
    
else
    echo "❌ Failed to start updated services. Check the logs with:"
    echo "docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi