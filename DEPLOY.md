# PokeWave Deployment Guide

## Local Development

Run frontend and backend in separate terminals:

```bash
# Terminal 1 - Backend (Port 4000)
cd backend
npm install
npm run dev

# Terminal 2 - Frontend (Port 4001)
cd frontend
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:4001 |
| Backend | http://localhost:4000 |

No Docker required for local development. Data is stored in memory and resets on restart.

---

## Server Deployment

### Prerequisites

Your server needs:
- Docker & Docker Compose
- Git
- Traefik running with `shared-proxy-network`

### First-Time Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url> /opt/pokewave
   cd /opt/pokewave
   git checkout LiveServer
   ```

2. **Verify `.env.production` exists** (should already be in repo):
   ```bash
   cat .env.production
   ```

   It should contain:
   ```
   POSTGRES_PASSWORD=<your-password>
   JWT_SECRET=<your-secret>
   DOMAIN=pokewave.fysho.dev
   LETSENCRYPT_EMAIL=<your-email>
   ```

3. **Make deploy script executable:**
   ```bash
   chmod +x deploy.sh
   ```

4. **Deploy:**
   ```bash
   ./deploy.sh
   ```

### Deploy Script Commands

| Command | Description |
|---------|-------------|
| `./deploy.sh` | Pull latest code and deploy (default) |
| `./deploy.sh deploy` | Same as above |
| `./deploy.sh start` | Start containers without rebuilding |
| `./deploy.sh stop` | Stop all containers |
| `./deploy.sh restart` | Restart all containers |
| `./deploy.sh rebuild` | Force rebuild and deploy |
| `./deploy.sh logs` | View logs (follow mode) |
| `./deploy.sh status` | Show container status |

### Updating the App

After pushing changes to the `LiveServer` branch:

```bash
cd /opt/pokewave
./deploy.sh
```

This pulls the latest code, rebuilds containers, and restarts everything.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Traefik                              │
│                    (shared-proxy-network)                    │
│         pokewave.fysho.dev → routes to containers            │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   pokewave-frontend     │     │   pokewave-backend      │
│   (Nginx on port 80)    │     │   (Node.js on 4000)     │
│                         │     │                         │
│   /api/* → backend      │     │   /api/* endpoints      │
│   /* → React SPA        │     │   /health check         │
└─────────────────────────┘     └─────────────────────────┘
                                          │
                        ┌─────────────────┴─────────────────┐
                        │                                   │
                        ▼                                   ▼
              ┌─────────────────┐               ┌─────────────────┐
              │ pokewave-redis  │               │ pokewave-postgres│
              │ (Cache)         │               │ (Database)       │
              └─────────────────┘               └─────────────────┘
```

### Containers

| Container | Purpose | Internal Port |
|-----------|---------|---------------|
| `pokewave-frontend` | Nginx serving React build | 80 |
| `pokewave-backend` | Node.js API server | 4000 |
| `pokewave-redis` | Battle result caching | 6379 |
| `pokewave-postgres` | User data, scores, leaderboards | 5432 |

### Networks

| Network | Purpose |
|---------|---------|
| `shared-proxy-network` | Connects to Traefik (external) |
| `pokewave-network` | Internal communication between containers |

---

## Troubleshooting

### Check container logs
```bash
./deploy.sh logs

# Or specific container
docker logs pokewave-backend -f
docker logs pokewave-frontend -f
```

### Container won't start
```bash
# Check status
./deploy.sh status

# Force rebuild
./deploy.sh rebuild
```

### Database issues
```bash
# Access postgres
docker exec -it pokewave-postgres psql -U pokewave -d pokewave_db

# Reset database (WARNING: deletes all data)
./deploy.sh stop
docker volume rm pokewave_postgres_data
./deploy.sh deploy
```

### Network issues
```bash
# Verify shared-proxy-network exists
docker network ls | grep shared-proxy

# Create if missing
docker network create shared-proxy-network
```

### Health check
```bash
curl https://pokewave.fysho.dev/health
# Should return: {"status":"OK","timestamp":"..."}
```

---

## Ports Reference

| Service | Local Dev | Production |
|---------|-----------|------------|
| Frontend | http://localhost:4001 | https://pokewave.fysho.dev |
| Backend | http://localhost:4000 | https://pokewave.fysho.dev/api |
| Redis | localhost:6379 | Internal only |
| Postgres | localhost:5432 | Internal only |
