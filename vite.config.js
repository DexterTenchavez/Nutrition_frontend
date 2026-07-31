import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow phone access
    port: 5173,
    // Remove proxy - let axios handle it directly
  }
})