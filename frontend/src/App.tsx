import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { Layout } from './components/layout/Layout'
import GameDashboard from './components/game/GameDashboard'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="pokewave-theme">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<GameDashboard />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  )
}

export default App