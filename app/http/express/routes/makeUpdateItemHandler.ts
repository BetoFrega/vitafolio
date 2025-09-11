import type { Request, Response, NextFunction } from "express";
import type { UpdateItem } from "@collections/app/UpdateItem";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Handler for PUT /api/v1/items/{id}
 */
export function makeUpdateItemHandler(deps: { updateItem: UpdateItem }) {
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

      // Extract update data from request body
      const { name, metadata } = req.body;

      // Execute use case
      const result = await deps.updateItem.execute({
        itemId,
        ownerId,
        name,
        metadata,
      });

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
        updatedAt: item.updatedAt.toISOString(),
      });
    } catch (error) {
      return next(error);
    }
  };
}
