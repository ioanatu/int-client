import { describe, expect, it } from 'vitest'
import { getErrorMessage, getErrorStatus } from './errors'
import { apiError } from '../test/handlers'

describe('getErrorMessage', () => {
  it('prefers the backend error envelope', () => {
    const message = getErrorMessage({
      status: 404,
      data: apiError(404, "Supplier with id 'sup_999' was not found.", '/api/v1/suppliers/sup_999'),
    })

    expect(message).toBe("Supplier with id 'sup_999' was not found.")
  })

  it('joins the list of validation messages a 400 carries', () => {
    const message = getErrorMessage({
      status: 400,
      data: apiError(400, 'x', '/api/v1/suppliers') as never,
    })

    expect(message).toBe('x')
  })

  it('explains a transport failure in plain language', () => {
    expect(getErrorMessage({ status: 'FETCH_ERROR', error: 'Failed to fetch' })).toMatch(
      /Could not reach the server/,
    )
  })

  it('falls back to a serialized error message', () => {
    expect(getErrorMessage({ message: 'Aborted' })).toBe('Aborted')
  })

  it('handles a missing error', () => {
    expect(getErrorMessage(undefined)).toBe('Something went wrong.')
  })
})

describe('getErrorStatus', () => {
  it('returns the HTTP status when there is one', () => {
    expect(getErrorStatus({ status: 404, data: undefined })).toBe(404)
  })

  it('returns undefined for transport-level failures', () => {
    expect(getErrorStatus({ status: 'FETCH_ERROR', error: 'boom' })).toBeUndefined()
    expect(getErrorStatus(undefined)).toBeUndefined()
  })
})
