import type { Response } from "express";
import { z } from "zod";
import {
  AuthenticatedHandler,
  type AuthenticatedRequest,
} from "../../../shared/handlers/AuthenticatedHandler";
import { RequestValidator } from "../../../shared/validation/RequestValidator";
import type { AddItemToCollection } from "@collections/app/AddItemToCollection";

/**
 * Create item request schema for validation
 */
const CreateItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  metadata: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.date(), z.boolean()]),
  ),
});

/**
 * Create item response data structure
 */
interface CreateItemResponseData {
  id: string;
  name: string;
  collectionId: string;
  metadata: Record<string, string | number | Date | boolean>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create item dependencies interface
 */
interface CreateItemDeps {
  addItemToCollection: Pick<AddItemToCollection, "execute">;
}

/**
 * Create item handler implementing the new standardized response format
 *
 * Handles item creation within a collection for authenticated users.
 * Uses the standardized response format: { success: true/false, data: {...}, timestamp: "..." }
 */
export class CreateItemHandler extends AuthenticatedHandler<CreateItemResponseData> {
  constructor(private deps: CreateItemDeps) {
    super();
  }

  /**
   * Handle authenticated item creation request
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

      // Validate request body
      const validationResult = RequestValidator.validateBody(
        CreateItemSchema,
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

      const { name, metadata } = validationResult.getValue();

      // Execute use case
      const result = await this.deps.addItemToCollection.execute({
        collectionId,
        ownerId: userId,
        name,
        metadata,
      });

      // Handle use case result
      if (result.isSuccess()) {
        const itemData = result.getValue();
        // Format response data with ISO string dates
        const responseData: CreateItemResponseData = {
          id: itemData.id,
          name: itemData.name,
          collectionId: itemData.collectionId,
          metadata: itemData.metadata,
          createdAt: itemData.createdAt.toISOString(),
          updatedAt: itemData.updatedAt.toISOString(),
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
      console.error("CreateItemHandler: Unexpected error:", error);
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
