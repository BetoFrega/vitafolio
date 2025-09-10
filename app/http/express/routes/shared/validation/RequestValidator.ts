import { z } from "zod";
import { Result } from "@shared/app/contracts/Result";

/**
 * Standardized validation error for request validation failures
 * Preserves rich Zod error details for better debugging and user feedback
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: z.ZodIssue[],
    public readonly fieldErrors: Record<string, string[]>,
    public readonly formErrors: string[],
  ) {
    super(message);
    this.name = "ValidationError";
  }

  /**
   * Get field-specific error messages
   * Useful for returning structured validation errors to clients
   */
  getFieldErrors(): Record<string, string[]> {
    return this.fieldErrors;
  }

  /**
   * Get form-level error messages
   */
  getFormErrors(): string[] {
    return this.formErrors;
  }
}

/**
 * Request validator utility for standardizing validation across all route handlers
 *
 * Provides type-safe validation using Zod schemas with automatic type inference.
 * The validated data is automatically typed based on the schema, eliminating manual typecasting.
 */
export class RequestValidator {
  /**
   * Generic validation method for any data against a Zod schema
   *
   * @param schema - Zod schema to validate against
   * @param data - Data to validate
   * @returns Result with validated data (auto-typed from schema) or ValidationError with rich details
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): Result<T> {
    const result = schema.safeParse(data);

    if (!result.success) {
      const errorMessage = `Request validation failed: ${result.error.message}`;
      const flattened = result.error.flatten();

      // Convert optional properties to required by filtering out undefined values
      const fieldErrors: Record<string, string[]> = {};
      Object.entries(flattened.fieldErrors).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          fieldErrors[key] = value;
        }
      });

      return Result.failure<T>(
        new ValidationError(
          errorMessage,
          result.error.issues,
          fieldErrors,
          flattened.formErrors,
        ),
      );
    }

    return Result.success(result.data);
  }

  /**
   * Validate request body using a Zod schema
   *
   * @param schema - Zod schema for the expected body structure
   * @param req - Express request object (or object with body property)
   * @returns Result with validated body data (auto-typed from schema) or ValidationError
   *
   * @example
   * const schema = z.object({ name: z.string(), age: z.number() });
   * const result = RequestValidator.validateBody(schema, req);
   * if (result.isSuccess()) {
   *   const data = result.getValue(); // TypeScript knows this is { name: string, age: number }
   *   console.log(data.name); // No typecasting needed!
   * }
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
   * @param req - Express request object (or object with params property)
   * @returns Result with validated params data (auto-typed from schema) or ValidationError
   *
   * @example
   * const schema = z.object({ id: z.string().uuid() });
   * const result = RequestValidator.validateParams(schema, req);
   * if (result.isSuccess()) {
   *   const { id } = result.getValue(); // TypeScript knows id is string
   * }
   */
  static validateParams<T>(
    schema: z.ZodSchema<T>,
    req: { params?: Record<string, string | string[]> },
  ): Result<T> {
    return this.validate(schema, req.params);
  }

  /**
   * Validate request query parameters using a Zod schema
   *
   * Particularly useful for query params that need transformation (e.g., string to number)
   *
   * @param schema - Zod schema for the expected query structure
   * @param req - Express request object (or object with query property)
   * @returns Result with validated and transformed query data (auto-typed from schema) or ValidationError
   *
   * @example
   * const schema = z.object({
   *   page: z.string().transform(Number).pipe(z.number().min(1)),
   *   search: z.string().optional()
   * });
   * const result = RequestValidator.validateQuery(schema, req);
   * if (result.isSuccess()) {
   *   const { page, search } = result.getValue(); // page is number, search is string | undefined
   * }
   */
  static validateQuery<T>(
    schema: z.ZodSchema<T>,
    req: { query?: Record<string, string | string[] | undefined> },
  ): Result<T> {
    return this.validate(schema, req.query);
  }
}
