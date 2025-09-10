import type { RegisterAccount } from "@iam/app/RegisterAccount";
import type { Login } from "@iam/app/Login";
import type { TokenService } from "@iam/ports/TokenService";
import type { CollectionRepository } from "@collections/ports/CollectionRepository";
import type { ItemRepository } from "@collections/ports/ItemRepository";
import type { NotificationRepository } from "@collections/ports/NotificationRepository";

// Collections use cases
import type { CreateCollection } from "@collections/app/CreateCollection";
import type { ListCollections } from "@collections/app/ListCollections";
import type { GetCollection } from "@collections/app/GetCollection";
import type { UpdateCollection } from "@collections/app/UpdateCollection";
import type { DeleteCollection } from "@collections/app/DeleteCollection";
import type { AddItemToCollection } from "@collections/app/AddItemToCollection";
import type { ListItems } from "@collections/app/ListItems";
import type { GetItem } from "@collections/app/GetItem";
import type { UpdateItem } from "@collections/app/UpdateItem";
import type { DeleteItem } from "@collections/app/DeleteItem";
import type { SearchItems } from "@collections/app/SearchItems";
import type { ListNotifications } from "@collections/app/ListNotifications";

export type RegisterAccountDeps = {
  registerAccount: RegisterAccount["execute"];
};

export type LoginDeps = {
  login: Login["execute"];
};

export type SharedDeps = {
  tokenService: TokenService;
};

export type CollectionsDeps = {
  collectionRepository: CollectionRepository;
  itemRepository: ItemRepository;
  notificationRepository: NotificationRepository;
  // Use case instances for HTTP handlers
  createCollection: CreateCollection;
  listCollections: ListCollections;
  getCollection: GetCollection;
  updateCollection: UpdateCollection;
  deleteCollection: DeleteCollection;
  addItemToCollection: AddItemToCollection;
  listItems: ListItems;
  getItem: GetItem;
  updateItem: UpdateItem;
  deleteItem: DeleteItem;
  searchItems: SearchItems;
  listNotifications: ListNotifications;
};

// Aggregate application dependencies. Keep `Deps` as a composition so
// existing call sites that expect the full set still work.
export type Deps = RegisterAccountDeps &
  LoginDeps &
  SharedDeps &
  CollectionsDeps;
