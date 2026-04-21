import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: {
        movies: 'http://localhost:4311/assets/remoteEntry.js',
        users: 'http://localhost:4312/assets/remoteEntry.js',
        screenings: 'http://localhost:4313/assets/remoteEntry.js',
        reservations: 'http://localhost:4314/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  server: {
    port: 4310,
    strictPort: true,
  },
})
