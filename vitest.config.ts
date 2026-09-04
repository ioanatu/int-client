import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Node's `fetch` (used by RTK Query under jsdom) rejects relative URLs, so tests talk
    // to an absolute same-origin base that MSW intercepts.
    env: { VITE_API_URL: 'http://localhost:3000/api/v1' },
    server: {
      deps: {
        // The component library ships an ESM entry that does `import './...css'`. Deps in
        // node_modules are externalised by default and loaded by Node, which has no loader
        // for .css; inlining it lets Vite transform the package and stub the stylesheet.
        inline: ['@ioanatu/component-library'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['src/api/schema.d.ts', 'src/main.tsx', '**/*.config.*', 'src/test/**'],
    },
  },
});
