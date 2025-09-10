import { makeExpressApp } from "app/http/express/makeExpressApp";
import supertest from "supertest";
import Express from "express";
import type { Deps } from "app/ports/Deps";

// Real implementations for E2E testing
import { InMemoryCollectionRepository } from "@collections/adapters/InMemoryCollectionRepository";
import { InMemoryItemRepository } from "@collections/adapters/InMemoryItemRepository";
import { InMemoryNotificationRepository } from "@collections/adapters/InMemoryNotificationRepository";
import { InMemoryUserRepository } from "@iam/adapters/InMemoryUserRepository";
import { NodeHashService } from "@iam/adapters/NodeHashService";
import { NodeTokenService } from "@iam/adapters/NodeTokenService";
import { RegisterAccount } from "@iam/app/RegisterAccount";
import { Login } from "@iam/app/Login";

// Collections use cases
import { CreateCollection } from "@collections/app/CreateCollection";
import { ListCollections } from "@collections/app/ListCollections";
import { GetCollection } from "@collections/app/GetCollection";
import { UpdateCollection } from "@collections/app/UpdateCollection";
import { DeleteCollection } from "@collections/app/DeleteCollection";
import { AddItemToCollection } from "@collections/app/AddItemToCollection";
import { ListItems } from "@collections/app/ListItems";
import { GetItem } from "@collections/app/GetItem";
import { UpdateItem } from "@collections/app/UpdateItem";
import { DeleteItem } from "@collections/app/DeleteItem";
import { SearchItems } from "@collections/app/SearchItems";
import { ListNotifications } from "@collections/app/ListNotifications";
import { TestDataBuilder, type UserData } from "./test-data-builders";

export interface E2ETestContext {
  app: Express.Application;
  deps: Deps;
  accessToken: string;
  user: UserData;
}

export interface MultiUserE2ETestContext {
  app: Express.Application;
  deps: Deps;
  userA: {
    accessToken: string;
    user: UserData;
  };
  userB: {
    accessToken: string;
    user: UserData;
  };
}

/**
 * Sets up a complete E2E test environment with real implementations
 */
export async function setupE2ETest(): Promise<E2ETestContext> {
  // Create real repository instances
  const userRepository = new InMemoryUserRepository();
  const collectionRepository = new InMemoryCollectionRepository();
  const itemRepository = new InMemoryItemRepository();
  const notificationRepository = new InMemoryNotificationRepository();

  // Create real service instances
  const hashService = new NodeHashService();
  const tokenService = new NodeTokenService();

  // Create real IAM use case instances
  const registerAccount = new RegisterAccount({
    repository: userRepository,
    hashService,
  });

  const login = new Login({
    userRepository,
    hashService,
    tokenService,
  });

  // Create real use case instances
  const deps: Deps = {
    // IAM
    registerAccount: registerAccount,
    login: login,
    tokenService,

    // Repositories
    collectionRepository,
    itemRepository,
    notificationRepository,

    // Collection use cases
    createCollection: new CreateCollection({ collectionRepository }),
    listCollections: new ListCollections({ collectionRepository }),
    getCollection: new GetCollection({ collectionRepository }),
    updateCollection: new UpdateCollection({
      collectionRepository,
      itemRepository,
    }),
    deleteCollection: new DeleteCollection({
      collectionRepository,
      itemRepository,
      notificationRepository,
    }),

    // Item use cases
    addItemToCollection: new AddItemToCollection({
      collectionRepository,
      itemRepository,
    }),
    listItems: new ListItems({ itemRepository }),
    getItem: new GetItem({ itemRepository }),
    updateItem: new UpdateItem({ itemRepository, collectionRepository }),
    deleteItem: new DeleteItem({ itemRepository, notificationRepository }),
    searchItems: new SearchItems({ itemRepository }),

    // Notification use cases
    listNotifications: new ListNotifications({ notificationRepository }),
  };

  const { app } = makeExpressApp(deps);

  // Register a test user and get a real access token
  const user = TestDataBuilder.user();
  const registerResponse = await supertest(app).post("/register").send(user);

  expect(registerResponse.status).toBe(201);

  // Login to get access token
  const loginResponse = await supertest(app).post("/login").send({
    email: user.email,
    password: user.password,
  });

  expect(loginResponse.status).toBe(200);
  const accessToken = loginResponse.body.accessToken;

  return {
    app,
    deps,
    accessToken,
    user,
  };
}

/**
 * Sets up a multi-user E2E test environment with two authenticated users
 */
export async function setupMultiUserE2ETest(): Promise<MultiUserE2ETestContext> {
  // Create real repository instances
  const userRepository = new InMemoryUserRepository();
  const collectionRepository = new InMemoryCollectionRepository();
  const itemRepository = new InMemoryItemRepository();
  const notificationRepository = new InMemoryNotificationRepository();

  // Create real service instances
  const hashService = new NodeHashService();
  const tokenService = new NodeTokenService();

  // Create real IAM use case instances
  const registerAccount = new RegisterAccount({
    repository: userRepository,
    hashService,
  });

  const login = new Login({
    userRepository,
    hashService,
    tokenService,
  });

  // Create real use case instances
  const deps: Deps = {
    // IAM
    registerAccount: registerAccount,
    login: login,
    tokenService,

    // Repositories
    collectionRepository,
    itemRepository,
    notificationRepository,

    // Collection use cases
    createCollection: new CreateCollection({ collectionRepository }),
    listCollections: new ListCollections({ collectionRepository }),
    getCollection: new GetCollection({ collectionRepository }),
    updateCollection: new UpdateCollection({
      collectionRepository,
      itemRepository,
    }),
    deleteCollection: new DeleteCollection({
      collectionRepository,
      itemRepository,
      notificationRepository,
    }),

    // Item use cases
    addItemToCollection: new AddItemToCollection({
      collectionRepository,
      itemRepository,
    }),
    listItems: new ListItems({ itemRepository }),
    getItem: new GetItem({ itemRepository }),
    updateItem: new UpdateItem({ itemRepository, collectionRepository }),
    deleteItem: new DeleteItem({ itemRepository, notificationRepository }),
    searchItems: new SearchItems({ itemRepository }),

    // Notification use cases
    listNotifications: new ListNotifications({ notificationRepository }),
  };

  const { app } = makeExpressApp(deps);

  // Setup User A
  const userA = TestDataBuilder.user({ email: "userA@example.com" });
  const registerResponseA = await supertest(app).post("/register").send(userA);
  expect(registerResponseA.status).toBe(201);

  const loginResponseA = await supertest(app).post("/login").send({
    email: userA.email,
    password: userA.password,
  });
  expect(loginResponseA.status).toBe(200);

  // Setup User B
  const userB = TestDataBuilder.user({ email: "userB@example.com" });
  const registerResponseB = await supertest(app).post("/register").send(userB);
  expect(registerResponseB.status).toBe(201);

  const loginResponseB = await supertest(app).post("/login").send({
    email: userB.email,
    password: userB.password,
  });
  expect(loginResponseB.status).toBe(200);

  return {
    app,
    deps,
    userA: {
      accessToken: loginResponseA.body.accessToken,
      user: userA,
    },
    userB: {
      accessToken: loginResponseB.body.accessToken,
      user: userB,
    },
  };
}

/**
 * Creates a collection for testing
 */
export async function createTestCollection(
  app: Express.Application,
  accessToken: string,
  collectionData = TestDataBuilder.collection(),
) {
  const response = await supertest(app)
    .post("/api/v1/collections")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(collectionData)
    .expect(201);

  return {
    collectionId: response.body.data.id,
    collection: response.body.data,
  };
}

/**
 * Creates an item in a collection for testing
 */
export async function createTestItem(
  app: Express.Application,
  accessToken: string,
  collectionId: string,
  itemData = TestDataBuilder.item(),
) {
  const response = await supertest(app)
    .post(`/api/v1/collections/${collectionId}/items`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send(itemData)
    .expect(201);

  return {
    itemId: response.body.data.id,
    item: response.body.data,
  };
}
