import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Node's `fetch` (used by RTK Query under jsdom) rejects relative URLs, so tests talk
    // to an absolute same-origin base that MSW intercepts.
    env: { VITE_API_BASE_URL: 'http://localhost:3000/api/v1' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['src/api/schema.d.ts', 'src/main.tsx', '**/*.config.*', 'src/test/**'],
    },
  },
})
