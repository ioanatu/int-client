# IntNext Client

React client for the [IntNext PoC API](../int-server).

**Stack:** React 19 · TypeScript · Redux Toolkit (RTK Query) · Vite · Material UI · Vitest

---

## Quick start

The client needs the backend running and a session token.

```bash
# 1. Start the backend (in another terminal)
cd ../int-server && npm run start:dev

# 2. Configure this client
cp .env.example .env          # then set SESSION_TOKEN to the backend's own token

# 3. Install and run
corepack enable               # once per machine — the repo pins Yarn 4 via `packageManager`
yarn install
yarn dev                      # http://localhost:5173
```

### Authentication

Every `/api/**` request must carry an `X-SESSION` header. The Vite dev server proxies
`/api` to the backend and injects that header from `SESSION_TOKEN` (see `vite.config.ts`),
so **the secret stays in the dev-server process and never ships in the browser bundle**.

For a build that has to reach the backend directly, `VITE_API_URL` and
`VITE_SESSION_TOKEN` are honoured instead — but note that anything prefixed `VITE_` is
inlined into the bundle and is therefore public. In a real deployment the token belongs
behind a backend-for-frontend or a reverse proxy, not in the client.

| Variable             | Where it runs     | Purpose                                      |
| -------------------- | ----------------- | -------------------------------------------- |
| `API_PROXY_TARGET`   | dev server (Node) | Backend origin to proxy `/api` to            |
| `SESSION_TOKEN`      | dev server (Node) | Injected as `X-SESSION` on proxied requests  |
| `VITE_API_URL`       | browser           | Bypass the proxy and call the API directly   |
| `VITE_SESSION_TOKEN` | browser           | Session token for that direct call (public!) |

---

## Scripts

| Command               | What it does                                                |
| --------------------- | ----------------------------------------------------------- |
| `yarn dev`            | Dev server on `:5173` with the `/api` proxy                 |
| `yarn build`          | `tsc --noEmit` then a production build into `dist/`         |
| `yarn preview`        | Serve the production build                                  |
| `yarn test`           | Vitest in watch mode                                        |
| `yarn test:run`       | Vitest once (CI mode)                                       |
| `yarn test:ui`        | Vitest browser UI                                           |
| `yarn coverage`       | Vitest with a v8 coverage report                            |
| `yarn lint`           | oxlint, including the `jsx-a11y` accessibility rules        |
| `yarn generate:types` | Regenerate `src/api/schema.d.ts` from the backend's OpenAPI |

---

## Types come from the backend

`src/api/schema.d.ts` is **generated**, never hand-edited. It is produced by
[`openapi-typescript`](https://github.com/openapi-ts/openapi-typescript) from the OpenAPI
document the Nest backend serves at `/api-docs-json`:

```bash
# backend running on :3000
yarn generate:types

# or against a deployed instance
OPENAPI_URL=https://int-server-ytx6.onrender.com/api-docs-json yarn generate:types
```

`src/api/types.ts` is the only file that reads from the generated schema; everything else
imports the named aliases (`SupplierListItem`, `SupplierDetail`, `ListSuppliersQuery`, …)
from there. So a breaking backend change shows up as a type error in one place rather than
scattered across the app. The filter option lists are declared
`as const satisfies readonly RiskLevel[]`, which means a renamed enum value on the server
fails the build instead of silently producing a request the API rejects.

---

## Data fetching and caching

RTK Query (`src/api/suppliersApi.ts`) owns all server state:

- **Caching** — one cache entry per distinct query. Paging back to a page you have already
  visited, or returning to a supplier you have already opened, renders from cache with no
  request. Unused entries are evicted after five minutes (`keepUnusedDataFor`), which suits
  read-only master data.
- **Loading** — `isLoading` (first load, nothing to show) drives the full-page spinner,
  while `isFetching` (background refresh over existing data) drives a thin progress bar so
  the table never flashes empty.
- **Errors** — `src/api/errors.ts` unwraps the backend's error envelope, so the user sees
  _“Supplier with id 'sup_999' was not found.”_ rather than a status code. Transport
  failures get their own plain-language message, and every error state offers a retry —
  except a 404, which retrying cannot fix.

List filters and pagination live in the **URL**, not in component state, so a filtered view
can be linked and restored by the back button, and each distinct URL maps to its own cache
entry. Values from the URL are validated against the generated unions before they are sent.

Redux Toolkit also backs a small `uiSlice` (colour mode, persisted to `localStorage`).

---

## Project structure

```
src/
├── api/
│   ├── schema.d.ts          # GENERATED from the backend's OpenAPI document
│   ├── types.ts             # named aliases over the generated schema
│   ├── suppliersApi.ts      # RTK Query endpoints, caching and tags
│   ├── errors.ts            # error envelope -> user-facing message
│   └── config.ts            # base URL and session header
├── app/                     # store setup and typed hooks
├── components/              # layout, loading/error/empty states, chips
├── features/
│   ├── suppliers/           # list view, detail view, filters, URL params hook
│   └── ui/                  # colour-mode slice
├── test/                    # MSW handlers, typed fixtures, render helper
└── utils/                   # date, number and enum formatting
```

---

## Testing

Vitest + React Testing Library, with [MSW](https://mswjs.io) intercepting HTTP so the real
RTK Query stack (including its cache and error handling) runs in every test. The fixtures
in `src/test/fixtures.ts` are typed with the generated backend contracts, so they cannot
drift from the API.

```bash
yarn test:run
```

Covered: cache reuse across repeated queries, list rendering, URL-driven filtering, the
empty state, error state with retry, list → detail navigation, the detail profile, the 404
path, error-message extraction and the formatters.

---

## Notes and trade-offs

- **Yarn 4** is pinned through `packageManager` in `package.json` (Corepack), so no Yarn
  binary is vendored into the repository. `nodeLinker: node-modules` keeps a conventional
  `node_modules` tree rather than PnP.
- **oxlint** ships with the current Vite template in place of ESLint; the `jsx-a11y`
  plugin is enabled on it for the accessibility rules.
- The API also supports an `industry` filter, which is an exact (case-insensitive) match.
  It is left out of the filter bar because a free-text field for an exact match is a trap;
  it would want a dropdown fed by a distinct-industries endpoint the API does not expose.
