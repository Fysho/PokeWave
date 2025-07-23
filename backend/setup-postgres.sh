#!/bin/bash

echo "Setting up PostgreSQL for PokeWave..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "PostgreSQL is not running. Starting it..."
    brew services start postgresql
    sleep 3
fi

echo "Creating database and user..."

# Create user and database
psql postgres << EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'pokewave') THEN
        CREATE USER pokewave WITH PASSWORD 'pokewave_password';
    END IF;
END\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE pokewave_db OWNER pokewave'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pokewave_db')\gexec

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE pokewave_db TO pokewave;
EOF

echo "Database setup complete!"
echo ""
echo "Now run these commands to set up the schema:"
echo "  cd backend"
echo "  npx prisma migrate dev --name init"
echo "  npm run dev"