import { Router } from "express";
import { CreateCollectionHandler } from "./handlers/CreateCollectionHandler";
import { GetCollectionHandler } from "./handlers/GetCollectionHandler";

/**
 * Dependencies required for collections router
 */
export interface CollectionDeps {
  createCollection: import("@collections/app/CreateCollection").CreateCollection;
  getCollection: import("@collections/app/GetCollection").GetCollection;
}

/**
 * Build collections router with all collection-related routes
 *
 * @param deps - Collection dependencies (use cases)
 * @returns Express router configured with collection routes
 */
export function buildCollectionsRouter(deps: CollectionDeps): Router {
  const router = Router();

  // Initialize handlers
  const createCollectionHandler = new CreateCollectionHandler({
    createCollection: deps.createCollection,
  });
  const getCollectionHandler = new GetCollectionHandler({
    getCollection: deps.getCollection,
  });

  // Collection routes
  router.post("/", (req, res) => createCollectionHandler.handle(req, res));
  router.get("/:id", (req, res) => getCollectionHandler.handle(req, res));

  return router;
}
