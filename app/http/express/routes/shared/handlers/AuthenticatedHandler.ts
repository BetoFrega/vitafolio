import type { Request, Response } from "express";
import { BaseHandler } from "./BaseHandler";

/**
 * AuthenticatedRequest interface matching the one used in authentication middleware
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Abstract authenticated handler extending BaseHandler with automatic user authentication
 *
 * This handler automatically checks for user authentication and extracts the user ID.
 * If authentication fails, it returns a standardized unauthorized response.
 * If authentication succeeds, it delegates to the handleAuthenticated method.
 *
 * All protected route handlers should extend this class.
 */
export abstract class AuthenticatedHandler<T = unknown> extends BaseHandler<T> {
  /**
   * Main handler method that performs authentication check and delegates to handleAuthenticated
   */
  async handle(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.extractUserId(req);
    if (!userId) {
      return this.sendUnauthorizedError(res);
    }

    return this.handleAuthenticated(req, res, userId);
  }

  /**
   * Abstract method that must be implemented by concrete authenticated handlers
   * This method is only called when the user is properly authenticated
   */
  protected abstract handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void>;

  /**
   * Extract user ID from the authenticated request
   * Returns null if user is not authenticated or user ID is missing/invalid
   */
  private extractUserId(req: AuthenticatedRequest): string | null {
    const userId = req.user?.id;
    return userId && userId.trim() !== "" ? userId : null;
  }

  /**
   * Send standardized unauthorized error response
   */
  private sendUnauthorizedError(res: Response): void {
    this.sendError(
      res,
      {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
      401,
    );
  }
}
