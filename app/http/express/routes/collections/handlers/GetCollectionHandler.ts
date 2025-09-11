import type { Response } from "express";
import { z } from "zod";
import {
  AuthenticatedHandler,
  type AuthenticatedRequest,
} from "../../shared/handlers/AuthenticatedHandler";
import { RequestValidator } from "../../shared/validation/RequestValidator";
import type { GetCollection } from "@collections/app/GetCollection";
import type { ValidationRules } from "@collections/domain/value-objects/MetadataSchema";

/**
 * Get collection params schema for validation
 */
const GetCollectionParamsSchema = z.object({
  id: z.string().uuid("Collection ID must be a valid UUID"),
});

/**
 * Get collection response data structure
 * Note: ownerId is not included in the response for security/privacy reasons
 */
interface GetCollectionResponseData {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  metadataSchema: {
    fields: Record<
      string,
      {
        type: string;
        required: boolean;
        validation?: ValidationRules;
        description?: string;
      }
    >;
    requiredFields: string[];
    version: number;
    lastModified: Date;
  };
}

/**
 * Get collection dependencies interface
 */
interface GetCollectionDeps {
  getCollection: GetCollection;
}

/**
 * Get collection handler implementing the new standardized response format
 *
 * Handles collection retrieval for authenticated users.
 * Uses the standardized response format: { success: true/false, data: {...}, timestamp: "..." }
 */
export class GetCollectionHandler extends AuthenticatedHandler<GetCollectionResponseData> {
  constructor(private deps: GetCollectionDeps) {
    super();
  }

  /**
   * Handle authenticated collection retrieval request
   */
  protected async handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void> {
    try {
      // Validate request params
      const validationResult = RequestValidator.validateParams(
        GetCollectionParamsSchema,
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

      const { id } = validationResult.getValue();

      // Execute use case
      const result = await this.deps.getCollection.execute({
        collectionId: id,
        ownerId: userId,
      });

      // Handle use case result
      if (result.isSuccess()) {
        const collectionData = result.getValue();
        // Return response without ownerId for security/privacy
        const responseData = {
          id: collectionData.id,
          name: collectionData.name,
          description: collectionData.description,
          createdAt: collectionData.createdAt,
          updatedAt: collectionData.updatedAt,
          metadataSchema: collectionData.metadataSchema,
        };
        return this.sendSuccess(res, responseData, 200);
      } else {
        // Check if it's a "not found" error
        const errorMessage = result.getError().message;
        if (errorMessage.includes("Collection not found")) {
          return this.sendError(
            res,
            {
              code: "NOT_FOUND",
              message: errorMessage,
            },
            404,
          );
        } else {
          return this.sendError(
            res,
            {
              code: "USE_CASE_ERROR",
              message: errorMessage,
            },
            400,
          );
        }
      }
    } catch (error) {
      // Handle unexpected errors
      console.error("GetCollectionHandler: Unexpected error:", error);
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
