# Docker Installation Guide for macOS

## Option 1: Install Docker Desktop (Recommended)

Docker Desktop includes Docker Engine, Docker CLI, Docker Compose, and a nice GUI.

### Steps:

1. **Download Docker Desktop**
   - Visit: https://www.docker.com/products/docker-desktop/
   - Click "Download for Mac"
   - Choose the right version for your Mac:
     - **Apple Silicon** (M1/M2/M3) → Docker Desktop for Mac with Apple silicon
     - **Intel** → Docker Desktop for Mac with Intel chip

2. **Install Docker Desktop**
   - Open the downloaded `.dmg` file
   - Drag Docker icon to Applications folder
   - Launch Docker from Applications
   - Follow the setup wizard

3. **Verify Installation**
   ```bash
   docker --version
   docker compose version
   ```

## Option 2: Install via Homebrew

If you prefer command-line installation:

```bash
# Install Docker Desktop via Homebrew
brew install --cask docker

# Launch Docker Desktop
open /Applications/Docker.app
```

## Post-Installation Setup

1. **Start Docker Desktop**
   - Docker Desktop must be running for docker commands to work
   - You'll see a whale icon in your menu bar when it's running

2. **Test Docker**
   ```bash
   # Test Docker is working
   docker run hello-world
   
   # Test Docker Compose
   docker compose version
   ```

3. **Configure Resources** (Optional)
   - Open Docker Desktop preferences
   - Go to Resources → Advanced
   - Adjust CPU, Memory, and Disk as needed

## For PokeWave Project

Once Docker is installed and running:

```bash
# Navigate to PokeWave directory
cd ~/Documents/Projects/PokeWave

# Start PostgreSQL and Redis
docker compose up -d

# Verify containers are running
docker ps

# You should see:
# - pokewave-postgres
# - pokewave-redis
# - pokewave-pgadmin (optional)
```

## Troubleshooting

### "Cannot connect to Docker daemon"
- Make sure Docker Desktop is running (whale icon in menu bar)
- Try: `open /Applications/Docker.app`

### Permission issues
- Docker Desktop handles permissions automatically
- No need for `sudo` with Docker Desktop

### Port conflicts
- If ports 5432 (PostgreSQL) or 6379 (Redis) are in use:
  - Stop local PostgreSQL: `brew services stop postgresql`
  - Stop local Redis: `brew services stop redis`

## Note: You Already Have PostgreSQL Working!

Since you already have PostgreSQL running locally and configured, you don't necessarily need Docker. Your current setup is working fine!

Docker would give you:
- Easier management of multiple services
- Consistent environment across machines
- Easy cleanup (just remove containers)

But your current local PostgreSQL setup is perfectly valid for development!