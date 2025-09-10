import { makeExpressApp } from "app/http/express/makeExpressApp";
import supertest from "supertest";
import Express from "express";
import type { Deps } from "app/ports/Deps";
import { createMockDeps } from "./helpers/mockDeps";

describe("Items API Contract Tests", () => {
  let app: Express.Application;
  let deps: Deps;

  beforeEach(() => {
    deps = createMockDeps();
    ({ app } = makeExpressApp(deps));
  });

  describe("POST /api/v1/collections/{id}/items", () => {
    it("should add item to collection successfully", async () => {
      const collectionId = "col_123";
      const newItem = {
        metadata: {
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          isbn: "9780743273565",
        },
        expirationDate: "2025-12-31T23:59:59Z",
      };

      // This test should FAIL until the handler is implemented
      await supertest(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", "Bearer valid_token")
        .send(newItem)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toMatchObject({
            id: expect.any(String),
            collectionId: collectionId,
            metadata: newItem.metadata,
            expirationDate: newItem.expirationDate,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });

    it("should return 400 for invalid item data", async () => {
      const collectionId = "col_123";
      const invalidItem = {
        // Missing required metadata
        expirationDate: "2025-12-31T23:59:59Z",
      };

      await supertest(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", "Bearer valid_token")
        .send(invalidItem)
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("VALIDATION_ERROR");
        });
    });

    it("should return 404 for non-existent collection", async () => {
      const nonExistentCollectionId = "col_999";
      const newItem = {
        metadata: {
          title: "Test Book",
          author: "Test Author",
        },
      };

      await supertest(app)
        .post(`/api/v1/collections/${nonExistentCollectionId}/items`)
        .set("Authorization", "Bearer valid_token")
        .send(newItem)
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("NOT_FOUND");
        });
    });

    it("should return 401 for missing authentication", async () => {
      const collectionId = "col_123";
      const newItem = {
        metadata: {
          title: "Test Book",
          author: "Test Author",
        },
      };

      await supertest(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .send(newItem)
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("UNAUTHORIZED");
        });
    });
  });

  describe("GET /api/v1/collections/{id}/items", () => {
    it("should return all items in collection", async () => {
      const collectionId = "col_123";

      // This test should FAIL until the handler is implemented
      await supertest(app)
        .get(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                collectionId: collectionId,
                metadata: expect.any(Object),
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
              }),
            ]),
          );
        });
    });

    it("should support filtering by expiration date", async () => {
      const collectionId = "col_123";
      const filterDate = "2025-12-31";

      await supertest(app)
        .get(`/api/v1/collections/${collectionId}/items`)
        .query({ expirationBefore: filterDate })
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual(expect.any(Array));
        });
    });

    it("should return 404 for non-existent collection", async () => {
      const nonExistentCollectionId = "col_999";

      await supertest(app)
        .get(`/api/v1/collections/${nonExistentCollectionId}/items`)
        .set("Authorization", "Bearer valid_token")
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("NOT_FOUND");
        });
    });

    it("should return 401 for missing authentication", async () => {
      const collectionId = "col_123";

      await supertest(app)
        .get(`/api/v1/collections/${collectionId}/items`)
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("UNAUTHORIZED");
        });
    });
  });
});
