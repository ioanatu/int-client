import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { App } from '../../App';
import { countryList, industryList } from '../../test/fixtures';
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

const countCountryRequests = () => {
  const calls = { count: 0 };
  server.use(
    http.get(`${API_BASE}/countries`, () => {
      calls.count += 1;
      return HttpResponse.json(countryList);
    }),
  );
  return calls;
};

const openCountryMenu = async (user: ReturnType<typeof renderWithProviders>['user']) => {
  await user.click(screen.getByRole('combobox', { name: 'Countries' }));
  return screen.findByRole('listbox');
};

/** Records the `country` values every supplier request carried, oldest first. */
const captureCountryParams = () => {
  const requests: string[][] = [];
  server.use(
    http.get(`${API_BASE}/suppliers`, ({ request }) => {
      requests.push(
        new URL(request.url).searchParams.getAll('country').flatMap((value) => value.split(',')),
      );
      return HttpResponse.json({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, hasNext: false },
      });
    }),
  );
  return requests;
};

const lastRequest = (requests: string[][]) => requests[requests.length - 1];

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

  it('clears the industry when its chip is dismissed, without reopening the menu', async () => {
    const { user } = renderWithProviders(<App />, { route: '/suppliers?industry=manufacturing' });

    // sup_002 is Food & Beverage, so it is filtered out to begin with.
    await waitFor(() => {
      expect(screen.queryByText('Northwind Logistics AB')).not.toBeInTheDocument();
    });

    await user.click(await screen.findByLabelText('Remove Manufacturing'));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(await screen.findByText('Northwind Logistics AB')).toBeInTheDocument();
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

describe('country filter', () => {
  it('does not request the countries until the dropdown is opened', async () => {
    const calls = countCountryRequests();

    renderWithProviders(<App />, { route: '/suppliers' });

    expect(await screen.findByText('Acme Components GmbH')).toBeInTheDocument();
    expect(calls.count).toBe(0);
  });

  it('lists the countries with their supplier counts once opened', async () => {
    const { user } = renderWithProviders(<App />, { route: '/suppliers' });
    await screen.findByText('Acme Components GmbH');

    const listbox = await openCountryMenu(user);

    expect(await within(listbox).findByRole('option', { name: /Germany/ })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: /Sweden/ })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Germany1' })).toBeInTheDocument();
  });

  it('keeps the menu open so several countries can be picked in one go', async () => {
    const { user } = renderWithProviders(<App />, { route: '/suppliers' });
    await screen.findByText('Acme Components GmbH');

    const listbox = await openCountryMenu(user);
    await user.click(await within(listbox).findByRole('option', { name: /Germany/ }));
    await user.click(await within(listbox).findByRole('option', { name: /Sweden/ }));

    // Both stay selected — picking the second must not replace the first.
    await waitFor(() => {
      expect(within(listbox).getByRole('option', { name: /Germany/ })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });
    expect(within(listbox).getByRole('option', { name: /Sweden/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('filters the supplier list by the selected country', async () => {
    const { user } = renderWithProviders(<App />, { route: '/suppliers' });
    await screen.findByText('Acme Components GmbH');

    const listbox = await openCountryMenu(user);
    await user.click(await within(listbox).findByRole('option', { name: /Sweden/ }));

    // sup_001 is in DE, so it drops out.
    await waitFor(() => {
      expect(screen.queryByText('Acme Components GmbH')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Northwind Logistics AB')).toBeInTheDocument();
  });

  it('sends every selected country to the API', async () => {
    const requests = captureCountryParams();
    const { user } = renderWithProviders(<App />, { route: '/suppliers' });

    const listbox = await openCountryMenu(user);
    await user.click(await within(listbox).findByRole('option', { name: /Germany/ }));
    await user.click(await within(listbox).findByRole('option', { name: /Sweden/ }));

    await waitFor(() => {
      expect(lastRequest(requests)).toEqual(['DE', 'SE']);
    });
  });

  it('deselecting the last country drops the parameter instead of sending an empty one', async () => {
    const requests = captureCountryParams();
    const { user } = renderWithProviders(<App />, { route: '/suppliers?country=DE' });

    // The deep link is applied first, so the empty result below is a real transition.
    await waitFor(() => {
      expect(lastRequest(requests)).toEqual(['DE']);
    });

    const listbox = await openCountryMenu(user);
    await user.click(await within(listbox).findByRole('option', { name: /Germany/ }));

    await waitFor(() => {
      expect(lastRequest(requests)).toEqual([]);
    });
  });

  it('shows a deep-linked country by name rather than by code', async () => {
    const calls = countCountryRequests();

    renderWithProviders(<App />, { route: '/suppliers?country=DE' });

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Countries' })).toHaveTextContent('Germany');
    });
    expect(calls.count).toBe(1);
  });

  it('accepts a comma-separated list in the URL', async () => {
    const { user } = renderWithProviders(<App />, { route: '/suppliers?country=DE,SE' });
    await screen.findByText('Acme Components GmbH');

    const listbox = await openCountryMenu(user);

    expect(await within(listbox).findByRole('option', { name: /Germany/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(within(listbox).getByRole('option', { name: /Sweden/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('removes a single country when its chip is dismissed', async () => {
    const requests = captureCountryParams();
    const { user } = renderWithProviders(<App />, { route: '/suppliers?country=DE,SE' });

    await waitFor(() => {
      expect(lastRequest(requests)).toEqual(['DE', 'SE']);
    });

    await user.click(await screen.findByLabelText('Remove Germany'));

    await waitFor(() => {
      expect(lastRequest(requests)).toEqual(['SE']);
    });
    expect(screen.getByRole('combobox', { name: 'Countries' })).toHaveTextContent('Sweden');
  });

  it('does not open the dropdown when a chip is dismissed', async () => {
    const { user } = renderWithProviders(<App />, { route: '/suppliers?country=DE,SE' });

    await user.click(await screen.findByLabelText('Remove Germany'));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('reports a failure inside the dropdown and retries when it is reopened', async () => {
    let attempts = 0;
    server.use(
      http.get(`${API_BASE}/countries`, () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json(apiError(500, 'Countries are unavailable.', '/api/v1/countries'), {
              status: 500,
            })
          : HttpResponse.json(countryList);
      }),
    );

    const { user } = renderWithProviders(<App />, { route: '/suppliers' });
    await screen.findByText('Acme Components GmbH');

    const listbox = await openCountryMenu(user);
    expect(await within(listbox).findByText('Countries are unavailable.')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await openCountryMenu(user);

    expect(await screen.findByRole('option', { name: /Germany/ })).toBeInTheDocument();
    expect(attempts).toBe(2);
  });
});
