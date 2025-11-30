#!/bin/bash

echo "Stopping PokeWave project..."

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop the production environment
echo "Stopping production services..."
docker-compose -f docker-compose.prod.yml down

# Check if services have stopped
if docker-compose -f docker-compose.prod.yml ps 2>/dev/null | grep -q "Up"; then
    echo "⚠️  Some services may still be running. Forcing stop..."
    docker-compose -f docker-compose.prod.yml down --remove-orphans
fi

echo "✅ PokeWave services stopped successfully!"

# Optional: Ask if user wants to remove volumes
read -p "Do you want to remove data volumes? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Removing volumes..."
    docker-compose -f docker-compose.prod.yml down -v
    echo "✅ Volumes removed."
fi