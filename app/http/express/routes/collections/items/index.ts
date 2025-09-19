import express from "express";
import { CreateItemHandler } from "./handlers/CreateItemHandler";
import { GetItemHandler } from "./handlers/GetItemHandler";
import { UpdateItemHandler } from "./handlers/UpdateItemHandler";
import { DeleteItemHandler } from "./handlers/DeleteItemHandler";
import { ListItemsHandler } from "./handlers/ListItemsHandler";
import { SearchItemsHandler } from "./handlers/SearchItemsHandler";
import type { AddItemToCollection } from "@collections/app/AddItemToCollection";
import type { GetItem } from "@collections/app/GetItem";
import type { UpdateItem } from "@collections/app/UpdateItem";
import type { DeleteItem } from "@collections/app/DeleteItem";
import type { ListItems } from "@collections/app/ListItems";
import type { SearchItems } from "@collections/app/SearchItems";

/**
 * Items dependencies interface
 */
export interface ItemsDeps {
  addItemToCollection: Pick<AddItemToCollection, "execute">;
  getItem: Pick<GetItem, "execute">;
  updateItem: Pick<UpdateItem, "execute">;
  deleteItem: Pick<DeleteItem, "execute">;
  listItems: Pick<ListItems, "execute">;
  searchItems: Pick<SearchItems, "execute">;
}

/**
 * Build items router with new class-based handlers
 *
 * This router provides the new standardized handler architecture while maintaining
 * backward compatibility with existing factory function handlers.
 *
 * Routes:
 * - POST /collections/:collectionId/items - Create item in collection
 * - GET /collections/:collectionId/items - List items in collection
 * - GET /items/:id - Get specific item
 * - PUT /items/:id - Update specific item
 * - DELETE /items/:id - Delete specific item
 * - GET /items/search - Search items with query parameters
 */
export function buildItemsRouter(deps: ItemsDeps): express.Router {
  const router = express.Router();

  // Create handlers with dependency injection
  const createItemHandler = new CreateItemHandler({
    addItemToCollection: deps.addItemToCollection,
  });
  const getItemHandler = new GetItemHandler({
    getItem: deps.getItem,
  });
  const updateItemHandler = new UpdateItemHandler({
    updateItem: deps.updateItem,
  });
  const deleteItemHandler = new DeleteItemHandler({
    deleteItem: deps.deleteItem,
  });
  const listItemsHandler = new ListItemsHandler({
    listItems: deps.listItems,
  });
  const searchItemsHandler = new SearchItemsHandler({
    searchItems: deps.searchItems,
  });

  // Search route (must come before parametric routes)
  router.get("/items/search", (req, res) =>
    searchItemsHandler.handle(req, res),
  );

  // Collection-based item routes
  router.post("/collections/:collectionId/items", (req, res) =>
    createItemHandler.handle(req, res),
  );
  router.get("/collections/:collectionId/items", (req, res) =>
    listItemsHandler.handle(req, res),
  );

  // Item-specific routes (after search to avoid conflicts)
  router.get("/items/:id", (req, res) => getItemHandler.handle(req, res));
  router.put("/items/:id", (req, res) => updateItemHandler.handle(req, res));
  router.delete("/items/:id", (req, res) => deleteItemHandler.handle(req, res));

  return router;
}
