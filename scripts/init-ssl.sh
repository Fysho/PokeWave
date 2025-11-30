#!/bin/bash

# Initialize SSL certificates with Let's Encrypt

set -e

if [ -z "$1" ]; then
    echo "Usage: ./init-ssl.sh your-email@example.com"
    exit 1
fi

EMAIL=$1
DOMAIN="pokewave.fysho.dev"

echo "Initializing SSL certificates for $DOMAIN..."

# Create necessary directories
mkdir -p ./certbot/www
mkdir -p ./certbot/conf
mkdir -p ./nginx/ssl

# Start nginx with initial configuration
echo "Starting nginx with initial configuration..."
mv ./nginx/conf.d/pokewave.conf ./nginx/conf.d/pokewave.conf.bak 2>/dev/null || true
docker-compose -f docker-compose.prod.yml up -d nginx

# Wait for nginx to start
sleep 5

# Request certificate
echo "Requesting certificate from Let's Encrypt..."
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Restore full configuration
echo "Restoring full nginx configuration..."
mv ./nginx/conf.d/pokewave.conf.bak ./nginx/conf.d/pokewave.conf 2>/dev/null || true
rm -f ./nginx/conf.d/pokewave-init.conf

# Restart nginx with SSL
echo "Restarting nginx with SSL configuration..."
docker-compose -f docker-compose.prod.yml restart nginx

echo "SSL initialization complete!"