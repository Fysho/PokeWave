# Database Setup Instructions

## Prerequisites

### 1. Install Docker Desktop
- **macOS**: Download from https://www.docker.com/products/docker-desktop/
- Install and start Docker Desktop

### 2. Verify Docker Installation
```bash
docker --version
docker compose version
```

## Database Setup

### 1. Start PostgreSQL
From the project root directory:
```bash
docker compose up -d postgres
```

This will:
- Download PostgreSQL image
- Create a container named `pokewave-postgres`
- Create a database named `pokewave_db`
- Set up user `pokewave` with password `pokewave_password`
- Expose PostgreSQL on port 5432

### 2. (Optional) Start pgAdmin
```bash
docker compose up -d pgadmin
```

Access pgAdmin at http://localhost:5050
- Email: `admin@pokewave.com`
- Password: `admin`

### 3. Run Database Migrations
From the backend directory:
```bash
cd backend
npx prisma migrate dev --name init
```

This will:
- Create all database tables
- Set up indexes and relations
- Generate Prisma Client

### 4. Verify Database
```bash
npx prisma studio
```

This opens a web UI to browse your database at http://localhost:5555

## Common Commands

### Start all services (Redis + PostgreSQL + pgAdmin)
```bash
docker compose up -d
```

### Stop all services
```bash
docker compose down
```

### Reset database (delete all data)
```bash
docker compose down -v
docker compose up -d postgres
cd backend && npx prisma migrate dev
```

### View logs
```bash
docker compose logs -f postgres
```

## Connection Details
- Host: `localhost`
- Port: `5432`
- Database: `pokewave_db`
- User: `pokewave`
- Password: `pokewave_password`

## Troubleshooting

### Port 5432 already in use
Another PostgreSQL instance might be running. Either:
1. Stop the other instance
2. Change the port in docker-compose.yml (e.g., `5433:5432`)

### Cannot connect to database
1. Check if container is running: `docker ps`
2. Check logs: `docker compose logs postgres`
3. Ensure .env file has correct DATABASE_URL

### Migration fails
1. Ensure database is running
2. Check DATABASE_URL in .env
3. Try: `npx prisma migrate reset` (WARNING: deletes all data)