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
      chunkSizeWarningLimit: 2000,

      rollupOptions: {
        output: {
          manualChunks(id) {
            // xeokit huge bundle → separate chunk
            if (id.includes("@xeokit")) {
              return "xeokit";
            }

            // React core
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "react-vendor";
            }

            // React Query
            if (id.includes("@tanstack")) {
              return "query";
            }

            // Remaining third-party libs
            if (id.includes("node_modules")) {
              return "vendor";
            }
          },
        },
      },
    },
  };
});
