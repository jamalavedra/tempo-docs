import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vocs } from 'vocs/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vocs(),
    react(),
  ],
  optimizeDeps: {
    include: ['vocs > anser', 'vocs > lz-string', 'vocs > escape-carriage', 'vocs > escape-carriage', 'vocs > @jridgewell/resolve-uri', 'vocs > ts-interface-checker', 'vocs > lines-and-columns'],
    exclude: ['vocs'],
  },
})
