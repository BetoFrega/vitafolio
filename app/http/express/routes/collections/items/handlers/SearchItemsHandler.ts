import type { Response } from "express";
import { z } from "zod";
import {
  AuthenticatedHandler,
  type AuthenticatedRequest,
} from "../../../shared/handlers/AuthenticatedHandler";
import { RequestValidator } from "../../../shared/validation/RequestValidator";
import type { SearchItems } from "@collections/app/SearchItems";

/**
 * Search items query schema for validation
 */
const SearchItemsQuerySchema = z.object({
  query: z.string().optional(),
  collectionId: z.string().optional(),
  metadata: z.string().optional(), // JSON string that will be parsed
  limit: z
    .string()
    .optional()
    .refine((val) => val === undefined || !isNaN(Number(val)), {
      message: "limit must be a valid number",
    }),
  offset: z
    .string()
    .optional()
    .refine((val) => val === undefined || !isNaN(Number(val)), {
      message: "offset must be a valid number",
    }),
});

/**
 * Search items response item structure
 */
interface SearchItemsResponseItem {
  id: string;
  name: string;
  collectionId: string;
  metadata: Record<string, string | number | Date | boolean>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Search items response data structure
 */
interface SearchItemsResponseData {
  items: SearchItemsResponseItem[];
  total: number;
}

/**
 * Search items dependencies interface
 */
interface SearchItemsDeps {
  searchItems: SearchItems;
}

/**
 * Search items handler implementing the new standardized response format
 *
 * Handles item search functionality for authenticated users.
 * Uses the standardized response format: { success: true/false, data: {...}, timestamp: "..." }
 */
export class SearchItemsHandler extends AuthenticatedHandler<SearchItemsResponseData> {
  constructor(private deps: SearchItemsDeps) {
    super();
  }

  /**
   * Handle authenticated item search request
   */
  protected async handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void> {
    try {
      // Validate query parameters
      const validationResult = RequestValidator.validateQuery(
        SearchItemsQuerySchema,
        req,
      );
      if (!validationResult.isSuccess()) {
        return this.sendError(
          res,
          {
            code: "VALIDATION_ERROR",
            message: validationResult.getError().message,
          },
          400,
        );
      }

      const { query, collectionId, metadata, limit, offset } =
        validationResult.getValue();

      // Build search input object
      const searchInput: Parameters<typeof this.deps.searchItems.execute>[0] = {
        ownerId: userId,
      };

      if (query) searchInput.query = query;
      if (collectionId) searchInput.collectionId = collectionId;
      if (limit) searchInput.limit = parseInt(limit, 10);
      if (offset) searchInput.offset = parseInt(offset, 10);

      // Handle metadata JSON parsing
      if (metadata) {
        try {
          searchInput.metadata = JSON.parse(metadata);
        } catch (error) {
          return this.sendError(
            res,
            {
              code: "VALIDATION_ERROR",
              message: "metadata must be valid JSON",
            },
            400,
          );
        }
      }

      // Execute use case
      const result = await this.deps.searchItems.execute(searchInput);

      // Handle use case result
      if (result.isSuccess()) {
        const searchData = result.getValue();
        // Format response data with ISO string dates
        const responseData: SearchItemsResponseData = {
          items: searchData.items.map((item) => ({
            id: item.id,
            name: item.name,
            collectionId: item.collectionId,
            metadata: item.metadata,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
          })),
          total: searchData.total,
        };
        return this.sendSuccess(res, responseData, 200);
      } else {
        return this.sendError(
          res,
          {
            code: "USE_CASE_ERROR",
            message: result.getError().message,
          },
          400,
        );
      }
    } catch (error) {
      // Handle unexpected errors
      console.error("SearchItemsHandler: Unexpected error:", error);
      return this.sendError(
        res,
        {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
        500,
      );
    }
  }
}