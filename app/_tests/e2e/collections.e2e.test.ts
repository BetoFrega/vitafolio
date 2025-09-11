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

describe("Collections E2E Tests", () => {
  let app: Express.Application;
  let deps: Deps;
  let accessToken: string;

  beforeEach(async () => {
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
    deps = {
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

    ({ app } = makeExpressApp(deps));

    // Register a test user and get a real access token
    const registerResponse = await supertest(app).post("/register").send({
      email: "test@example.com",
      password: "Test123!",
      confirmPassword: "Test123!",
    });

    expect(registerResponse.status).toBe(201);

    // Login to get access token
    const loginResponse = await supertest(app).post("/login").send({
      email: "test@example.com",
      password: "Test123!",
    });

    expect(loginResponse.status).toBe(200);
    accessToken = loginResponse.body.data.token;
  });

  describe("Collection Management", () => {
    it("should create a new collection", async () => {
      const newCollection = {
        name: "My Library",
        description: "Books I want to read",
        metadataSchema: {
          fields: {
            title: { type: "text", required: true },
            author: { type: "text", required: true },
            isbn: { type: "text", required: false },
          },
        },
      };

      const response = await supertest(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(newCollection)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: expect.any(String),
        name: newCollection.name,
        description: newCollection.description,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should list all collections for authenticated user", async () => {
      // First create a collection
      const newCollection = {
        name: "My Library",
        description: "Books I want to read",
        metadataSchema: {
          fields: {
            title: { type: "text", required: true },
            author: { type: "text", required: true },
          },
        },
      };

      const createResponse = await supertest(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(newCollection)
        .expect(201);

      const collectionId = createResponse.body.data.id;

      // Then list collections
      const listResponse = await supertest(app)
        .get("/api/v1/collections")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.collections).toHaveLength(1);
      expect(listResponse.body.data.collections[0]).toMatchObject({
        id: collectionId,
        name: newCollection.name,
        description: newCollection.description,
        itemCount: 0,
      });
    });

    it("should get a specific collection", async () => {
      // First create a collection
      const newCollection = {
        name: "My Library",
        description: "Books I want to read",
        metadataSchema: {
          fields: {
            title: { type: "text", required: true },
            author: { type: "text", required: true },
          },
        },
      };

      const createResponse = await supertest(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(newCollection)
        .expect(201);

      const collectionId = createResponse.body.data.id;

      // Then get the collection
      const getResponse = await supertest(app)
        .get(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data).toMatchObject({
        id: collectionId,
        name: newCollection.name,
        description: newCollection.description,
      });
    });
  });

  describe("Item Management", () => {
    let collectionId: string;

    beforeEach(async () => {
      // Create a collection for item tests
      const newCollection = {
        name: "Test Library",
        description: "For testing items",
        metadataSchema: {
          fields: {
            title: { type: "text", required: true },
            author: { type: "text", required: true },
            pages: { type: "number", required: false },
          },
        },
      };

      const response = await supertest(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(newCollection)
        .expect(201);

      collectionId = response.body.data.id;
    });

    it("should add an item to a collection", async () => {
      const newItem = {
        name: "The Great Gatsby",
        metadata: {
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          pages: 180,
        },
      };

      const response = await supertest(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(newItem)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: expect.any(String),
        name: newItem.name,
        metadata: newItem.metadata,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should list items in a collection", async () => {
      // First add an item
      const newItem = {
        name: "The Great Gatsby",
        metadata: {
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          pages: 180,
        },
      };

      await supertest(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(newItem)
        .expect(201);

      // Then list items
      const listResponse = await supertest(app)
        .get(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.items).toHaveLength(1);
      expect(listResponse.body.data.items[0]).toMatchObject({
        name: newItem.name,
        metadata: newItem.metadata,
      });
    });
  });

  describe("Authentication", () => {
    it("should reject requests without authentication", async () => {
      await supertest(app).get("/api/v1/collections").expect(401);

      await supertest(app)
        .post("/api/v1/collections")
        .send({
          name: "Test Collection",
          description: "Test",
          metadataSchema: { fields: {} },
        })
        .expect(401);
    });

    it("should reject requests with invalid tokens", async () => {
      await supertest(app)
        .get("/api/v1/collections")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);
    });
  });
});
