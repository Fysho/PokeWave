import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4001,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    },
    // Reduce HMR connections - may help with Firefox file descriptor issues
    hmr: {
      // Use polling instead of websocket for more stability
      // Uncomment if Firefox keeps crashing:
      // protocol: 'ws',
      // host: 'localhost',
    }
  }
})
