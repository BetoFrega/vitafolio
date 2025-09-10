/**
 * Standardized API response type definitions
 *
 * The actual response creation logic is implemented in BaseHandler methods.
 */

export interface ApiError {
  code: string;
  message: string;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: ApiError;
  timestamp: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
