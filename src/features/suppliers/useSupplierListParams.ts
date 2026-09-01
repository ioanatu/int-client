import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ASSESSMENT_STATUSES,
  RELATIONSHIP_STATUSES,
  RISK_LEVELS,
  type AssessmentStatus,
  type ListSuppliersQuery,
  type RelationshipStatus,
  type RiskLevel,
} from '../../api/types'

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50]

/** Only accepts values the generated union allows, so a hand-edited URL cannot 400 the API. */
const parseEnum = <T extends string>(value: string | null, allowed: readonly T[]): T | undefined =>
  allowed.includes(value as T) ? (value as T) : undefined

const parsePositiveInt = (value: string | null, fallback: number): number => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export interface SupplierListParams {
  /** Ready to hand straight to `useListSuppliersQuery`. */
  query: ListSuppliersQuery
  setFilter: (key: keyof ListSuppliersQuery, value: string | undefined) => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  clearFilters: () => void
  hasFilters: boolean
}

/**
 * Keeps the list's filters and pagination in the URL rather than in component state, so a
 * filtered view can be linked, bookmarked and restored by the browser's back button — and
 * so RTK Query caches one entry per distinct URL.
 */
export const useSupplierListParams = (): SupplierListParams => {
  const [searchParams, setSearchParams] = useSearchParams()

  const query = useMemo<ListSuppliersQuery>(() => {
    const search = searchParams.get('search')?.trim()
    const country = searchParams.get('country')?.trim().toUpperCase()

    return {
      search: search || undefined,
      country: country && country.length === 2 ? country : undefined,
      status: parseEnum<RelationshipStatus>(searchParams.get('status'), RELATIONSHIP_STATUSES),
      riskLevel: parseEnum<RiskLevel>(searchParams.get('riskLevel'), RISK_LEVELS),
      assessmentStatus: parseEnum<AssessmentStatus>(
        searchParams.get('assessmentStatus'),
        ASSESSMENT_STATUSES,
      ),
      page: parsePositiveInt(searchParams.get('page'), 1),
      limit: parsePositiveInt(searchParams.get('limit'), DEFAULT_PAGE_SIZE),
    }
  }, [searchParams])

  const update = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          mutate(next)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setFilter = useCallback(
    (key: keyof ListSuppliersQuery, value: string | undefined) => {
      update((params) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
        // Any filter change invalidates the current offset.
        params.delete('page')
      })
    },
    [update],
  )

  const setPage = useCallback(
    (page: number) => {
      update((params) => {
        if (page <= 1) {
          params.delete('page')
        } else {
          params.set('page', String(page))
        }
      })
    },
    [update],
  )

  const setLimit = useCallback(
    (limit: number) => {
      update((params) => {
        params.set('limit', String(limit))
        params.delete('page')
      })
    },
    [update],
  )

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  const hasFilters = Boolean(
    query.search || query.country || query.status || query.riskLevel || query.assessmentStatus,
  )

  return { query, setFilter, setPage, setLimit, clearFilters, hasFilters }
}
