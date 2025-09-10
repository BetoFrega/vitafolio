import { RegisterAccount } from "lib/iam/app/RegisterAccount";
import { Login } from "lib/iam/app/Login";
import { InMemoryUserRepository } from "lib/iam/adapters/InMemoryUserRepository";
import { NodeHashService } from "lib/iam/adapters/NodeHashService";
import { NodeTokenService } from "lib/iam/adapters/NodeTokenService";

// Collections imports
import { InMemoryCollectionRepository } from "lib/collections/adapters/InMemoryCollectionRepository";
import { InMemoryItemRepository } from "lib/collections/adapters/InMemoryItemRepository";
import { InMemoryNotificationRepository } from "lib/collections/adapters/InMemoryNotificationRepository";
import { CreateCollection } from "lib/collections/app/CreateCollection";
import { ListCollections } from "lib/collections/app/ListCollections";
import { GetCollection } from "lib/collections/app/GetCollection";
import { UpdateCollection } from "lib/collections/app/UpdateCollection";
import { DeleteCollection } from "lib/collections/app/DeleteCollection";
import { AddItemToCollection } from "lib/collections/app/AddItemToCollection";
import { ListItems } from "lib/collections/app/ListItems";
import { GetItem } from "lib/collections/app/GetItem";
import { UpdateItem } from "lib/collections/app/UpdateItem";
import { DeleteItem } from "lib/collections/app/DeleteItem";
import { SearchItems } from "lib/collections/app/SearchItems";
import { ListNotifications } from "lib/collections/app/ListNotifications";

import { makeExpressApp } from "./http/express/makeExpressApp";
import type { Deps } from "./ports/Deps";
import * as http from "http";

// IAM setup
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
  registerAccount: registerAccount.execute.bind(registerAccount),
  login: login.execute.bind(login),
  tokenService,
  collectionRepository,
  itemRepository,
  notificationRepository,
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
const { app } = makeExpressApp(deps);

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log("TokenService implementation available for Login use case");
});
