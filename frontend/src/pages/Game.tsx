import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function Game() {
  const [gameStarted, setGameStarted] = useState(false)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Classic Mode</h1>
        <p className="text-muted-foreground text-lg">
          Guess the win rate between two randomly selected Pokemon!
        </p>
      </div>

      {!gameStarted ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-lg mb-6">
            Two Pokemon will battle 1000 times. Can you predict who will win more?
          </p>
          <Button size="lg" onClick={() => setGameStarted(true)}>
            Start Game
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-muted-foreground">Battle simulation coming soon...</p>
        </div>
      )}
    </div>
  )
}