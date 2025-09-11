import type { Request, Response } from "express";
import { z } from "zod";
import { BaseHandler } from "../../shared/handlers/BaseHandler";
import { RequestValidator } from "../../shared/validation/RequestValidator";
import type { RegisterAccountDeps } from "app/ports/Deps";

/**
 * Registration request schema for validation
 */
const RegisterSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

/**
 * Registration response data structure
 */
interface RegisterResponseData {
  message: string;
}

/**
 * Register handler implementing the new standardized response format
 *
 * Handles user account registration and returns a success message.
 * Uses the standardized response format: { success: true/false, data: {...}, timestamp: "..." }
 */
export class RegisterHandler extends BaseHandler<RegisterResponseData> {
  constructor(private deps: RegisterAccountDeps) {
    super();
  }

  async handle(req: Request, res: Response): Promise<void> {
    // Validate request body
    const validationResult = RequestValidator.validateBody(RegisterSchema, req);
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
      // Execute register account use case
      const registerResult = await this.deps.registerAccount.execute({
        email,
        password,
      });

      if (registerResult.isSuccess()) {
        // Return success response
        this.sendSuccess(
          res,
          {
            message: "Account registered successfully",
          },
          201,
        );
      } else {
        // Registration failed - determine error type
        const errorMessage = registerResult.getError().message;

        if (errorMessage.includes("already exists")) {
          // User already exists (conflict)
          this.sendError(
            res,
            {
              code: "USER_ALREADY_EXISTS",
              message: errorMessage,
            },
            409,
          );
        } else {
          // Other registration errors
          this.sendError(
            res,
            {
              code: "REGISTRATION_FAILED",
              message: errorMessage,
            },
            400,
          );
        }
      }
    } catch {
      // Unexpected error
      this.sendError(
        res,
        {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred during registration",
        },
        500,
      );
    }
  }
}
