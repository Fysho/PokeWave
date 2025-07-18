Technical Questions:

1. Battle Simulation Engine:
   - Do you want to use the actual Pokemon Showdown engine (which is in JavaScript/TypeScript) or create your own simplified battle simulator?
   A: pokemon showdown
   - If using Pokemon Showdown, should it run server-side or client-side?
   A: Server Side
2. Pokemon Data Source:
   - Where will the Pokemon data come from? PokeAPI, local JSON files, or a custom database?
   A: PokeAPI seems like the logical choice 
   - Do you want to cache this data locally?
   A: No i dont think so, when simulating a battle 1000 times though we want to not request pokemon information 1000 times, just once
3. Backend Architecture:
   - Do you need user accounts from the start, or should we build a stateless version first?
   A: start stateless first, user accounts will come at the end
   - For features like leaderboards and daily mode, what's your preference for data storage?
    A: you decide
4. Frontend Framework:
   - The example uses React. Would you prefer React, Vue, or another framework?
   A: React
   - Do you have a preference for UI libraries (Material UI, Tailwind, etc.)?
   A: you decide
5. Deployment Target:
   - Where do you plan to host this? (Vercel, AWS, self-hosted, etc.)
   A: probably aws
   - Do you need it to scale for many users or start small?
    A: start small, scale later
Feature Prioritization Questions:

1. MVP Features - Which features should be in the initial release?
   - Basic battle simulation (2 random Pokemon, 1000 battles)
   - User guessing interface
   - Score display
   - Pokemon sprites/stats display
   A: all necesary eventually, but start with battle simulation and user guessing interface
2. Phase 2 Features - What's the priority order for these?
   - Random levels
   - Generation selection
   - Items
   - Moveset options (realistic vs random)
   - AI difficulty settings
   - Survival mode
   - Daily mode
   - Leaderboards
   A: this order is the priority order
3. Game Mechanics:
   - How should scoring work? (Points based on accuracy? Percentage difference?)
   A: for now, just percentage difference, the lower the score the better, e.g. 10% off is 10 points, 0% off is 0 points, a perfect score
   - What defines "acceptable margin of error" in survival mode?
   A: a percentage, you need to be within 10% of real result to continue 
   - Should daily mode have the same 10 battles for all users globally?
   A: yes
4. Visual/UX Preferences:
   - Any specific design inspiration or style preferences?
   A: Just modern UI
   - Should it be mobile-responsive from the start?
   A: not from the start, ideal it will be
   - Dark/light mode support?
   A: yes light / dark mode is essential