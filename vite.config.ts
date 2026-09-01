import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // `loadEnv` with an empty prefix also exposes the non-`VITE_` variables, which are the
  // ones we deliberately keep out of the browser bundle (see `SESSION_TOKEN` below).
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // The backend requires a shared secret in `X-SESSION`. Injecting it here keeps the
        // token in the dev server process instead of shipping it inside the client bundle.
        '/api': {
          target: env.API_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
          headers: env.SESSION_TOKEN ? { 'X-SESSION': env.SESSION_TOKEN } : undefined,
        },
      },
    },
  }
})
