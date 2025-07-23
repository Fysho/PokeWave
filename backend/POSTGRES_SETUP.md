# PostgreSQL Setup Guide for PokeWave

## Quick Start

### 1. Start PostgreSQL with Docker

If you have Docker installed, run this from the project root:

```bash
# Start PostgreSQL (and optionally Redis and pgAdmin)
docker-compose up -d postgres

# Or start all services
docker-compose up -d
```

### 2. Verify PostgreSQL is Running

```bash
# Check if the container is running
docker ps | grep pokewave-postgres

# Test the connection
docker exec -it pokewave-postgres psql -U pokewave -d pokewave_db -c "SELECT 1;"
```

### 3. Run Database Migrations

From the backend directory:

```bash
cd backend

# Generate Prisma client (if not already done)
npx prisma generate

# Run migrations to create the database schema
npx prisma migrate deploy

# Or if you want to create a new migration
npx prisma migrate dev --name init
```

### 4. Verify Database Setup

```bash
# Check the database schema
npx prisma studio
# This will open a web interface at http://localhost:5555
```

## Environment Variables

The `.env` file in the backend directory should have:

```env
# Enable database usage
USE_DATABASE=true

# PostgreSQL connection string
DATABASE_URL=postgresql://pokewave:pokewave_password@localhost:5432/pokewave_db
```

## Alternative: Using a Local PostgreSQL Installation

If you have PostgreSQL installed locally:

1. Create the database and user:
```sql
CREATE USER pokewave WITH PASSWORD 'pokewave_password';
CREATE DATABASE pokewave_db OWNER pokewave;
```

2. Update the DATABASE_URL in .env if needed

3. Run the migrations as shown above

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running on port 5432
- Check if the database credentials match your .env file
- Verify the database name exists

### Migration Errors
- Make sure the database is empty for initial migration
- Check Prisma schema syntax with `npx prisma validate`

### Docker Issues
- Ensure Docker Desktop is running
- Check port 5432 isn't already in use: `lsof -i :5432`
- Remove old containers: `docker-compose down -v` (warning: deletes data)

## Managing Data

### View Data
- Use pgAdmin at http://localhost:5050 (if started with docker-compose)
  - Email: admin@pokewave.com
  - Password: admin
- Or use Prisma Studio: `npx prisma studio`

### Reset Database
```bash
# Drop all tables and re-run migrations
npx prisma migrate reset

# Or with Docker, remove the volume
docker-compose down -v
docker-compose up -d postgres
```