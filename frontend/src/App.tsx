import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import GameDashboard from './components/game/GameDashboard'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="pokewave-theme" attribute="class" enableSystem disableTransitionOnChange>
      <Router>
        <Routes>
          <Route path="/" element={<GameDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App