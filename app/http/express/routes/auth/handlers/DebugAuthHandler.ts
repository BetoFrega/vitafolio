import type { Response } from "express";
import {
  AuthenticatedHandler,
  type AuthenticatedRequest,
} from "../../shared/handlers/AuthenticatedHandler";

/**
 * Debug authentication response data structure
 */
interface DebugAuthResponseData {
  message: string;
  user: {
    id: string;
    email?: string | undefined;
  };
  middlewarePresent: boolean;
}

/**
 * Debug authentication handler implementing the new standardized response format
 *
 * Provides a debug endpoint to verify authentication is working properly.
 * Returns user information and confirms middleware presence.
 * Uses the standardized response format: { success: true/false, data: {...}, timestamp: "..." }
 */
export class DebugAuthHandler extends AuthenticatedHandler<DebugAuthResponseData> {
  protected async handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void> {
    // Return debug information about the authenticated user
    this.sendSuccess(
      res,
      {
        message: "Authentication working",
        user: {
          id: userId,
          email: undefined, // Email not available in token payload - would need database lookup
        },
        middlewarePresent: true,
      },
      200,
    );
  }
}
