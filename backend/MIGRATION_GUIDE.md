# Database Migration Guide

This guide explains how to migrate from in-memory storage to PostgreSQL database storage.

## Overview

PokeWave backend now supports two storage modes:
1. **In-Memory Storage** (default) - Data is lost when server restarts
2. **PostgreSQL Database** - Data persists across server restarts

## Quick Start

### 1. Install Docker Desktop
Download and install Docker Desktop from https://www.docker.com/products/docker-desktop/

### 2. Start PostgreSQL
```bash
docker compose up -d postgres
```

### 3. Run Database Migrations
```bash
cd backend
npm install
npx prisma migrate dev --name init
```

### 4. Enable Database Mode
Update your `.env` file:
```env
USE_DATABASE=true
DATABASE_URL=postgresql://pokewave:pokewave_password@localhost:5432/pokewave_db
```

### 5. Restart the Backend
```bash
npm run dev
```

## Storage Mode Comparison

| Feature | In-Memory | PostgreSQL |
|---------|-----------|------------|
| Data Persistence | ❌ Lost on restart | ✅ Persists |
| Performance | ⚡ Fastest | 🚀 Fast |
| Setup Required | ❌ None | ✅ Docker + Migrations |
| Resource Usage | 💾 Low | 💾 Moderate |
| Production Ready | ❌ Development only | ✅ Yes |

## Switching Between Modes

### To Use In-Memory Storage
Set in `.env`:
```env
USE_DATABASE=false
```

### To Use PostgreSQL
Set in `.env`:
```env
USE_DATABASE=true
DATABASE_URL=postgresql://pokewave:pokewave_password@localhost:5432/pokewave_db
```

## Data Migration

Currently, there's no automatic data migration from in-memory to database storage. When switching to database mode:
- All users will need to register again
- All scores and progress will start fresh
- Pokemon encounters and battles continue to work normally

## Troubleshooting

### Database Connection Failed
1. Check if Docker is running: `docker ps`
2. Check if PostgreSQL container is up: `docker compose ps`
3. Verify DATABASE_URL in `.env` file
4. Check logs: `docker compose logs postgres`

### Migrations Failed
1. Ensure database is running
2. Check DATABASE_URL is correct
3. Try resetting: `npx prisma migrate reset` (WARNING: deletes all data)

### Performance Issues
1. Check database connection pool settings
2. Monitor with: `npx prisma studio`
3. View query logs in development mode

## Development Tips

### View Database Contents
```bash
npx prisma studio
```
Opens web UI at http://localhost:5555

### Reset Database
```bash
npx prisma migrate reset
```
WARNING: This deletes all data!

### Generate New Migration
```bash
npx prisma migrate dev --name your_migration_name
```

## Production Deployment

For production, consider:
1. Use a managed PostgreSQL service (AWS RDS, Heroku Postgres, etc.)
2. Set strong passwords
3. Enable SSL connections
4. Regular backups
5. Connection pooling for scalability