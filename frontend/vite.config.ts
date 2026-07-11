import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load .env so we can read VITE_API_BASE_URL inside vite.config.ts
  const env = loadEnv(mode, process.cwd(), "");

  const backendOrigin = env.VITE_API_BASE_URL
    ? new URL(env.VITE_API_BASE_URL).origin
    : "https://open-format-3d-viewer.onrender.com";

  return {
    plugins: [react()],

    server: {
      proxy: {
        "/health": {
          target: backendOrigin,
          changeOrigin: true,
          secure: true,
        },

        "/v1": {
          target: backendOrigin,
          changeOrigin: true,
          secure: true,
        },
      },
    },

    build: {
      chunkSizeWarningLimit: 4000,

      rollupOptions: {
        output: {
          manualChunks(id) {
            // Isolate xeokit (≈1.6 MB) so the app shell is cached separately
            // and only re-downloaded when xeokit itself changes.
            // All other node_modules are left to Rollup's automatic splitting
            // to avoid the circular vendor ↔ react-vendor chunk warning that
            // arises when third-party packages have "react" in their path.
            if (id.includes("node_modules/@xeokit")) {
              return "xeokit";
            }
          },
        },
      },
    },
  };
});
