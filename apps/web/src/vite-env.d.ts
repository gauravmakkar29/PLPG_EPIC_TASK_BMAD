/// <reference types="vite/client" />

/**
 * @fileoverview Vite environment type declarations.
 * Declares environment variables available via import.meta.env.
 *
 * @module @plpg/web/vite-env
 */

interface ImportMetaEnv {
  /** API base URL */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
