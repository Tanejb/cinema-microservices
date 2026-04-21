import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'reservations',
      filename: 'remoteEntry.js',
      exposes: {
        './Module': './src/RemoteApp.jsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  server: {
    port: 4314,
    strictPort: true,
  },
})
