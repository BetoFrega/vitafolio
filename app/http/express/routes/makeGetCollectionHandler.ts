import type { Request, Response, NextFunction } from "express";
import type { GetCollection } from "@collections/app/GetCollection";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Handler for GET /api/v1/collections/{id}
 */
export function makeGetCollectionHandler(deps: {
  getCollection: GetCollection;
}) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // Extract collection ID from URL params
      const collectionId = req.params.id;
      if (!collectionId) {
        return res.status(400).json({ error: "Collection ID is required" });
      }

      // Check authentication
      const ownerId = req.user?.id;
      if (!ownerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Execute use case
      const result = await deps.getCollection.execute({
        collectionId,
        ownerId,
      });

      if (result.isFailure()) {
        const { message } = result.getError();
        if (message.includes("not found")) {
          return res.status(404).json({ error: message });
        }
        return res.status(400).json({ error: message });
      }

      const collection = result.getValue();
      return res.status(200).json({
        success: true,
        data: {
          id: collection.id,
          name: collection.name,
          description: collection.description,
          ownerId: collection.ownerId,
          metadataSchema: collection.metadataSchema,
          createdAt: collection.createdAt.toISOString(),
          updatedAt: collection.updatedAt.toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return next(error);
    }
  };
}
