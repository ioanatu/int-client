import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    build: {
      sourcemap: 'hidden',
      rolldownOptions: {
        output: {
          manualChunks(id: string) {
            if (/node_modules\/(@mui|@emotion|@popperjs|stylis)/.test(id)) return 'ui';
          },
        },
      },
    },
    define: {
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'process.env.VITE_SESSION_TOKEN': JSON.stringify(env.VITE_SESSION_TOKEN),
      'process.env.VITE_SENTRY_DSN': JSON.stringify(env.VITE_SENTRY_DSN),
      'process.env.SENTRY_AUTH_TOKEN': JSON.stringify(env.SENTRY_AUTH_TOKEN),
      'process.env.SENTRY_ORG': JSON.stringify(env.SENTRY_ORG),
      'process.env.SENTRY_PROJECT': JSON.stringify(env.SENTRY_PROJECT),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET,
          changeOrigin: true,
          headers: env.SESSION_TOKEN ? { 'X-SESSION': env.SESSION_TOKEN } : undefined,
        },
      },
    },
  };
});
