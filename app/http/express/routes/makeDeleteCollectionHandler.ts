import type { Request, Response, NextFunction } from "express";
import type { DeleteCollection } from "@collections/app/DeleteCollection";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Handler for DELETE /api/v1/collections/{id}
 */
export function makeDeleteCollectionHandler(deps: {
  deleteCollection: DeleteCollection;
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
      const result = await deps.deleteCollection.execute({
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

      // Return 204 No Content for successful deletion
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  };
}
