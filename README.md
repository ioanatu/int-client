# IntNext Client

React client for the [IntNext PoC API](https://github.com/ioanatu/int-server).

**Stack:** React 19 · TypeScript · Redux Toolkit (RTK Query) · Material UI · [component-library](https://github.com/ioanatu/component-library/pkgs/npm/component-library) · Vite · Vitest

---

## Prerequisites

`SESSION_TOKEN` for the `X-SESSION` header.

## Quick start

```bash

# 1. Configure the client
cp .env.example .env          # set SESSION_TOKEN to the backend's own token

# 2. Install and run
corepack enable               # once per machine — the repo pins Yarn 4 via `packageManager`
yarn install
yarn dev                      # http://localhost:5173, against VITE_API_URL

# (optional) Run the client against the local backend server
cd ../int-server && npm run start:dev   # in another terminal, on :3000
yarn dev:local                          # back in int-client
```

## Scripts

| Command               | What it does                                                |
| --------------------- | ----------------------------------------------------------- |
| `yarn dev`            | Dev server on `:5173` with `/api` proxy to deployed backend |
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

## Observability

This project uses Sentry for monitoring and error tracking. Production sourcemaps are uploaded in the CI/CD pipeline with GitHub actions.

---

## Testing

Vitest + React Testing Library, with [MSW](https://mswjs.io) intercepting HTTP so the real
RTK Query stack (including its cache and error handling) runs in every test. The fixtures
in `src/test/fixtures.ts` are typed with the generated backend contracts, so they cannot
differ from the API.

```bash
yarn test:run
```

For a detailed list of implemented features, check out the documentation in [Features](./FEATURES.md).
