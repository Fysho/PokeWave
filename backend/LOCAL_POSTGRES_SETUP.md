# Local PostgreSQL Setup (Without Docker)

Since you have PostgreSQL installed via Homebrew, here's how to set it up:

## Step 1: Start PostgreSQL Service

```bash
# Start PostgreSQL
brew services start postgresql

# Verify it's running
brew services list | grep postgresql
```

## Step 2: Create Database and User

```bash
# Connect to PostgreSQL as your system user
psql postgres

# In the psql prompt, run these commands:
CREATE USER pokewave WITH PASSWORD 'pokewave_password';
CREATE DATABASE pokewave_db OWNER pokewave;
\q
```

## Step 3: Test the Connection

```bash
# Test connecting with the new user
psql -U pokewave -d pokewave_db -h localhost -c "SELECT 1;"
```

If this asks for a password, enter: `pokewave_password`

## Step 4: Update DATABASE_URL if Needed

If the connection test fails, you might need to update the DATABASE_URL in your `.env` file:

```env
# Try with your system username if 'pokewave' user creation failed
DATABASE_URL=postgresql://YOUR_USERNAME:@localhost:5432/pokewave_db

# Or with the pokewave user
DATABASE_URL=postgresql://pokewave:pokewave_password@localhost:5432/pokewave_db
```

## Step 5: Run Prisma Migrations

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name init
```

## Step 6: Start Your Backend

```bash
npm run dev
```

You should see "Database services initialized successfully" in the logs.

## Troubleshooting

### Permission Denied
If you get permission errors, try:
```bash
# Create database with your system user
psql postgres -c "CREATE DATABASE pokewave_db;"

# Update .env to use your system user
DATABASE_URL=postgresql://$(whoami):@localhost:5432/pokewave_db
```

### Port Already in Use
Check if PostgreSQL is running on a different port:
```bash
# Find PostgreSQL port
ps aux | grep postgres | grep -- -p
```

### Connection Refused
Make sure PostgreSQL is actually running:
```bash
brew services restart postgresql
```

## Managing Your Database

### View Data
```bash
# Use Prisma Studio (recommended)
npx prisma studio

# Or use psql
psql -U pokewave -d pokewave_db
```

### Reset Database
```bash
# Drop and recreate all tables
npx prisma migrate reset
```