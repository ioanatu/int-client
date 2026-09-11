import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL, SESSION_HEADER, SESSION_TOKEN } from './config';
import type {
  CountryOptionList,
  IndustryList,
  ListSuppliersQuery,
  PaginatedSuppliers,
  SupplierDetail,
} from './types';

export const pruneQuery = (query: ListSuppliersQuery): Record<string, string | number | string[]> =>
  Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  );

export const suppliersApi = createApi({
  reducerPath: 'suppliersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      if (SESSION_TOKEN) headers.set(SESSION_HEADER, SESSION_TOKEN);
      return headers;
    },
  }),
  // used for caching and invalidation on potential mutations
  tagTypes: ['Supplier', 'Industry', 'Countries'],
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

    listCountries: builder.query<CountryOptionList, void>({
      query: () => 'countries',
      keepUnusedDataFor: 3600,
      providesTags: [{ type: 'Countries', id: 'LIST' }],
    }),

    getSupplier: builder.query<SupplierDetail, string>({
      query: (supplierId) => `suppliers/${supplierId}`,
      providesTags: (_result, _error, supplierId) => [{ type: 'Supplier', id: supplierId }],
    }),
  }),
});

export const {
  useListSuppliersQuery,
  useListIndustriesQuery,
  useListCountriesQuery,
  useGetSupplierQuery,
} = suppliersApi;
