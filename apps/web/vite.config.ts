import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Versión publicada: la inyecta el despliegue (ver scripts/deploy.sh)
const commit = process.env.GIT_COMMIT ?? 'dev';
const buildDate = process.env.BUILD_DATE ?? new Date().toISOString();

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_COMMIT__: JSON.stringify(commit),
    __APP_BUILD_DATE__: JSON.stringify(buildDate),
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
