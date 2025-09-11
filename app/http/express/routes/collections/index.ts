import { Router } from "express";
import { CreateCollectionHandler } from "./handlers/CreateCollectionHandler";
import { GetCollectionHandler } from "./handlers/GetCollectionHandler";
import { UpdateCollectionHandler } from "./handlers/UpdateCollectionHandler";
import { DeleteCollectionHandler } from "./handlers/DeleteCollectionHandler";
import { ListCollectionsHandler } from "./handlers/ListCollectionsHandler";

/**
 * Dependencies required for collections router
 */
export interface CollectionDeps {
  createCollection: import("@collections/app/CreateCollection").CreateCollection;
  getCollection: import("@collections/app/GetCollection").GetCollection;
  updateCollection: import("@collections/app/UpdateCollection").UpdateCollection;
  deleteCollection: import("@collections/app/DeleteCollection").DeleteCollection;
  listCollections: import("@collections/app/ListCollections").ListCollections;
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
  const updateCollectionHandler = new UpdateCollectionHandler({
    updateCollection: deps.updateCollection,
  });
  const deleteCollectionHandler = new DeleteCollectionHandler({
    deleteCollection: deps.deleteCollection,
  });
  const listCollectionsHandler = new ListCollectionsHandler({
    listCollections: deps.listCollections,
  });

  // Collection routes
  router.post("/", (req, res) => createCollectionHandler.handle(req, res));
  router.get("/", (req, res) => listCollectionsHandler.handle(req, res));
  router.get("/:id", (req, res) => getCollectionHandler.handle(req, res));
  router.put("/:id", (req, res) => updateCollectionHandler.handle(req, res));
  router.delete("/:id", (req, res) => deleteCollectionHandler.handle(req, res));

  return router;
}
