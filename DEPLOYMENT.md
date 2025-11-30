# PokeWave Deployment Guide

This guide will help you deploy PokeWave to your VPS at pokewave.fysho.dev.

## Prerequisites

- Docker and Docker Compose installed on your VPS
- DNS A record pointing `pokewave.fysho.dev` to your VPS IP address
- Ports 80 and 443 available

## Initial Setup

1. **Configure environment variables:**
   ```bash
   cp .env.production.example .env.production
   nano .env.production
   ```
   
   Update these values:
   - `POSTGRES_PASSWORD`: Set a strong password for PostgreSQL
   - `JWT_SECRET`: Set a long, random secret for JWT tokens
   - `LETSENCRYPT_EMAIL`: Your email for SSL certificate notifications

2. **Configure DNS:**
   Add an A record in your DNS settings:
   ```
   Type: A
   Name: pokewave
   Value: [Your VPS IP Address]
   TTL: 300
   ```

3. **Deploy the application:**
   ```bash
   ./scripts/deploy.sh
   ```

4. **Initialize SSL certificates:**
   ```bash
   ./scripts/init-ssl.sh your-email@example.com
   ```

## Managing the Application

### View logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### View specific service logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Stop all services:
```bash
docker-compose -f docker-compose.prod.yml down
```

### Update to latest version:
```bash
./scripts/update.sh
```

### Access PostgreSQL:
```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U pokewave -d pokewave_db
```

### Access Redis CLI:
```bash
docker-compose -f docker-compose.prod.yml exec redis redis-cli
```

## Troubleshooting

### SSL Certificate Issues
If SSL certificates fail to generate:
1. Ensure DNS is properly configured and propagated
2. Check nginx logs: `docker-compose -f docker-compose.prod.yml logs nginx`
3. Manually test certificate generation:
   ```bash
   docker-compose -f docker-compose.prod.yml run --rm certbot certonly --webroot --webroot-path=/var/www/certbot --dry-run -d pokewave.fysho.dev
   ```

### Database Connection Issues
1. Check if PostgreSQL is running: `docker-compose -f docker-compose.prod.yml ps postgres`
2. Check PostgreSQL logs: `docker-compose -f docker-compose.prod.yml logs postgres`
3. Verify DATABASE_URL in backend service

### Port Conflicts
If you get port binding errors:
1. Check what's using the ports: `sudo lsof -i :80` and `sudo lsof -i :443`
2. Stop conflicting services or update the port mappings in docker-compose.prod.yml

## Backup

### Database backup:
```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U pokewave pokewave_db > backup.sql
```

### Restore database:
```bash
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U pokewave pokewave_db < backup.sql
```

## Monitoring

Monitor container resource usage:
```bash
docker stats
```

Check disk usage:
```bash
docker system df
```

Clean up unused resources:
```bash
docker system prune -a
```