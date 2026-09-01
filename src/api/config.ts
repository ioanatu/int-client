/**
 * In development the Vite dev server proxies `/api` to the backend and injects the
 * `X-SESSION` header (see `vite.config.ts`), so the shared secret never reaches the
 * browser. `VITE_API_BASE_URL` / `VITE_SESSION_TOKEN` exist for the case where the built
 * bundle has to talk to the backend directly — note that anything prefixed `VITE_` is
 * inlined into the bundle and is therefore public.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export const SESSION_TOKEN = import.meta.env.VITE_SESSION_TOKEN

export const SESSION_HEADER = 'X-SESSION'
