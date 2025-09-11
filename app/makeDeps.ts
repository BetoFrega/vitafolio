import { InMemoryCollectionRepository } from "@collections/adapters/InMemoryCollectionRepository";
import { InMemoryItemRepository } from "@collections/adapters/InMemoryItemRepository";
import { InMemoryNotificationRepository } from "@collections/adapters/InMemoryNotificationRepository";
import { AddItemToCollection } from "@collections/app/AddItemToCollection";
import { CreateCollection } from "@collections/app/CreateCollection";
import { DeleteCollection } from "@collections/app/DeleteCollection";
import { DeleteItem } from "@collections/app/DeleteItem";
import { GetCollection } from "@collections/app/GetCollection";
import { GetItem } from "@collections/app/GetItem";
import { ListCollections } from "@collections/app/ListCollections";
import { ListItems } from "@collections/app/ListItems";
import { ListNotifications } from "@collections/app/ListNotifications";
import { SearchItems } from "@collections/app/SearchItems";
import { UpdateCollection } from "@collections/app/UpdateCollection";
import { UpdateItem } from "@collections/app/UpdateItem";
import { InMemoryUserRepository } from "@iam/adapters/InMemoryUserRepository";
import { NodeHashService } from "@iam/adapters/NodeHashService";
import { NodeTokenService } from "@iam/adapters/NodeTokenService";
import { Login } from "@iam/app/Login";
import { RegisterAccount } from "@iam/app/RegisterAccount";
import type { Deps } from "./ports/Deps";

export function makeDeps(): Deps {
  const hashService = new NodeHashService();
  const tokenService = new NodeTokenService();
  const userRepository = new InMemoryUserRepository();

  const registerAccount = new RegisterAccount({
    repository: userRepository,
    hashService: hashService,
  });

  const login = new Login({
    tokenService: tokenService,
    hashService: hashService,
    userRepository: userRepository,
  });

  // Collections setup
  const collectionRepository = new InMemoryCollectionRepository();
  const itemRepository = new InMemoryItemRepository();
  const notificationRepository = new InMemoryNotificationRepository();

  // Collections use cases
  const createCollection = new CreateCollection({
    collectionRepository,
  });

  const listCollections = new ListCollections({
    collectionRepository,
  });

  const getCollection = new GetCollection({
    collectionRepository,
  });

  const updateCollection = new UpdateCollection({
    collectionRepository,
    itemRepository,
  });

  const deleteCollection = new DeleteCollection({
    collectionRepository,
    itemRepository,
    notificationRepository,
  });

  const addItemToCollection = new AddItemToCollection({
    collectionRepository,
    itemRepository,
  });

  const listItems = new ListItems({
    itemRepository,
  });

  const getItem = new GetItem({
    itemRepository,
  });

  const updateItem = new UpdateItem({
    itemRepository,
    collectionRepository,
  });

  const deleteItem = new DeleteItem({
    itemRepository,
    notificationRepository,
  });

  const searchItems = new SearchItems({
    itemRepository,
  });

  const listNotifications = new ListNotifications({
    notificationRepository,
  });

  const deps: Deps = {
    tokenService,
    collectionRepository,
    itemRepository,
    notificationRepository,
    // IAM
    registerAccount,
    login,
    // Use case instances for HTTP handlers
    createCollection,
    listCollections,
    getCollection,
    updateCollection,
    deleteCollection,
    addItemToCollection,
    listItems,
    getItem,
    updateItem,
    deleteItem,
    searchItems,
    listNotifications,
  };
  return deps;
}
