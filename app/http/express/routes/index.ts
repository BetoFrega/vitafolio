import type { Deps } from "../../../ports/Deps";
import express from "express";
import { makeUserRegistrationHandler } from "./makeUserRegistrationHandler";
import { makeHealthCheckHandler } from "./makeHealthCheckHandler";
import { makeLoginHandler } from "./makeLoginHandler";

// Collections route handlers
import { makeCreateCollectionHandler } from "./makeCreateCollectionHandler";
import { makeListCollectionsHandler } from "./makeListCollectionsHandler";
import { makeGetCollectionHandler } from "./makeGetCollectionHandler";
import { makeUpdateCollectionHandler } from "./makeUpdateCollectionHandler";
import { makeDeleteCollectionHandler } from "./makeDeleteCollectionHandler";
import { makeCreateItemHandler } from "./makeCreateItemHandler";
import { makeListItemsHandler } from "./makeListItemsHandler";
import { makeGetItemHandler } from "./makeGetItemHandler";
import { makeUpdateItemHandler } from "./makeUpdateItemHandler";
import { makeDeleteItemHandler } from "./makeDeleteItemHandler";
import { makeSearchItemsHandler } from "./makeSearchItemsHandler";
import { makeListNotificationsHandler } from "./makeListNotificationsHandler";

export const buildRoutes = (
  deps: Deps,
  authMiddleware?: express.RequestHandler,
) => {
  const router = express.Router();
  console.log("Building routes with authMiddleware:", !!authMiddleware);

  // Health and Authentication routes
  router.get("/health", makeHealthCheckHandler(deps));
  router.post("/register", makeUserRegistrationHandler(deps));
  router.post("/login", makeLoginHandler(deps));

  // Debug endpoint to test auth
  if (authMiddleware) {
    router.get("/debug/auth", authMiddleware, (req: any, res) => {
      res.json({
        message: "Authentication working",
        user: req.user,
        middlewarePresent: !!authMiddleware,
      });
    });
  }

  // Collections routes (protected)
  if (authMiddleware) {
    router.post(
      "/api/v1/collections",
      authMiddleware,
      makeCreateCollectionHandler(deps),
    );
    router.get(
      "/api/v1/collections",
      authMiddleware,
      makeListCollectionsHandler(deps),
    );
    router.get(
      "/api/v1/collections/:id",
      authMiddleware,
      makeGetCollectionHandler(deps),
    );
    router.put(
      "/api/v1/collections/:id",
      authMiddleware,
      makeUpdateCollectionHandler(deps),
    );
    router.delete(
      "/api/v1/collections/:id",
      authMiddleware,
      makeDeleteCollectionHandler(deps),
    );

    // Items routes (protected)
    router.post(
      "/api/v1/collections/:collectionId/items",
      authMiddleware,
      makeCreateItemHandler(deps),
    );
    router.get(
      "/api/v1/collections/:collectionId/items",
      authMiddleware,
      makeListItemsHandler(deps),
    );
    router.get("/api/v1/items/:id", authMiddleware, makeGetItemHandler(deps));
    router.put(
      "/api/v1/items/:id",
      authMiddleware,
      makeUpdateItemHandler(deps),
    );
    router.delete(
      "/api/v1/items/:id",
      authMiddleware,
      makeDeleteItemHandler(deps),
    );
    router.get(
      "/api/v1/items/search",
      authMiddleware,
      makeSearchItemsHandler(deps),
    );

    // Notifications routes (protected)
    router.get(
      "/api/v1/notifications",
      authMiddleware,
      makeListNotificationsHandler(deps),
    );
  } else {
    // Fallback for tests without auth middleware
    router.post("/api/v1/collections", makeCreateCollectionHandler(deps));
    router.get("/api/v1/collections", makeListCollectionsHandler(deps));
    router.get("/api/v1/collections/:id", makeGetCollectionHandler(deps));
    router.put("/api/v1/collections/:id", makeUpdateCollectionHandler(deps));
    router.delete("/api/v1/collections/:id", makeDeleteCollectionHandler(deps));

    router.post("/api/v1/collections/:id/items", makeCreateItemHandler(deps));
    router.get("/api/v1/collections/:id/items", makeListItemsHandler(deps));
    router.get("/api/v1/items/:id", makeGetItemHandler(deps));
    router.put("/api/v1/items/:id", makeUpdateItemHandler(deps));
    router.delete("/api/v1/items/:id", makeDeleteItemHandler(deps));
    router.get("/api/v1/items/search", makeSearchItemsHandler(deps));

    router.get("/api/v1/notifications", makeListNotificationsHandler(deps));
  }

  return router;
};
