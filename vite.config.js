import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Allow external connections
    open: true,
    allowedHosts: [
      '.ngrok.io',
      '.ngrok-free.app',
      '.ngrok.app'
    ]
  }
})


