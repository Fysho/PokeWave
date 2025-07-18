import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ThemeToggle } from './ThemeToggle';
import { FadeIn } from '../ui/transitions';
import { 
  Home, 
  Trophy, 
  History, 
  BarChart3, 
  Settings, 
  Gamepad2,
  Calendar,
  Crown,
  Users
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  battleCount?: number;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  battleCount = 0 
}) => {
  const navigationItems = [
    { id: 'battle', label: 'Battle', icon: Gamepad2, description: 'Predict Pokemon battles' },
    { id: 'history', label: 'History', icon: History, description: 'View your battle history', badge: battleCount },
    { id: 'stats', label: 'Stats', icon: BarChart3, description: 'Detailed analytics' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Crown, description: 'Global rankings' },
    { id: 'daily', label: 'Daily', icon: Calendar, description: 'Daily challenges' },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Gamepad2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PokeWave
                </span>
              </div>
              
              {/* Navigation */}
              <nav className="hidden lg:flex items-center gap-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      variant={activeTab === item.id ? "default" : "ghost"}
                      className="flex items-center space-x-2 relative"
                      size="sm"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden xl:inline">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="lg:hidden border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className="flex items-center space-x-2 relative flex-shrink-0"
                  size="sm"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 relative">
        <FadeIn>
          {children}
        </FadeIn>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/50 backdrop-blur-xl mt-auto">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              © 2024 PokeWave. Powered by Pokemon Showdown & PokeAPI.
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;