import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load .env so we can read VITE_API_BASE_URL inside vite.config.ts
  const env = loadEnv(mode, process.cwd(), "");

  const backendOrigin = env.VITE_API_BASE_URL
    ? // Strip any trailing path (e.g. /v1) — target must be origin only
      new URL(env.VITE_API_BASE_URL).origin
    : "https://open-format-3d-viewer.onrender.com";

  return {
    plugins: [react()],

    server: {
      proxy: {
        // Every request starting with /v1 is forwarded to the backend.
        // The browser only ever sees http://localhost:5173/v1/... → no CORS.
        "/v1": {
          target: backendOrigin, // https://open-format-3d-viewer.onrender.com
          changeOrigin: true, // rewrites the Host header to match target
          secure: true, // verify TLS cert on the target
          // No rewrite needed — /v1/projects stays /v1/projects on the backend
        },
      },
    },
  };
});
