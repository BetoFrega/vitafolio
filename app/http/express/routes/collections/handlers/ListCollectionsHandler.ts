import type { Response } from "express";
import {
  AuthenticatedHandler,
  type AuthenticatedRequest,
} from "../../shared/handlers/AuthenticatedHandler";
import type {
  ListCollections,
  Input as ListCollectionsInput,
} from "@collections/app/ListCollections";

/**
 * List collections response data structure
 * Note: ownerId is not included in collection items for security/privacy reasons
 */
interface ListCollectionsResponseData {
  collections: Array<{
    id: string;
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    metadataSchema?: unknown; // Include metadata schema if present
  }>;
}

/**
 * List collections dependencies interface
 */
interface ListCollectionsDeps {
  listCollections: ListCollections;
}

/**
 * List collections handler implementing the new standardized response format
 *
 * Handles listing collections for authenticated users.
 * Uses the standardized response format: { success: true/false, data: {...}, timestamp: "..." }
 */
export class ListCollectionsHandler extends AuthenticatedHandler<ListCollectionsResponseData> {
  constructor(private deps: ListCollectionsDeps) {
    super();
  }

  /**
   * Handle authenticated collection listing request
   */
  protected async handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void> {
    try {
      // Execute use case
      const result = await this.deps.listCollections.execute({
        ownerId: userId,
      } as ListCollectionsInput);

      // Handle use case result
      if (result.isSuccess()) {
        const data = result.getValue();

        // Transform collections to remove ownerId for security/privacy
        const sanitizedCollections = data.collections.map((collection: any) => {
          const { ownerId, ...sanitizedCollection } = collection;
          return sanitizedCollection;
        });

        const responseData = {
          collections: sanitizedCollections,
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
      console.error("ListCollectionsHandler: Unexpected error:", error);
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
