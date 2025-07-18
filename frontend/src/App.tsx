import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { MantineProvider, ColorSchemeScript } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import GameDashboard from './components/game/GameDashboard'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

function App() {
  return (
    <MantineProvider defaultColorScheme="auto">
      <ColorSchemeScript defaultColorScheme="auto" />
      <Notifications />
      <Router>
        <Routes>
          <Route path="/" element={<GameDashboard />} />
        </Routes>
      </Router>
    </MantineProvider>
  )
}

export default App