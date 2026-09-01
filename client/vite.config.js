import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    strictPort: false,   // fall back to next port if 5173 is taken
    proxy: {
      // Proxy all /api requests to the Express server.
      // This means the client never needs to hardcode the server port —
      // it always calls /api/... and Vite forwards to localhost:5000.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
