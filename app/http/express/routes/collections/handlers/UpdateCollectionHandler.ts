import type { Response } from "express";
import { z } from "zod";
import {
  AuthenticatedHandler,
  type AuthenticatedRequest,
} from "../../shared/handlers/AuthenticatedHandler";
import { RequestValidator } from "../../shared/validation/RequestValidator";
import type {
  UpdateCollection,
  Input as UpdateCollectionInput,
} from "@collections/app/UpdateCollection";

/**
 * Update collection request body schema for validation
 */
const UpdateCollectionBodySchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  description: z.string().default(""), // Allow empty description, default to empty string
});

/**
 * Update collection request params schema for validation
 */
const UpdateCollectionParamsSchema = z.object({
  id: z.string().uuid("Collection ID must be a valid UUID"),
});

/**
 * Update collection response data structure
 * Note: ownerId is not included in the response for security/privacy reasons
 */
interface UpdateCollectionResponseData {
  id: string;
  name: string;
  description: string;
  updatedAt: Date;
}

/**
 * Update collection dependencies interface
 */
interface UpdateCollectionDeps {
  updateCollection: UpdateCollection;
}

/**
 * Update collection handler implementing the new standardized response format
 *
 * Handles collection updates for authenticated users.
 * Uses the standardized response format: { success: true/false, data: {...}, timestamp: "..." }
 */
export class UpdateCollectionHandler extends AuthenticatedHandler<UpdateCollectionResponseData> {
  constructor(private deps: UpdateCollectionDeps) {
    super();
  }

  /**
   * Handle authenticated collection update request
   */
  protected async handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void> {
    try {
      // Validate request parameters
      const paramsResult = RequestValidator.validateParams(
        UpdateCollectionParamsSchema,
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

      // Validate request body
      const bodyResult = RequestValidator.validateBody(
        UpdateCollectionBodySchema,
        req,
      );
      if (!bodyResult.isSuccess()) {
        return this.sendError(
          res,
          {
            code: "VALIDATION_ERROR",
            message: bodyResult.getError().message,
          },
          400,
        );
      }

      const { id: collectionId } = paramsResult.getValue();
      const { name, description } = bodyResult.getValue();

      // Execute use case
      const result = await this.deps.updateCollection.execute({
        collectionId,
        ownerId: userId,
        name,
        description,
      } as UpdateCollectionInput);

      // Handle use case result
      if (result.isSuccess()) {
        const collectionData = result.getValue();
        // Return response without ownerId for security/privacy
        const responseData = {
          id: collectionData.id,
          name: collectionData.name,
          description: collectionData.description,
          updatedAt: collectionData.updatedAt,
        };
        return this.sendSuccess(res, responseData, 200);
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
      console.error("UpdateCollectionHandler: Unexpected error:", error);
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