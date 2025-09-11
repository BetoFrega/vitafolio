import type { Response } from "express";
import { z } from "zod";
import {
  AuthenticatedHandler,
  type AuthenticatedRequest,
} from "../../shared/handlers/AuthenticatedHandler";
import { RequestValidator } from "../../shared/validation/RequestValidator";
import type {
  DeleteCollection,
  Input as DeleteCollectionInput,
} from "@collections/app/DeleteCollection";

/**
 * Delete collection request params schema for validation
 */
const DeleteCollectionParamsSchema = z.object({
  id: z.string().uuid("Collection ID must be a valid UUID"),
});

/**
 * Delete collection dependencies interface
 */
interface DeleteCollectionDeps {
  deleteCollection: DeleteCollection;
}

/**
 * Delete collection handler implementing the new standardized response format
 *
 * Handles collection deletions for authenticated users.
 * Returns 204 No Content for successful deletions, or standardized error responses.
 */
export class DeleteCollectionHandler extends AuthenticatedHandler<void> {
  constructor(private deps: DeleteCollectionDeps) {
    super();
  }

  /**
   * Handle authenticated collection deletion request
   */
  protected async handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void> {
    try {
      // Validate request parameters
      const paramsResult = RequestValidator.validateParams(
        DeleteCollectionParamsSchema,
        req,
      );
      if (!paramsResult.isSuccess()) {
        return this.sendError(
          res,
          {
            code: "VALIDATION_ERROR",
            message: paramsResult.getError().message,
          },
          400,
        );
      }

      const { id: collectionId } = paramsResult.getValue();

      // Execute use case
      const result = await this.deps.deleteCollection.execute({
        collectionId,
        ownerId: userId,
      } as DeleteCollectionInput);

      // Handle use case result
      if (result.isSuccess()) {
        // Return 204 No Content for successful deletion
        return res.status(204).send();
      } else {
        const errorMessage = result.getError().message;
        // Check if it's a not found error
        if (errorMessage.includes("not found")) {
          return this.sendError(
            res,
            {
              code: "NOT_FOUND",
              message: errorMessage,
            },
            404,
          );
        }
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
      console.error("DeleteCollectionHandler: Unexpected error:", error);
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