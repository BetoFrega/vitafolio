import type { Request, Response } from "express";
import type { ApiError, SuccessResponse, ErrorResponse } from "../responses";

/**
 * Abstract base handler class for standardized request handling
 *
 * All route handlers should extend this class to ensure consistent
 * response formats across the application.
 *
 * @template T - The type of data returned in success responses
 */
export abstract class BaseHandler<T = unknown> {
  /**
   * Abstract method that must be implemented by concrete handlers
   */
  abstract handle(req: Request, res: Response): Promise<void>;

  /**
   * Send a standardized success response
   */
  protected sendSuccess(res: Response, data: T, status = 200): void {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
    res.status(status).json(response);
  }
  /**
   * Send a standardized error response
   */
  protected sendError(res: Response, error: ApiError, status = 400): void {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    };
    res.status(status).json(response);
  }
}
