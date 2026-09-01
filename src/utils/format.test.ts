import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, formatNumber, humanizeEnum } from './format'

describe('formatters', () => {
  it('renders an em dash for missing values', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatNumber(null)).toBe('—')
  })

  it('renders an em dash for an unparseable date', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })

  it('formats an ISO date', () => {
    expect(formatDate('2024-01-01')).toBe('01 Jan 2024')
  })

  it('formats currency with its ISO code', () => {
    expect(formatCurrency(1250000, 'EUR')).toContain('1,250,000')
  })

  it('humanizes the snake_case enums the API returns', () => {
    expect(humanizeEnum('in_progress')).toBe('In progress')
    expect(humanizeEnum('high')).toBe('High')
  })
})
