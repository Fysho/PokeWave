# Quick Steps to Start Using PostgreSQL

## Step 1: Start PostgreSQL

Open a terminal in the PokeWave root directory and run:

```bash
docker-compose up -d postgres
```

Wait a few seconds for PostgreSQL to start.

## Step 2: Create Database Schema

In the backend directory, run:

```bash
cd backend

# Create the initial migration and apply it
npx prisma migrate dev --name init
```

This will:
- Create the database tables
- Generate TypeScript types
- Set up the schema

## Step 3: Verify It's Working

The backend is already configured to use PostgreSQL (I've set `USE_DATABASE=true` in your .env file).

Just restart your backend server:

```bash
npm run dev
```

You should see a message saying "Using database-backed user service" in the logs.

## Step 4: Check Your Data (Optional)

To view your database data:

```bash
npx prisma studio
```

This opens a web interface at http://localhost:5555 where you can see all your tables and data.

## That's it!

Your application is now using PostgreSQL for persistent storage. All user accounts, pokedex data, game stats, and leaderboards will be saved in the database.