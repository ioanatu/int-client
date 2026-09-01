import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** Shared MSW server; lifecycle is wired up in `vitest.setup.ts`. */
export const server = setupServer(...handlers)
