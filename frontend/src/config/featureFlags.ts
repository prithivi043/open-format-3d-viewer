/**
 * featureFlags.ts
 *
 * Single source of truth for environment-driven feature toggles.
 *
 * USAGE
 * ─────
 *  import { flags } from '@/config/featureFlags';
 *
 *  if (flags.mockUpload) {
 *    // use mockUploadService
 *  } else {
 *    // use real API
 *  }
 *
 * TO SWITCH TO THE REAL BACKEND
 * ─────────────────────────────
 *  Set  VITE_MOCK_UPLOAD=false  in your .env.local (or just remove it).
 *  No other code changes needed.
 */

export const flags = {
  /**
   * When true  → all model uploads go through mockUploadService (no backend).
   * When false → uploads go through the real FastAPI presigned-URL flow.
   *
   * Defaults to true so new devs don't need any backend setup.
   */
  mockUpload: import.meta.env.VITE_MOCK_UPLOAD !== "false",
} as const;
