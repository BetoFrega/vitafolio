import type { Request, Response } from "express";
import { AddItemToCollection } from "@collections/app/AddItemToCollection";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export function makeCreateItemHandler(deps: {
  addItemToCollection: AddItemToCollection;
}) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ownerId = req.user?.id;
      if (!ownerId) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
          timestamp: new Date().toISOString(),
        });
      }
      console.log(req.params)
      const { collectionId } = req.params;
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

      if (!name || !metadata) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Name and metadata are required",
          },
          timestamp: new Date().toISOString(),
        });
      }

      const result = await deps.addItemToCollection.execute({
        collectionId,
        ownerId,
        name,
        metadata,
      });

      if (result.isFailure()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "CREATE_ITEM_FAILED",
            message: result.getError().message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      const data = result.getValue();
      return res.status(201).json({
        success: true,
        data: {
          id: data.id,
          name: data.name,
          collectionId: data.collectionId,
          metadata: data.metadata,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Create item error:", error);
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
        timestamp: new Date().toISOString(),
      });
    }
  };
}
