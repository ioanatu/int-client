import { screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { App } from '../../App'
import { API_BASE, apiError } from '../../test/handlers'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/msw-server'

describe('SupplierListPage', () => {
  it('shows a loading state and then the suppliers', async () => {
    renderWithProviders(<App />, { route: '/suppliers' })

    expect(screen.getByRole('status')).toHaveTextContent('Loading suppliers…')

    expect(await screen.findByText('Acme Components GmbH')).toBeInTheDocument()
    expect(screen.getByText('Northwind Logistics AB')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders each supplier as a row with its status and risk', async () => {
    renderWithProviders(<App />, { route: '/suppliers' })

    const row = (await screen.findByText('Acme Components GmbH')).closest('tr')
    expect(row).not.toBeNull()
    expect(within(row!).getByText('sup_001')).toBeInTheDocument()
    expect(within(row!).getByText('DE')).toBeInTheDocument()
    expect(within(row!).getByText('Active')).toBeInTheDocument()
    expect(within(row!).getByText('High · 82')).toBeInTheDocument()
  })

  it('reads filters from the URL and applies them to the request', async () => {
    renderWithProviders(<App />, { route: '/suppliers?search=northwind' })

    expect(await screen.findByText('Northwind Logistics AB')).toBeInTheDocument()
    expect(screen.queryByText('Acme Components GmbH')).not.toBeInTheDocument()
  })

  it('shows an empty state when nothing matches the filters', async () => {
    renderWithProviders(<App />, { route: '/suppliers?search=nothing-matches' })

    expect(await screen.findByText('No suppliers match these filters.')).toBeInTheDocument()
  })

  it('shows an error state with a retry action when the request fails', async () => {
    server.use(
      http.get(`${API_BASE}/suppliers`, () =>
        HttpResponse.json(apiError(500, 'Internal Server Error', '/api/v1/suppliers'), {
          status: 500,
        }),
      ),
    )

    renderWithProviders(<App />, { route: '/suppliers' })

    expect(await screen.findByText('Could not load suppliers')).toBeInTheDocument()
    expect(screen.getByText('Internal Server Error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('navigates to the detail view when a row is clicked', async () => {
    const { user } = renderWithProviders(<App />, { route: '/suppliers' })

    await user.click(await screen.findByText('Acme Components GmbH'))

    await waitFor(() => {
      expect(
        screen.getByText('Acme Components Gesellschaft mit beschränkter Haftung'),
      ).toBeInTheDocument()
    })
  })
})
