# PokeWave

A web-based Pokemon battle prediction game where users guess the outcome of simulated battles between randomly selected Pokemon.

## Project Structure

```
pokewave/
├── frontend/          # React + Vite + TypeScript frontend
├── backend/           # Express + Node.js + TypeScript backend
├── shared/            # Shared types between frontend and backend
└── docker-compose.yml # Docker setup for Redis and PostgreSQL
```

## Tech Stack

### Frontend
- React 18.x with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui component library
- Zustand for state management
- React Router for navigation
- Axios for API calls
- next-themes for dark/light mode

### Backend
- Node.js with Express.js
- TypeScript
- Redis for caching
- PostgreSQL for future data persistence
- Winston for logging
- Pokemon Showdown for battle simulation (to be integrated)

## Getting Started

### Prerequisites
- Node.js 20.x or higher
- Docker and Docker Compose
- Redis (via Docker or installed locally)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Start Redis using Docker:
   ```bash
   docker-compose up -d redis
   ```

5. Run the backend in development mode:
   ```bash
   npm run dev
   ```

The backend will start on http://localhost:3001

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the frontend in development mode:
   ```bash
   npm run dev
   ```

The frontend will start on http://localhost:5173

## API Endpoints

### Pokemon Endpoints
- `GET /api/pokemon/:id` - Get Pokemon by ID
- `GET /api/pokemon/random` - Get random Pokemon IDs

### Battle Endpoints
- `POST /api/battle/simulate` - Simulate a battle between two Pokemon
- `POST /api/battle/guess` - Submit a guess for battle outcome

## Development

### Backend Scripts
- `npm run dev` - Run in development mode with hot reload
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Frontend Scripts
- `npm run dev` - Run in development mode
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Phase 1 Implementation Status

✅ Project structure with separate frontend and backend folders
✅ Backend initialized with Express.js and TypeScript
✅ Frontend initialized with React, Vite, and TypeScript
✅ Tailwind CSS and shadcn/ui configured
✅ Dark/light theme support implemented
✅ Basic routing and layout components created
✅ Redis connection set up in backend
✅ Basic error handling and logging implemented
✅ PokeAPI service with caching implemented

## Next Steps

- Configure ESLint and Prettier for both projects
- Integrate Pokemon Showdown for actual battle simulation
- Implement battle UI components
- Add state management with Zustand
- Create API integration service in frontend