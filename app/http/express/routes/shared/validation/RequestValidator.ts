import { z } from "zod";
import { Result } from "@shared/app/contracts/Result";

/**
 * Standardized validation error for request validation failures
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Request validator utility for standardizing validation across all route handlers
 *
 * Provides type-safe validation using Zod schemas with Result pattern error handling.
 * This ensures consistent validation behavior and error responses throughout the API.
 */
export class RequestValidator {
  /**
   * Generic validation method for any data against a Zod schema
   *
   * @param schema - Zod schema to validate against
   * @param data - Data to validate
   * @returns Result with validated data or ValidationError
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): Result<T> {
    const result = schema.safeParse(data);

    if (!result.success) {
      const errorMessage = `Request validation failed: ${result.error.message}`;
      return Result.failure<T>(new ValidationError(errorMessage));
    }

    return Result.success(result.data);
  }

  /**
   * Validate request body using a Zod schema
   *
   * @param schema - Zod schema for the expected body structure
   * @param req - Express request object
   * @returns Result with validated body data or ValidationError
   */
  static validateBody<T>(
    schema: z.ZodSchema<T>,
    req: { body?: unknown },
  ): Result<T> {
    return this.validate(schema, req.body);
  }

  /**
   * Validate request parameters using a Zod schema
   *
   * @param schema - Zod schema for the expected params structure
   * @param req - Express request object
   * @returns Result with validated params data or ValidationError
   */
  static validateParams<T>(
    schema: z.ZodSchema<T>,
    req: { params?: Record<string, string> },
  ): Result<T> {
    return this.validate(schema, req.params);
  }

  /**
   * Validate request query parameters using a Zod schema
   *
   * Particularly useful for query params that need transformation (e.g., string to number)
   *
   * @param schema - Zod schema for the expected query structure
   * @param req - Express request object
   * @returns Result with validated and transformed query data or ValidationError
   */
  static validateQuery<T>(
    schema: z.ZodSchema<T>,
    req: { query?: Record<string, string> },
  ): Result<T> {
    return this.validate(schema, req.query);
  }
}
