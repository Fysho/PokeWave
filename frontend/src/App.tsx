import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { ThemeManager } from './components/theme-manager'
import { ThemeDebug } from './components/theme-debug'
import GameDashboard from './components/game/GameDashboard'

function App() {
  return (
    <ThemeProvider storageKey="pokewave-theme">
      <ThemeManager />
      <ThemeDebug />
      <Router>
        <Routes>
          <Route path="/" element={<GameDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App