import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Set host to '0.0.0.0' to allow LAN access from other devices
    // Use: npx vite --host 0.0.0.0   or set VITE_HOST=0.0.0.0
    proxy: {
      '/api': {
        // Backend API URL - change to your backend IP if running on a different machine
        // e.g., target: 'http://192.168.1.100:8000'
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
