import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { API_BASE_URL, SESSION_HEADER, SESSION_TOKEN } from './config'
import type { ListSuppliersQuery, PaginatedSuppliers, SupplierDetail } from './types'

/** Drops empty/undefined filters so they never reach the backend's strict validation. */
export const pruneQuery = (query: ListSuppliersQuery): Record<string, string | number> =>
  Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  ) as Record<string, string | number>

export const suppliersApi = createApi({
  reducerPath: 'suppliersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      if (SESSION_TOKEN) {
        headers.set(SESSION_HEADER, SESSION_TOKEN)
      }
      return headers
    },
  }),
  tagTypes: ['Supplier'],
  // The backend is read-only master data, so a five-minute cache for pages nobody is
  // looking at is generous without risking meaningfully stale reads.
  keepUnusedDataFor: 300,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    /** Each distinct filter/page combination is cached under its own key. */
    listSuppliers: builder.query<PaginatedSuppliers, ListSuppliersQuery>({
      query: (params) => ({ url: 'suppliers', params: pruneQuery(params) }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Supplier' as const, id })),
              { type: 'Supplier' as const, id: 'LIST' },
            ]
          : [{ type: 'Supplier' as const, id: 'LIST' }],
    }),

    getSupplier: builder.query<SupplierDetail, string>({
      query: (supplierId) => `suppliers/${supplierId}`,
      providesTags: (_result, _error, supplierId) => [{ type: 'Supplier', id: supplierId }],
    }),
  }),
})

export const { useListSuppliersQuery, useGetSupplierQuery } = suppliersApi
