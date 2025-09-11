import type { Request, Response, NextFunction } from "express";
import type { UpdateCollection } from "@collections/app/UpdateCollection";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Handler for PUT /api/v1/collections/{id}
 */
export function makeUpdateCollectionHandler(deps: {
  updateCollection: UpdateCollection;
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

      // Extract update data from request body
      const { name, description } = req.body;

      // Execute use case
      const result = await deps.updateCollection.execute({
        collectionId,
        ownerId,
        name,
        description,
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
        id: collection.id,
        name: collection.name,
        description: collection.description,
        ownerId: collection.ownerId,
        updatedAt: collection.updatedAt.toISOString(),
      });
    } catch (error) {
      return next(error);
    }
  };
}
