import { http, HttpResponse } from 'msw';
import type { ApiErrorResponse } from '../api/types';
import { supplierDetail, suppliersPage } from './fixtures';

/** Absolute so it matches the base URL the tests configure (see `vitest.config.ts`). */
export const API_BASE = 'http://localhost:3000/api/v1';

/** Mirrors the backend's error envelope so the client's parsing is exercised for real. */
export const apiError = (status: number, message: string, path: string): ApiErrorResponse => ({
  statusCode: status,
  error: status === 404 ? 'Not Found' : 'Error',
  message,
  path,
  timestamp: new Date('2026-08-30T14:00:00.000Z').toISOString(),
});

export const handlers = [
  http.get(`${API_BASE}/suppliers`, ({ request }) => {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();

    const data = search
      ? suppliersPage.data.filter((supplier) => supplier.name.toLowerCase().includes(search))
      : suppliersPage.data;

    return HttpResponse.json({
      data,
      pagination: { ...suppliersPage.pagination, total: data.length },
    });
  }),

  http.get(`${API_BASE}/suppliers/:supplierId`, ({ params }) => {
    if (params.supplierId !== supplierDetail.id) {
      return HttpResponse.json(
        apiError(
          404,
          `Supplier with id '${String(params.supplierId)}' was not found.`,
          `${API_BASE}/suppliers/${String(params.supplierId)}`,
        ),
        { status: 404 },
      );
    }
    return HttpResponse.json(supplierDetail);
  }),
];
