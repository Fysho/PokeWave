#!/bin/bash

echo "Starting PokeWave project..."

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Start the production environment
echo "Starting production services with Docker Compose..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 5

# Check if services are running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ PokeWave services started successfully!"
    echo ""
    echo "Access the application at:"
    echo "  - Frontend: https://localhost (or your domain)"
    echo "  - Backend API: https://localhost/api"
    echo ""
    echo "To view logs, run: docker-compose -f docker-compose.prod.yml logs -f"
else
    echo "❌ Failed to start services. Check the logs with:"
    echo "docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi