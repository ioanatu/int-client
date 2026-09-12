import { http, HttpResponse } from 'msw';
import type { ApiErrorResponse } from '../api/types';
import {
  countryList,
  industryList,
  supplierDetail,
  supplierIndustries,
  suppliersPage,
} from './fixtures';

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
    const industry = searchParams.get('industry')?.toLowerCase();
    // Mirrors the backend, which accepts repeated params and comma-separated lists alike.
    const countries = searchParams
      .getAll('country')
      .flatMap((value) => value.split(','))
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean);

    const data = suppliersPage.data
      .filter((supplier) => !search || supplier.name.toLowerCase().includes(search))
      .filter((supplier) => !industry || supplierIndustries[supplier.id] === industry)
      .filter((supplier) => !countries.length || countries.includes(supplier.country));

    return HttpResponse.json({
      data,
      pagination: { ...suppliersPage.pagination, total: data.length },
    });
  }),

  http.get(`${API_BASE}/industries`, () => HttpResponse.json(industryList)),

  http.get(`${API_BASE}/countries`, () => HttpResponse.json(countryList)),

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
