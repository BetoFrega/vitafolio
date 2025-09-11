import { z } from "zod";

/**
 * Common validation schemas for use across route handlers
 *
 * These schemas provide reusable validation patterns for truly generic request structures.
 * Route-specific schemas should be defined alongside their respective routes.
 */

/**
 * Basic pagination query parameters schema
 * Transforms string values to numbers and applies sensible defaults
 */
export const PaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform(Number)
    .pipe(z.number().min(1)),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform(Number)
    .pipe(z.number().min(1).max(100)),
});

/**
 * Common ID parameter schema for UUID-based resources
 */
export const UuidParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Common slug parameter schema for slug-based resources
 */
export const SlugParamSchema = z.object({
  slug: z.string().min(1).max(100),
});

/**
 * Re-export for convenience
 */
export {
  PaginationSchema as Pagination,
  UuidParamSchema as UuidParam,
  SlugParamSchema as SlugParam,
};
