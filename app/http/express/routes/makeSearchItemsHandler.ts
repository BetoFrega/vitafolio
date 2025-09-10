import type { Request, Response, NextFunction } from "express";
import type { SearchItems } from "@collections/app/SearchItems";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Handler for GET /api/v1/items/search
 */
export function makeSearchItemsHandler(deps: { searchItems: SearchItems }) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // Check authentication
      const ownerId = req.user?.id;
      if (!ownerId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Extract search parameters from query string
      const { query, collectionId, metadata, limit, offset } = req.query;

      // Build input object with proper optional property handling
      const searchInput: Parameters<typeof deps.searchItems.execute>[0] = {
        ownerId,
      };

      if (query) searchInput.query = query as string;
      if (collectionId) searchInput.collectionId = collectionId as string;
      if (metadata) searchInput.metadata = JSON.parse(metadata as string);
      if (limit) searchInput.limit = parseInt(limit as string, 10);
      if (offset) searchInput.offset = parseInt(offset as string, 10);

      // Execute use case
      const result = await deps.searchItems.execute(searchInput);

      if (result.isFailure()) {
        const { message } = result.getError();
        return res.status(400).json({ error: message });
      }

      const searchResult = result.getValue();
      return res.status(200).json({
        items: searchResult.items.map((item) => ({
          id: item.id,
          name: item.name,
          collectionId: item.collectionId,
          metadata: item.metadata,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
        total: searchResult.total,
      });
    } catch (error) {
      return next(error);
    }
  };
}
