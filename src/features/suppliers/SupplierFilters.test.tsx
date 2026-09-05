import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { App } from '../../App';
import { industryList } from '../../test/fixtures';
import { API_BASE, apiError } from '../../test/handlers';
import { server } from '../../test/msw-server';
import { renderWithProviders } from '../../test/render';

/**
 * Replaces the industries handler with one that counts calls, so the tests can assert on
 * *when* the request happens — the whole point of loading the list lazily.
 */
const countIndustryRequests = () => {
  const calls = { count: 0 };
  server.use(
    http.get(`${API_BASE}/industries`, () => {
      calls.count += 1;
      return HttpResponse.json(industryList);
    }),
  );
  return calls;
};

const openIndustryMenu = async (user: ReturnType<typeof renderWithProviders>['user']) => {
  await user.click(screen.getByRole('combobox', { name: 'Industry' }));
  return screen.findByRole('listbox');
};

describe('industry filter', () => {
  it('does not request the industries until the dropdown is opened', async () => {
    const calls = countIndustryRequests();

    renderWithProviders(<App />, { route: '/suppliers' });

    // The supplier list has fully loaded, so anything eager would already have fired.
    expect(await screen.findByText('Acme Components GmbH')).toBeInTheDocument();
    expect(calls.count).toBe(0);
  });

  it('requests the industries when the dropdown is opened', async () => {
    const calls = countIndustryRequests();
    const { user } = renderWithProviders(<App />, { route: '/suppliers' });
    await screen.findByText('Acme Components GmbH');

    const listbox = await openIndustryMenu(user);

    expect(
      await within(listbox).findByRole('option', { name: /Manufacturing/ }),
    ).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: /Food & Beverage/ })).toBeInTheDocument();
    expect(calls.count).toBe(1);
  });

  it('shows the supplier count alongside each industry', async () => {
    const { user } = renderWithProviders(<App />, { route: '/suppliers' });
    await screen.findByText('Acme Components GmbH');
    const listbox = await openIndustryMenu(user);

    expect(
      await within(listbox).findByRole('option', { name: 'Manufacturing1' }),
    ).toBeInTheDocument();
  });

  it('serves the cached industries when the dropdown is reopened', async () => {
    const calls = countIndustryRequests();
    const { user } = renderWithProviders(<App />, { route: '/suppliers' });
    await screen.findByText('Acme Components GmbH');

    const listbox = await openIndustryMenu(user);
    await within(listbox).findByRole('option', { name: /Manufacturing/ });
    await user.keyboard('{Escape}');
    await openIndustryMenu(user);

    expect(await screen.findByRole('option', { name: /Manufacturing/ })).toBeInTheDocument();
    expect(calls.count).toBe(1);
  });

  it('filters the supplier list by the selected industry', async () => {
    const { user } = renderWithProviders(<App />, { route: '/suppliers' });
    await screen.findByText('Acme Components GmbH');

    const listbox = await openIndustryMenu(user);
    await user.click(await within(listbox).findByRole('option', { name: /Manufacturing/ }));

    // sup_002 sits in Food & Beverage, so it drops out of the list.
    await waitFor(() => {
      expect(screen.queryByText('Northwind Logistics AB')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Acme Components GmbH')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Industry' })).toHaveTextContent('Manufacturing');
  });

  it('sends the industry id rather than the display name', async () => {
    let requestedIndustry: string | null = null;
    server.use(
      http.get(`${API_BASE}/suppliers`, ({ request }) => {
        requestedIndustry = new URL(request.url).searchParams.get('industry');
        return HttpResponse.json({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, hasNext: false },
        });
      }),
    );

    const { user } = renderWithProviders(<App />, { route: '/suppliers' });
    const listbox = await openIndustryMenu(user);
    await user.click(await within(listbox).findByRole('option', { name: /Food & Beverage/ }));

    // The id is URL-safe; the display name would need percent-encoding.
    await screen.findByText('No suppliers match these filters.');
    expect(requestedIndustry).toBe('food-beverage');
  });

  it('loads the industries up front so a deep-linked id is shown by name', async () => {
    const calls = countIndustryRequests();

    renderWithProviders(<App />, { route: '/suppliers?industry=manufacturing' });

    // The URL only carries the id, so the name proves the list was fetched without the
    // dropdown ever being opened.
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Industry' })).toHaveTextContent('Manufacturing');
    });
    expect(calls.count).toBe(1);
  });

  it('reports a failure inside the dropdown and retries when it is reopened', async () => {
    let attempts = 0;
    server.use(
      http.get(`${API_BASE}/industries`, () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json(apiError(500, 'Industries are unavailable.', '/api/v1/industries'), {
              status: 500,
            })
          : HttpResponse.json(industryList);
      }),
    );

    const { user } = renderWithProviders(<App />, { route: '/suppliers' });
    await screen.findByText('Acme Components GmbH');

    const listbox = await openIndustryMenu(user);
    expect(await within(listbox).findByText('Industries are unavailable.')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await openIndustryMenu(user);

    expect(await screen.findByRole('option', { name: /Manufacturing/ })).toBeInTheDocument();
    expect(attempts).toBe(2);
  });
});
