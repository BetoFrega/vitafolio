import type { Deps } from "../../../ports/Deps";
import express from "express";
import { buildHealthRoutes } from "./health";
import { buildAuthRoutes } from "./auth";
import { buildCollectionsRouter } from "./collections";
import { buildItemsRouter } from "./collections/items";

export const buildRoutes = (
  deps: Deps,
  authMiddleware: express.RequestHandler,
) => {
  const router = express.Router();

  const healthRouter = buildHealthRoutes();
  router.use(healthRouter);

  const authRouter = buildAuthRoutes(deps, authMiddleware);
  router.use(authRouter);

  const collectionsRouter = buildCollectionsRouter({
    createCollection: deps.createCollection,
    getCollection: deps.getCollection,
    updateCollection: deps.updateCollection,
    deleteCollection: deps.deleteCollection,
    listCollections: deps.listCollections,
  });
  router.use("/api/v1/collections", authMiddleware, collectionsRouter);

  const itemsRouter = buildItemsRouter({
    addItemToCollection: deps.addItemToCollection,
    getItem: deps.getItem,
    updateItem: deps.updateItem,
    deleteItem: deps.deleteItem,
    listItems: deps.listItems,
    searchItems: deps.searchItems,
  });
  router.use("/api/v1", authMiddleware, itemsRouter);

  return router;
};
