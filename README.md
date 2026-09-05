# IntNext Client

React client for the [IntNext PoC API](../int-server).

**Stack:** React 19 · TypeScript · Redux Toolkit (RTK Query) · Material UI · Vite · Vitest

---

## Prerequisites

Every `/api/**` request must carry an `X-SESSION` header. The Vite dev server proxies
`/api` to the backend and injects that header from `SESSION_TOKEN` (see `vite.config.ts`).

## Quick start

```bash

# 1. Configure the client
cp .env.example .env          # set SESSION_TOKEN to the backend's own token

# 2. Install and run
corepack enable               # once per machine — the repo pins Yarn 4 via `packageManager`
yarn install
yarn dev                      # http://localhost:5173

#(optional) Run the client against the local backend server
# Start the backend (in another terminal)
cd ../int-server && npm run start:dev
```

## Scripts

| Command               | What it does                                                |
| --------------------- | ----------------------------------------------------------- |
| `yarn dev`            | Dev server on `:5173` with the `/api` proxy                 |
| `yarn build`          | `tsc --noEmit` then a production build into `dist/`         |
| `yarn preview`        | Serve the production buil locally                           |
| `yarn test`           | Vitest in watch mode                                        |
| `yarn test:run`       | Vitest once (CI mode)                                       |
| `yarn test:ui`        | Vitest browser UI                                           |
| `yarn coverage`       | Vitest with a v8 coverage report                            |
| `yarn lint`           | eslint, including the `jsx-a11y` accessibility rules        |
| `yarn format`         | Formats with prettier                                       |
| `yarn format:check`   | Checks formatting with prettier                             |
| `yarn generate:types` | Regenerate `src/api/schema.d.ts` from the backend's OpenAPI |

---

## Types come from the backend

`src/api/schema.d.ts` is **generated**, never hand-edited. It is produced by
[`openapi-typescript`](https://github.com/openapi-ts/openapi-typescript) from the OpenAPI
document the NestJS backend serves at `/api-docs-json`:

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

- **Lazy loading** — the industry filter's options come from `GET /api/v1/industries`, and
  that request is only made when the dropdown is opened: most visits to the list never
  touch the filter, so paying for the round trip up front would be waste. Once fetched it
  is kept for the whole session (`keepUnusedDataFor: 3600`) — a small closed set that only
  changes when the supplier data does — so reopening the dropdown never re-requests. The
  one case that fetches up front is a deep link that already carries `?industry=`, where
  the list is what turns the id in the URL into a readable name.

List filters and pagination live in the **URL**, not in component state, so a filtered view
can be linked and restored by the back button, and each distinct URL maps to its own cache
entry. Values from the URL are validated against the generated unions before they are sent —
except `industry`, which is data rather than a closed enum, so an unknown value is simply
passed through (the API answers with an empty page, not a 400).

The industry dropdown sends the **id** the API advertises (`food-beverage`), not the display
name (`Food & Beverage`): the ids are URL-safe by construction, so no filter value ever needs
percent-encoding. The supplier count the endpoint returns is shown next to each option.

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
differ from the API.

```bash
yarn test:run
```

`src/features/suppliers/SupplierFilters.test.tsx` covers the industry filter specifically,
including the part that is easy to regress: that no industries request is made before the
dropdown is opened, that reopening it is served from cache, that the id (not the display
name) reaches the API, and that a failed load is reported inside the dropdown and retried
when it is reopened.
