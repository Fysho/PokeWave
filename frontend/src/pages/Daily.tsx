import { BATTLE_CONFIG } from '../shared/config/battle.config';

export function Daily() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Daily Challenge</h1>
        <p className="text-muted-foreground text-lg">
          Complete today's {BATTLE_CONFIG.TOTAL_BATTLES} battles and compete on the daily leaderboard!
        </p>
      </div>
      
      <div className="bg-card rounded-lg p-8 text-center">
        <p className="text-muted-foreground">
          Daily challenge mode coming soon...
        </p>
      </div>
    </div>
  )
}