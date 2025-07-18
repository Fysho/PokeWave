import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { ThemeManager } from './components/theme-manager'
import GameDashboard from './components/game/GameDashboard'

function App() {
  return (
    <ThemeProvider storageKey="pokewave-theme">
      <ThemeManager />
      <Router>
        <Routes>
          <Route path="/" element={<GameDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App