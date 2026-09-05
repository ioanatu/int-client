import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL, SESSION_HEADER, SESSION_TOKEN } from './config';
import type { IndustryList, ListSuppliersQuery, PaginatedSuppliers, SupplierDetail } from './types';

export const pruneQuery = (query: ListSuppliersQuery): Record<string, string | number> => {
  return Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  );
};

export const suppliersApi = createApi({
  reducerPath: 'suppliersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      if (SESSION_TOKEN) headers.set(SESSION_HEADER, SESSION_TOKEN);
      return headers;
    },
  }),
  tagTypes: ['Supplier', 'Industry'], // used for caching and invalidation
  keepUnusedDataFor: 300,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    listSuppliers: builder.query<PaginatedSuppliers, ListSuppliersQuery>({
      query: (params) => ({ url: 'suppliers', params: pruneQuery(params) }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: 'Supplier' as const,
                id,
              })),
              { type: 'Supplier' as const, id: 'LIST' },
            ]
          : [{ type: 'Supplier' as const, id: 'LIST' }],
    }),

    listIndustries: builder.query<IndustryList, void>({
      query: () => 'industries',
      keepUnusedDataFor: 3600,
      providesTags: [{ type: 'Industry', id: 'LIST' }],
    }),

    getSupplier: builder.query<SupplierDetail, string>({
      query: (supplierId) => `suppliers/${supplierId}`,
      providesTags: (_result, _error, supplierId) => [{ type: 'Supplier', id: supplierId }],
    }),
  }),
});

export const { useListSuppliersQuery, useListIndustriesQuery, useGetSupplierQuery } = suppliersApi;
