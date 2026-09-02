import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { type AppStore, makeStore } from '../app/store';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial URL, so tests can enter on a detail route or with filters applied. */
  route?: string;
  store?: AppStore;
}

/**
 * Renders a component inside the providers the app relies on. A fresh store per test keeps
 * RTK Query's cache from leaking results between test cases.
 */
export const renderWithProviders = (
  ui: ReactElement,
  { route = '/', store = makeStore(), ...options }: RenderWithProvidersOptions = {},
): RenderResult & { store: AppStore; user: ReturnType<typeof userEvent.setup> } => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </Provider>
  );

  return {
    store,
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
};
