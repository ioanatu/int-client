/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the backend REST API. Defaults to the dev-server proxy at `/api/v1`. */
  readonly VITE_API_BASE_URL?: string
  /** Shared session token, only needed when calling the backend without the dev proxy. */
  readonly VITE_SESSION_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
