import type { Request, Response, NextFunction } from "express";
import type { ListItems } from "@collections/app/ListItems";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Handler for GET /api/v1/collections/{id}/items
 */
export function makeListItemsHandler(deps: { listItems: ListItems }) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // Extract collection ID from URL params
      const collectionId = req.params.collectionId;
      if (!collectionId) {
        return res.status(400).json({ error: "Collection ID is required" });
      }

      // Check authentication
      const ownerId = req.user?.id;
      if (!ownerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Execute use case
      const result = await deps.listItems.execute({
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

      const result_data = result.getValue();
      return res.status(200).json({
        success: true,
        data: {
          items: result_data.items.map((item) => ({
            id: item.id,
            name: item.name,
            collectionId: item.collectionId,
            metadata: item.metadata,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
          })),
          total: result_data.total,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return next(error);
    }
  };
}
