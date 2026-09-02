import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { ApiErrorResponse } from './types';

type QueryError = FetchBaseQueryError | SerializedError | undefined;

const isFetchBaseQueryError = (error: NonNullable<QueryError>): error is FetchBaseQueryError =>
  'status' in error;

const isApiErrorResponse = (data: unknown): data is ApiErrorResponse =>
  typeof data === 'object' && data !== null && 'message' in data;

/** HTTP status behind a query error, when the failure got far enough to have one. */
export const getErrorStatus = (error: QueryError): number | undefined => {
  if (!error || !isFetchBaseQueryError(error) || typeof error.status !== 'number') {
    return undefined;
  }
  return error.status;
};

/**
 * Turns any RTK Query failure into a sentence worth showing a user, preferring the
 * backend's own error envelope over the transport-level description.
 */
export const getErrorMessage = (error: QueryError): string => {
  if (!error) {
    return 'Something went wrong.';
  }

  if (!isFetchBaseQueryError(error)) {
    return error.message ?? 'Something went wrong.';
  }

  if (isApiErrorResponse(error.data)) {
    const { message } = error.data;
    return Array.isArray(message) ? message.join(' ') : message;
  }

  switch (error.status) {
    case 'FETCH_ERROR':
      return 'Could not reach the server. Check that the API is running and try again.';
    case 'PARSING_ERROR':
      return 'The server returned a response the client could not read.';
    case 'TIMEOUT_ERROR':
      return 'The server took too long to respond.';
    default:
      return `Request failed with status ${error.status}.`;
  }
};
