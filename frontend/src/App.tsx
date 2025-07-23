import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { MantineProvider, ColorSchemeScript } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import GameDashboard from './components/game/GameDashboard'
import { theme } from './theme/theme'
import { useAuthStore } from './store/authStore'
import { usePokedexStore } from './store/pokedexStore'
import AuthService from './services/auth'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

function App() {
  const { token, isAuthenticated } = useAuthStore();
  const { loadFromBackend } = usePokedexStore();
  
  useEffect(() => {
    // Restore auth token on app startup
    if (token) {
      AuthService.setAuthToken(token);
    }
  }, [token]);

  useEffect(() => {
    // Load Pokedex data from backend when authenticated
    if (isAuthenticated) {
      loadFromBackend();
    }
  }, [isAuthenticated, loadFromBackend]);
  
  return (
    <>
      <ColorSchemeScript defaultColorScheme="auto" />
      <MantineProvider theme={theme} defaultColorScheme="auto">
        <Notifications />
        <Router>
          <Routes>
            <Route path="/" element={<GameDashboard />} />
          </Routes>
        </Router>
      </MantineProvider>
    </>
  )
}

export default App