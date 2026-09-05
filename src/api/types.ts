/**
 * Aliases using the types generated from the backend's OpenAPI document.
 *
 * Nothing in the app should reach into `schema.d.ts` directly: every contract the client
 * depends on is named here, so a backend change surfaces as a type error in one file.
 */
import type { components, operations } from './schema';

export type SupplierListItem = components['schemas']['SupplierListItemDto'];
export type SupplierDetail = components['schemas']['SupplierDetailDto'];
export type PaginatedSuppliers = components['schemas']['PaginatedSuppliersDto'];
export type PaginationMeta = components['schemas']['PaginationMetaDto'];
export type ApiErrorResponse = components['schemas']['ErrorResponseDto'];
export type Industry = components['schemas']['IndustryDto'];
export type IndustryList = components['schemas']['IndustryListDto'];

/** Query string accepted by `GET /api/v1/suppliers`. */
export type ListSuppliersQuery = NonNullable<
  operations['SuppliersController_findAll_v1']['parameters']['query']
>;

export type Search = ListSuppliersQuery['search'];

export type RelationshipStatus = SupplierListItem['status'];
export type RiskLevel = SupplierListItem['risk']['level'];
export type AssessmentStatus = NonNullable<ListSuppliersQuery['assessmentStatus']>;

// `satisfies` keeps these in sync with the generated unions: dropping or renaming a value
// on the backend turns the corresponding entry below into a compile error.
export const RELATIONSHIP_STATUSES = [
  'active',
  'inactive',
  'onboarding',
  'offboarded',
] as const satisfies readonly RelationshipStatus[];

export const RISK_LEVELS = ['low', 'medium', 'high'] as const satisfies readonly RiskLevel[];

export const ASSESSMENT_STATUSES = [
  'completed',
  'in_progress',
  'not_started',
  'expired',
] as const satisfies readonly AssessmentStatus[];
