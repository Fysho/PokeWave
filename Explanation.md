# How PokeWave Works: A Beginner's Guide

## What is PokeWave?

Imagine you're watching two Pokemon about to battle. Before they fight, you try to predict who will win and by how much. That's PokeWave! It's a web game where you predict the outcome of Pokemon battles, and the computer tells you if you're right.

## The Big Picture

PokeWave is like a restaurant with two main parts:

1. **The Kitchen (Backend)** - Where all the "cooking" happens
   - Runs Pokemon battle simulations
   - Calculates who wins and loses
   - Keeps track of scores
   - Serves data to the frontend

2. **The Dining Room (Frontend)** - Where customers interact
   - Shows you the Pokemon cards
   - Lets you make predictions with a slider
   - Displays your score and streak
   - Makes everything look pretty

These two parts talk to each other like a waiter taking orders to the kitchen and bringing food back.

## How Does It Work? A Step-by-Step Journey

### Step 1: Starting the Game

When you open PokeWave in your browser:

1. Your browser (the frontend) loads the React application
2. The app immediately asks the backend: "Give me two random Pokemon to battle!"
3. The backend picks two Pokemon (like Pikachu vs Charizard)

### Step 2: Behind the Battle Simulation

Here's where it gets interesting! The backend doesn't just flip a coin. It:

1. **Gets Pokemon Data**: 
   - Stats (HP, Attack, Defense, etc.) from Pokemon Showdown
   - Pictures (sprites) from PokeAPI
   - Moves they can learn based on their level

2. **Runs 17 Simulated Battles**:
   ```
   Battle 1: Pikachu uses Thunderbolt! Charizard fainted. Pikachu wins!
   Battle 2: Charizard uses Flamethrower! Pikachu fainted. Charizard wins!
   ... (15 more battles)
   ```

3. **Calculates Win Rate**:
   - If Pikachu won 7/17 battles = 41% win rate
   - If Charizard won 10/17 battles = 59% win rate

### Step 3: Making Your Prediction

The frontend shows you:
- Two Pokemon cards with their pictures and types
- A slider from 0% to 100%

You move the slider to predict the first Pokemon's win percentage. If you think Pikachu will win 40% of the time, you slide to 40%.

### Step 4: Checking Your Answer

When you submit:
1. Frontend sends your guess to the backend
2. Backend compares your guess (40%) to the actual result (41%)
3. If you're within 10% (between 31% and 51%), you're correct!
4. You earn points based on how close you were

### Step 5: Keeping Score

The game tracks:
- **Points**: You earn 20+ points for correct guesses
- **Streak**: How many correct guesses in a row
- **Accuracy**: What percentage of your guesses are correct
- **Total Battles**: How many games you've played

## The Technical Details (Simplified)

### The Backend (Node.js + Express)

Think of the backend as a smart assistant that:

1. **Listens for Requests** (like a phone operator):
   ```javascript
   // When someone asks for a battle simulation
   app.post('/api/battle/simulate', (request, response) => {
     // Run the simulation
     // Send back results
   });
   ```

2. **Uses Pokemon Showdown** (like a referee):
   - This is a library that knows all Pokemon rules
   - It simulates real battles with moves, types, and damage calculations

3. **Caches Results** (like taking notes):
   - If someone asks for the same battle again, it remembers the answer
   - This makes the game faster!

### The Frontend (React)

Think of the frontend as an artist that:

1. **Draws the Interface**:
   ```javascript
   function PokemonCard({ pokemon }) {
     return (
       <div>
         <img src={pokemon.sprite} />
         <h2>{pokemon.name}</h2>
         <p>Type: {pokemon.type}</p>
       </div>
     );
   }
   ```

2. **Manages Game State** (like keeping score on paper):
   - Uses Zustand (a state management library)
   - Remembers your score even if you refresh the page

3. **Talks to the Backend** (like making phone calls):
   ```javascript
   async function simulateBattle(pokemon1Id, pokemon2Id) {
     const response = await fetch('/api/battle/simulate', {
       method: 'POST',
       body: JSON.stringify({ pokemon1Id, pokemon2Id })
     });
     return response.json();
   }
   ```

## Key Concepts for CS Students

### 1. Client-Server Architecture
- **Client (Frontend)**: What users see and interact with
- **Server (Backend)**: Where the logic and data processing happens
- They communicate through HTTP requests (like sending letters)

### 2. APIs (Application Programming Interfaces)
APIs are like menus at a restaurant:
- The frontend knows what it can order (endpoints)
- Each item has a specific format (request structure)
- The kitchen (backend) knows how to make each item

Example API endpoint:
```
POST /api/battle/simulate
{
  "pokemon1Id": 25,  // Pikachu
  "pokemon2Id": 6    // Charizard
}
```

### 3. State Management
State is like the game's memory:
- Current Pokemon being shown
- Your score and streak
- Whether you're waiting for results

React components update when state changes, like a scoreboard updating after each play.

### 4. Asynchronous Programming
Some operations take time (like battle simulations). The app doesn't freeze while waiting:

```javascript
// This happens without blocking the UI
async function getBattleResult() {
  setLoading(true);  // Show spinner
  const result = await simulateBattle();  // Wait for result
  setLoading(false); // Hide spinner
  showResult(result);
}
```

### 5. Caching
Instead of recalculating the same battle every time:
- First request: Calculate and save result
- Future requests: Return saved result
- Like solving a math problem once and remembering the answer

### 6. Data Flow
```
User clicks "Submit Guess"
    “
Frontend validates input
    “
Frontend sends HTTP request to backend
    “
Backend receives request
    “
Backend checks if battle is in cache
    “ (if not in cache)
Backend simulates 17 battles
    “
Backend calculates win rate
    “
Backend sends response
    “
Frontend receives response
    “
Frontend updates UI with results
```

## Why This Architecture?

### Separation of Concerns
- Frontend focuses on user experience
- Backend focuses on game logic
- Each part can be updated independently

### Scalability
- Multiple users can play at once
- Backend can run on powerful servers
- Frontend runs on each user's device

### Maintainability
- Code is organized into logical pieces
- Easy to find and fix bugs
- New features can be added without breaking existing ones

## Common Patterns You'll See

### 1. Request-Response Pattern
```
Frontend: "Hey backend, simulate Pikachu vs Charizard"
Backend: "Sure, here are the results: {...}"
```

### 2. Component-Based UI
Each piece of the UI is a separate component:
- PokemonCard component
- ScoreDisplay component  
- PredictionSlider component

### 3. Service Layer Pattern
Backend organizes code into services:
- BattleService: Handles battle logic
- PokemonService: Gets Pokemon data
- CacheService: Manages cached data

## Summary

PokeWave is a great example of a modern web application:
- **Frontend** makes things pretty and interactive
- **Backend** does the heavy lifting and calculations
- **APIs** let them talk to each other
- **State management** keeps track of the game
- **Caching** makes everything faster

The beauty is that each part has one job and does it well. The frontend doesn't need to know how battles work, and the backend doesn't need to know how to draw Pokemon cards. They just need to know how to talk to each other!

## Learning More

To understand PokeWave deeper, explore:
1. How HTTP requests work
2. Basic React components and hooks
3. Express.js routing
4. JSON data format
5. Promises and async/await in JavaScript

Remember: Every expert was once a beginner. Take it one piece at a time, and soon you'll be building your own full-stack applications!