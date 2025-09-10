import type { Request, Response } from "express";
import { CreateCollection } from "@collections/app/CreateCollection";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export function makeCreateCollectionHandler(deps: {
  createCollection: CreateCollection;
}) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Extract user ID from authenticated user (assuming auth middleware sets this)
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

      const { name, description, metadataSchema } = req.body;

      if (!name || !metadataSchema) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Name and metadataSchema are required",
          },
          timestamp: new Date().toISOString(),
        });
      }

      const result = await deps.createCollection.execute({
        name,
        description: description || "",
        ownerId,
        metadataSchema,
      });

      if (result.isFailure()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "CREATE_COLLECTION_FAILED",
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
          description: data.description,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Create collection error:", error);
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
