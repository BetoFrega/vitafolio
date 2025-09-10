import type { Request, Response } from "express";
import type { AddItemToCollection } from "@collections/app/AddItemToCollection";

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export function makeAddItemToCollectionHandler(
  addItemToCollection: AddItemToCollection,
) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ownerId = req.user?.id;
      if (!ownerId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
          timestamp: new Date().toISOString(),
        });
      }

      const collectionId = req.params.collectionId;
      const { name, metadata } = req.body;

      if (!collectionId) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Collection ID is required",
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (!name) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Item name is required" },
          timestamp: new Date().toISOString(),
        });
      }

      const result = await addItemToCollection.execute({
        collectionId,
        ownerId,
        name,
        metadata: metadata || {},
      });

      if (result.isFailure()) {
        return res.status(400).json({
          success: false,
          error: { code: "BUSINESS_ERROR", message: result.getError().message },
          timestamp: new Date().toISOString(),
        });
      }

      const item = result.getValue();
      return res.status(201).json({
        success: true,
        data: {
          id: item.id,
          name: item.name,
          metadata: item.metadata,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Add item to collection error:", error);
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Internal server error" },
        timestamp: new Date().toISOString(),
      });
    }
  };
}
