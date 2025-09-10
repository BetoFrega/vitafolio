import { makeExpressApp } from "app/http/express/makeExpressApp";
import supertest from "supertest";
import Express from "express";
import type { Deps } from "app/ports/Deps";
import { createMockDepsForContract } from "./helpers/mockDeps";
import { Result } from "@shared/app/contracts/Result";
import { vi } from "vitest";

describe("Collections Contract Tests", () => {
  let app: Express.Application;
  let deps: Deps;

  beforeEach(() => {
    deps = createMockDepsForContract();
    ({ app } = makeExpressApp(deps));
  });

  describe("POST /api/v1/collections", () => {
    it("should create a new collection successfully", async () => {
      const newCollection = {
        name: "My Library",
        description: "Books I want to read",
        metadataSchema: {
          fields: {
            title: { type: "text" as const, required: true },
            author: { type: "text" as const, required: true },
            isbn: { type: "text" as const, required: false },
          },
        },
      };

      const mockCollectionData = {
        id: "collection-123",
        name: newCollection.name,
        description: newCollection.description,
        ownerId: "test-user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the createCollection use case to return success
      const createCollectionMock = deps.createCollection.execute as ReturnType<
        typeof vi.fn
      >;
      createCollectionMock.mockResolvedValue(
        Result.success(mockCollectionData),
      );

      await supertest(app)
        .post("/api/v1/collections")
        .set("Authorization", "Bearer valid_token")
        .send(newCollection)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toMatchObject({
            id: expect.any(String),
            name: newCollection.name,
            description: newCollection.description,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
          expect(res.body.timestamp).toBeDefined();
        });

      // Verify the use case was called with correct parameters
      expect(deps.createCollection.execute).toHaveBeenCalledWith({
        name: newCollection.name,
        description: newCollection.description,
        metadataSchema: newCollection.metadataSchema,
        ownerId: "test-user-123",
      });
    });

    it("should return 400 for invalid collection data", async () => {
      const invalidCollection = {
        // Missing required name field
        description: "Invalid collection",
      };

      await supertest(app)
        .post("/api/v1/collections")
        .set("Authorization", "Bearer valid_token")
        .send(invalidCollection)
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("VALIDATION_ERROR");
        });
    });

    it("should return 401 for missing authentication", async () => {
      const newCollection = {
        name: "My Library",
        description: "Books collection",
      };

      await supertest(app)
        .post("/api/v1/collections")
        .send(newCollection)
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("UNAUTHORIZED");
        });
    });
  });

  describe("GET /api/v1/collections", () => {
    it("should return all collections for authenticated user", async () => {
      const mockCollections = [
        {
          id: "collection-1",
          name: "My Library",
          description: "Books collection",
          itemCount: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "collection-2",
          name: "Movies",
          description: "Movie collection",
          itemCount: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Mock the listCollections use case to return collections
      const listCollectionsMock = deps.listCollections.execute as ReturnType<
        typeof vi.fn
      >;
      listCollectionsMock.mockResolvedValue(
        Result.success({ collections: mockCollections }),
      );

      await supertest(app)
        .get("/api/v1/collections")
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.collections).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
                description: expect.any(String),
                itemCount: expect.any(Number),
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
              }),
            ]),
          );
        });
    });

    it("should return empty array when no collections exist", async () => {
      // Mock the listCollections use case to return empty array
      const listCollectionsMock = deps.listCollections.execute as ReturnType<
        typeof vi.fn
      >;
      listCollectionsMock.mockResolvedValue(
        Result.success({ collections: [] }),
      );

      await supertest(app)
        .get("/api/v1/collections")
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.collections).toEqual([]);
        });
    });

    it("should return 401 for missing authentication", async () => {
      await supertest(app)
        .get("/api/v1/collections")
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("UNAUTHORIZED");
        });
    });
  });
});
