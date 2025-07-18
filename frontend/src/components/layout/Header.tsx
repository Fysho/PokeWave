import { Link } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PokeWave
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/">
                <Button variant="ghost">Classic</Button>
              </Link>
              <Link to="/daily">
                <Button variant="ghost">Daily</Button>
              </Link>
              <Link to="/survival">
                <Button variant="ghost">Survival</Button>
              </Link>
              <Link to="/leaderboard">
                <Button variant="ghost">Leaderboard</Button>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}