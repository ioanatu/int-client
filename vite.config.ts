import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      "process.env.VITE_API_URL": JSON.stringify(env.VITE_API_URL),
      "process.env.VITE_SESSION_TOKEN": JSON.stringify(env.VITE_SESSION_TOKEN),
    },
    server: {
      port: 5173,
      proxy: {
        // The backend requires a shared secret in `X-SESSION`. Injecting it here keeps the
        // token in the dev server process instead of shipping it inside the client bundle.
        "/api": {
          target: env.API_PROXY_TARGET || "http://localhost:3000",
          changeOrigin: true,
          headers: env.SESSION_TOKEN
            ? { "X-SESSION": env.SESSION_TOKEN }
            : undefined,
        },
      },
    },
  };
});
