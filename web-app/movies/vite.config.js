import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'movies',
      filename: 'remoteEntry.js',
      exposes: {
        './Module': './src/RemoteApp.jsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  server: {
    port: 4311,
    strictPort: true,
  },
})
