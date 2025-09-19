import type { Response } from "express";
import {
  AuthenticatedHandler,
  type AuthenticatedRequest,
} from "../../../shared/handlers/AuthenticatedHandler";
import type { DeleteItem } from "@collections/app/DeleteItem";

/**
 * Delete item dependencies interface
 */
interface DeleteItemDeps {
  deleteItem: Pick<DeleteItem, "execute">;
}

/**
 * Delete item handler implementing the new standardized response format
 *
 * Handles item deletion for authenticated users.
 * Returns 204 No Content on successful deletion.
 */
export class DeleteItemHandler extends AuthenticatedHandler<void> {
  constructor(private deps: DeleteItemDeps) {
    super();
  }

  /**
   * Handle authenticated item deletion request
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
      const result = await this.deps.deleteItem.execute({
        itemId,
        ownerId: userId,
      });

      // Handle use case result
      if (result.isSuccess()) {
        // Return 204 No Content for successful deletion
        res.status(204).send();
        return;
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
      console.error("DeleteItemHandler: Unexpected error:", error);
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
