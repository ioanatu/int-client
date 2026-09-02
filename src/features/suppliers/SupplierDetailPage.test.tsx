import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../App';
import { renderWithProviders } from '../../test/render';

describe('SupplierDetailPage', () => {
  it('renders the full supplier profile', async () => {
    renderWithProviders(<App />, { route: '/suppliers/sup_001' });

    expect(
      await screen.findByRole('heading', { name: 'Acme Components GmbH' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Acme Components Gesellschaft mit beschränkter Haftung'),
    ).toBeInTheDocument();
    expect(screen.getByText('DE123456789')).toBeInTheDocument();
    expect(screen.getByText('Raw Materials')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'contact@acme-components.example' })).toHaveAttribute(
      'href',
      'mailto:contact@acme-components.example',
    );
  });

  it('shows a not-found message for an unknown supplier id', async () => {
    renderWithProviders(<App />, { route: '/suppliers/sup_999' });

    expect(await screen.findByText('Supplier not found')).toBeInTheDocument();
    expect(screen.getByText(/No supplier exists with id/)).toBeInTheDocument();
    // A 404 is not worth retrying, so no retry action is offered.
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('offers a way back to the list', async () => {
    const { user } = renderWithProviders(<App />, { route: '/suppliers/sup_001' });

    await user.click(await screen.findByRole('link', { name: /Back to suppliers/ }));

    expect(await screen.findByRole('heading', { name: 'Suppliers' })).toBeInTheDocument();
  });
});
