import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Prevent Vite from obscuring Rust errors
  clearScreen: false,
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  // Env variables prefixed with TAURI_ are available in the frontend
  envPrefix: ['VITE_', 'TAURI_'],
})
