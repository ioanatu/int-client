import { describe, expect, it } from 'vitest';
import { makeStore } from '../app/store';
import { suppliersPage } from '../test/fixtures';
import { pruneQuery, suppliersApi } from './suppliersApi';

describe('pruneQuery', () => {
  it('drops empty and undefined values so they never reach the API', () => {
    expect(pruneQuery({ search: '', country: undefined, status: 'active', page: 1 })).toEqual({
      status: 'active',
      page: 1,
    });
  });

  it('keeps falsy-but-meaningful values', () => {
    expect(pruneQuery({ page: 2, limit: 25 })).toEqual({ page: 2, limit: 25 });
  });
});

describe('suppliersApi', () => {
  it('fetches a page of suppliers', async () => {
    const store = makeStore();

    const result = await store.dispatch(suppliersApi.endpoints.listSuppliers.initiate({ page: 1 }));

    expect(result.data).toEqual(suppliersPage);
  });

  it('serves a repeated query from cache instead of refetching', async () => {
    const store = makeStore();

    await store.dispatch(suppliersApi.endpoints.listSuppliers.initiate({ page: 1 }));
    await store.dispatch(suppliersApi.endpoints.listSuppliers.initiate({ page: 1 }));

    const entries = Object.values(store.getState().suppliersApi.queries);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.fulfilledTimeStamp).toBeDefined();
  });

  it('caches each distinct query separately', async () => {
    const store = makeStore();

    await store.dispatch(suppliersApi.endpoints.listSuppliers.initiate({ page: 1 }));
    await store.dispatch(suppliersApi.endpoints.listSuppliers.initiate({ page: 2 }));

    expect(Object.keys(store.getState().suppliersApi.queries)).toHaveLength(2);
  });

  it('surfaces the backend error envelope for an unknown supplier', async () => {
    const store = makeStore();

    const result = await store.dispatch(suppliersApi.endpoints.getSupplier.initiate('sup_999'));

    expect(result.error).toMatchObject({ status: 404 });
  });
});
