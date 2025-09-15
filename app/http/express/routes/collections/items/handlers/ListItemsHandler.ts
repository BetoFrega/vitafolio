import type { Response } from "express";
import {
  AuthenticatedHandler,
  type AuthenticatedRequest,
} from "../../../shared/handlers/AuthenticatedHandler";
import type { ListItems } from "@collections/app/ListItems";

/**
 * List items response item structure
 */
interface ListItemsResponseItem {
  id: string;
  name: string;
  collectionId: string;
  metadata: Record<string, string | number | Date | boolean>;
  createdAt: string;
  updatedAt: string;
}

/**
 * List items response data structure
 */
interface ListItemsResponseData {
  items: ListItemsResponseItem[];
  total: number;
}

/**
 * List items dependencies interface
 */
interface ListItemsDeps {
  listItems: Pick<ListItems, "execute">;
}

/**
 * List items handler implementing the new standardized response format
 *
 * Handles listing items within a collection for authenticated users.
 * Uses the standardized response format: { success: true/false, data: {...}, timestamp: "..." }
 */
export class ListItemsHandler extends AuthenticatedHandler<ListItemsResponseData> {
  constructor(private deps: ListItemsDeps) {
    super();
  }

  /**
   * Handle authenticated items listing request
   */
  protected async handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void> {
    try {
      // Validate collection ID from params
      const collectionId = req.params?.collectionId;
      if (!collectionId) {
        return this.sendError(
          res,
          {
            code: "VALIDATION_ERROR",
            message: "Collection ID is required",
          },
          400,
        );
      }

      // Execute use case
      const result = await this.deps.listItems.execute({
        collectionId,
        ownerId: userId,
      });

      // Handle use case result
      if (result.isSuccess()) {
        const listData = result.getValue();
        // Format response data with ISO string dates
        const responseData: ListItemsResponseData = {
          items: listData.items.map((item) => ({
            id: item.id,
            name: item.name,
            collectionId: item.collectionId,
            metadata: item.metadata,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
          })),
          total: listData.total,
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
      console.error("ListItemsHandler: Unexpected error:", error);
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