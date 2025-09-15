import type { Response } from "express";
import {
  AuthenticatedHandler,
  type AuthenticatedRequest,
} from "../../../shared/handlers/AuthenticatedHandler";
import type { GetItem } from "@collections/app/GetItem";

/**
 * Get item response data structure
 */
interface GetItemResponseData {
  id: string;
  name: string;
  collectionId: string;
  metadata: Record<string, string | number | Date | boolean>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get item dependencies interface
 */
interface GetItemDeps {
  getItem: Pick<GetItem, "execute">;
}

/**
 * Get item handler implementing the new standardized response format
 *
 * Handles item retrieval for authenticated users.
 * Uses the standardized response format: { success: true/false, data: {...}, timestamp: "..." }
 */
export class GetItemHandler extends AuthenticatedHandler<GetItemResponseData> {
  constructor(private deps: GetItemDeps) {
    super();
  }

  /**
   * Handle authenticated item retrieval request
   */
  protected async handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void> {
    try {
      // Validate item ID from params
      const itemId = req.params?.id;
      if (!itemId) {
        return this.sendError(
          res,
          {
            code: "VALIDATION_ERROR",
            message: "Item ID is required",
          },
          400,
        );
      }

      // Execute use case
      const result = await this.deps.getItem.execute({
        itemId,
        ownerId: userId,
      });

      // Handle use case result
      if (result.isSuccess()) {
        const itemData = result.getValue();
        // Format response data with ISO string dates
        const responseData: GetItemResponseData = {
          id: itemData.id,
          name: itemData.name,
          collectionId: itemData.collectionId,
          metadata: itemData.metadata,
          createdAt: itemData.createdAt.toISOString(),
          updatedAt: itemData.updatedAt.toISOString(),
        };
        return this.sendSuccess(res, responseData, 200);
      } else {
        const errorMessage = result.getError().message;
        // Check if it's a not found error
        if (errorMessage.toLowerCase().includes("not found")) {
          return this.sendError(
            res,
            {
              code: "NOT_FOUND",
              message: errorMessage,
            },
            404,
          );
        }
        // Other use case errors
        return this.sendError(
          res,
          {
            code: "USE_CASE_ERROR",
            message: errorMessage,
          },
          400,
        );
      }
    } catch (error) {
      // Handle unexpected errors
      console.error("GetItemHandler: Unexpected error:", error);
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