import type { Request, Response } from "express";
import { ListCollections } from "@collections/app/ListCollections";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export function makeListCollectionsHandler(deps: {
  listCollections: ListCollections;
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

      const result = await deps.listCollections.execute({
        ownerId,
      });

      if (result.isFailure()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "LIST_COLLECTIONS_FAILED",
            message: result.getError().message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      const data = result.getValue();
      return res.status(200).json({
        success: true,
        data: {
          collections: data.collections,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("List collections error:", error);
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
