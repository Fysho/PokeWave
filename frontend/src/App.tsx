import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Layout } from '@/components/layout/Layout'
import { Game } from '@/pages/Game'
import { Daily } from '@/pages/Daily'
import { Survival } from '@/pages/Survival'
import { Leaderboard } from '@/pages/Leaderboard'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="pokewave-theme">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Game />} />
            <Route path="/daily" element={<Daily />} />
            <Route path="/survival" element={<Survival />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  )
}

export default App