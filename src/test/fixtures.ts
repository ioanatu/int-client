import type {
  IndustryList,
  PaginatedSuppliers,
  SupplierDetail,
  SupplierListItem,
} from '../api/types';

// Typing the fixtures with the generated contracts means a backend schema change breaks
// the tests at compile time rather than silently drifting from reality.
export const supplierListItem: SupplierListItem = {
  id: 'sup_001',
  name: 'Acme Components GmbH',
  country: 'DE',
  status: 'active',
  risk: { level: 'high', score: 82 },
};

export const secondSupplierListItem: SupplierListItem = {
  id: 'sup_002',
  name: 'Northwind Logistics AB',
  country: 'SE',
  status: 'onboarding',
  risk: { level: 'low', score: 21 },
};

export const suppliersPage: PaginatedSuppliers = {
  data: [supplierListItem, secondSupplierListItem],
  pagination: { page: 1, limit: 10, total: 2, hasNext: false },
};

export const industryList: IndustryList = {
  data: [
    { id: 'food-beverage', name: 'Food & Beverage', supplierCount: 1 },
    { id: 'manufacturing', name: 'Manufacturing', supplierCount: 1 },
  ],
  total: 2,
};

export const supplierIndustries: Record<string, string> = {
  sup_001: 'manufacturing',
  sup_002: 'food-beverage',
};

export const supplierDetail: SupplierDetail = {
  id: 'sup_001',
  identity: {
    name: 'Acme Components GmbH',
    legalName: 'Acme Components Gesellschaft mit beschränkter Haftung',
    identifiers: { vatNumber: 'DE123456789', lei: '529900EXAMPLE123456', duns: '123456789' },
  },
  address: {
    street: 'Hauptstraße 123',
    city: 'Munich',
    postalCode: '80331',
    country: { code: 'DE', name: 'Germany' },
  },
  contact: {
    email: 'contact@acme-components.example',
    phone: '+49 89 123456',
    website: 'https://acme-components.example',
  },
  company: { industry: 'Manufacturing', employeeCount: 250, foundedYear: 1998 },
  relationship: {
    status: 'active',
    tier: 1,
    since: '2024-01-01',
    procurement: {
      category: 'Raw Materials',
      annualSpend: { amount: 1250000, currency: 'EUR' },
    },
  },
  risk: { score: 82, level: 'high', lastCalculatedAt: '2026-08-30T14:00:00Z' },
  assessment: {
    status: 'completed',
    score: 84,
    lastCompletedAt: '2026-07-12T09:30:00Z',
    expiresAt: '2027-07-12T00:00:00Z',
  },
  documents: { total: 12, valid: 10, expiringSoon: 2, expired: 0 },
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2026-08-30T14:00:00Z',
};
