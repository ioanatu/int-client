/** Formatting helpers shared by the list and detail views. */

const LOCALE = 'en-GB'

export const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString(LOCALE, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
}

export const formatNumber = (value: number | null | undefined): string =>
  value === null || value === undefined ? '—' : value.toLocaleString(LOCALE)

export const formatCurrency = (amount: number, currency: string): string =>
  new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)

/** `in_progress` -> `In progress`, for the enum values the API returns. */
export const humanizeEnum = (value: string): string => {
  const spaced = value.replaceAll('_', ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
