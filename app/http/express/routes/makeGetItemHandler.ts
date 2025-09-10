import type { Request, Response, NextFunction } from "express";
import type { GetItem } from "@collections/app/GetItem";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Handler for GET /api/v1/items/{id}
 */
export function makeGetItemHandler(deps: { getItem: GetItem }) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // Extract item ID from URL params
      const itemId = req.params.id;
      if (!itemId) {
        return res.status(400).json({ error: "Item ID is required" });
      }

      // Check authentication
      const ownerId = req.user?.id;
      if (!ownerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Execute use case
      const result = await deps.getItem.execute({ itemId, ownerId });

      if (result.isFailure()) {
        const { message } = result.getError();
        if (message.includes("not found")) {
          return res.status(404).json({ error: message });
        }
        return res.status(400).json({ error: message });
      }

      const item = result.getValue();
      return res.status(200).json({
        id: item.id,
        name: item.name,
        collectionId: item.collectionId,
        metadata: item.metadata,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      });
    } catch (error) {
      return next(error);
    }
  };
}
