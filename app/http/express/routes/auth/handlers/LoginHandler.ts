import type { Request, Response } from "express";
import { z } from "zod";
import { BaseHandler } from "../../shared/handlers/BaseHandler";
import { RequestValidator } from "../../shared/validation/RequestValidator";
import type { LoginDeps } from "app/ports/Deps";

/**
 * Login request schema for validation
 */
const LoginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Login response data structure
 */
interface LoginResponseData {
  token: string;
}

/**
 * Login handler implementing the new standardized response format
 *
 * Handles user authentication and returns a JWT token for successful logins.
 * Uses the standardized response format: { success: true/false, data: {...}, timestamp: "..." }
 */
export class LoginHandler extends BaseHandler<LoginResponseData> {
  constructor(private deps: LoginDeps) {
    super();
  }

  async handle(req: Request, res: Response): Promise<void> {
    // Validate request body
    const validationResult = RequestValidator.validateBody(LoginSchema, req);
    if (validationResult.isFailure()) {
      return this.sendError(
        res,
        {
          code: "VALIDATION_ERROR",
          message: validationResult.getError().message,
        },
        400,
      );
    }

    const { email, password } = validationResult.getValue();

    try {
      // Execute login use case
      const loginResult = await this.deps.login.execute({ email, password });

      if (loginResult.isSuccess()) {
        const { accessToken } = loginResult.getValue();

        // Return success response with token in the expected format
        this.sendSuccess(
          res,
          {
            token: accessToken,
          },
          200,
        );
      } else {
        // Authentication failed
        this.sendError(
          res,
          {
            code: "AUTHENTICATION_FAILED",
            message: loginResult.getError().message,
          },
          401,
        );
      }
    } catch {
      // Unexpected error
      this.sendError(
        res,
        {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred during login",
        },
        500,
      );
    }
  }
}
