import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const remotes = {
    movies:
      env.VITE_REMOTE_MOVIES ||
      'http://localhost:4311/assets/remoteEntry.js',
    users:
      env.VITE_REMOTE_USERS ||
      'http://localhost:4312/assets/remoteEntry.js',
    screenings:
      env.VITE_REMOTE_SCREENINGS ||
      'http://localhost:4313/assets/remoteEntry.js',
    reservations:
      env.VITE_REMOTE_RESERVATIONS ||
      'http://localhost:4314/assets/remoteEntry.js',
  }

  return {
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes,
      shared: ['react', 'react-dom'],
    }),
  ],
  server: {
    port: 4310,
    strictPort: true,
  },
  }
})
