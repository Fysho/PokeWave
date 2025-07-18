import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { MantineProvider, ColorSchemeScript } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import GameDashboard from './components/game/GameDashboard'
import { theme } from './theme/theme'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

function App() {
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