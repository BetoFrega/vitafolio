import type { Response } from "express";
import { z } from "zod";
import {
  AuthenticatedHandler,
  type AuthenticatedRequest,
} from "../../../shared/handlers/AuthenticatedHandler";
import { RequestValidator } from "../../../shared/validation/RequestValidator";
import type { UpdateItem } from "@collections/app/UpdateItem";

/**
 * Update item request schema for validation
 */
const UpdateItemSchema = z.object({
  name: z.string().min(1, "Item name cannot be empty").optional(),
  metadata: z
    .record(z.string(), z.union([z.string(), z.number(), z.date(), z.boolean()]))
    .optional(),
});

/**
 * Update item response data structure
 */
interface UpdateItemResponseData {
  id: string;
  name: string;
  collectionId: string;
  metadata: Record<string, string | number | Date | boolean>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update item dependencies interface
 */
interface UpdateItemDeps {
  updateItem: UpdateItem;
}

/**
 * Update item handler implementing the new standardized response format
 *
 * Handles item updates for authenticated users.
 * Uses the standardized response format: { success: true/false, data: {...}, timestamp: "..." }
 */
export class UpdateItemHandler extends AuthenticatedHandler<UpdateItemResponseData> {
  constructor(private deps: UpdateItemDeps) {
    super();
  }

  /**
   * Handle authenticated item update request
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

      // Validate request body
      const validationResult = RequestValidator.validateBody(
        UpdateItemSchema,
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
      const result = await this.deps.updateItem.execute({
        itemId,
        ownerId: userId,
        name,
        metadata,
      });

      // Handle use case result
      if (result.isSuccess()) {
        const itemData = result.getValue();
        // Format response data with ISO string dates
        const responseData: UpdateItemResponseData = {
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
      console.error("UpdateItemHandler: Unexpected error:", error);
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