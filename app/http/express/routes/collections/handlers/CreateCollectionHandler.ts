import type { Response } from "express";
import { z } from "zod";
import {
  AuthenticatedHandler,
  type AuthenticatedRequest,
} from "../../shared/handlers/AuthenticatedHandler";
import { RequestValidator } from "../../shared/validation/RequestValidator";
import type {
  CreateCollection,
  Input as CreateCollectionInput,
} from "@collections/app/CreateCollection";

/**
 * Create collection request schema for validation
 */
const CreateCollectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  description: z.string().default(""), // Allow empty description, default to empty string
  metadataSchema: z.object({
    fields: z.record(
      z.string(),
      z.object({
        type: z.enum(["text", "number", "date", "boolean"]),
        required: z.boolean(),
        validation: z
          .object({
            minLength: z.number(),
            maxLength: z.number(),
            minValue: z.number(),
            maxValue: z.number(),
            pattern: z.string(),
          })
          .partial()
          .optional(),
        description: z.string().optional(),
      }),
    ),
  }),
});

/**
 * Create collection response data structure
 * Note: ownerId is not included in the response for security/privacy reasons
 */
interface CreateCollectionResponseData {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create collection dependencies interface
 */
interface CreateCollectionDeps {
  createCollection: CreateCollection;
}

/**
 * Create collection handler implementing the new standardized response format
 *
 * Handles collection creation for authenticated users.
 * Uses the standardized response format: { success: true/false, data: {...}, timestamp: "..." }
 */
export class CreateCollectionHandler extends AuthenticatedHandler<CreateCollectionResponseData> {
  constructor(private deps: CreateCollectionDeps) {
    super();
  }

  /**
   * Handle authenticated collection creation request
   */
  protected async handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void> {
    try {
      // Validate request body
      const validationResult = RequestValidator.validateBody(
        CreateCollectionSchema,
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

      const { name, description, metadataSchema } = validationResult.getValue();

      // Execute use case
      const result = await this.deps.createCollection.execute({
        name,
        description,
        ownerId: userId,
        metadataSchema:
          metadataSchema as CreateCollectionInput["metadataSchema"], // Type assertion to match use case input
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
        };
        return this.sendSuccess(res, responseData, 201);
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
      console.error("CreateCollectionHandler: Unexpected error:", error);
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
