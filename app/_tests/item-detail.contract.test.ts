import { makeExpressApp } from "app/http/express/makeExpressApp";
import supertest from "supertest";
import Express from "express";
import type { Deps } from "app/ports/Deps";
import { createMockDeps } from "./helpers/mockDeps";

describe("Item Detail API Contract Tests", () => {
  let app: Express.Application;
  let deps: Deps;

  beforeEach(() => {
    deps = createMockDeps();
    ({ app } = makeExpressApp(deps));
  });

  describe("GET /api/v1/items/{id}", () => {
    it("should return item details for valid ID", async () => {
      const itemId = "item_123";

      // This test should FAIL until the handler is implemented
      await supertest(app)
        .get(`/api/v1/items/${itemId}`)
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toMatchObject({
            id: itemId,
            collectionId: expect.any(String),
            metadata: expect.any(Object),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });

    it("should return 404 for non-existent item", async () => {
      const nonExistentId = "item_999";

      await supertest(app)
        .get(`/api/v1/items/${nonExistentId}`)
        .set("Authorization", "Bearer valid_token")
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("NOT_FOUND");
        });
    });

    it("should return 401 for missing authentication", async () => {
      const itemId = "item_123";

      await supertest(app)
        .get(`/api/v1/items/${itemId}`)
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("UNAUTHORIZED");
        });
    });
  });

  describe("PUT /api/v1/items/{id}", () => {
    it("should update item successfully", async () => {
      const itemId = "item_123";
      const updateData = {
        metadata: {
          title: "Updated Book Title",
          author: "Updated Author",
          isbn: "9780743273565",
        },
        expirationDate: "2026-01-15T23:59:59Z",
      };

      // This test should FAIL until the handler is implemented
      await supertest(app)
        .put(`/api/v1/items/${itemId}`)
        .set("Authorization", "Bearer valid_token")
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toMatchObject({
            id: itemId,
            metadata: updateData.metadata,
            expirationDate: updateData.expirationDate,
            updatedAt: expect.any(String),
          });
        });
    });

    it("should return 400 for invalid update data", async () => {
      const itemId = "item_123";
      const invalidData = {
        metadata: {
          // Missing required fields based on collection schema
          title: "",
        },
      };

      await supertest(app)
        .put(`/api/v1/items/${itemId}`)
        .set("Authorization", "Bearer valid_token")
        .send(invalidData)
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("VALIDATION_ERROR");
        });
    });

    it("should return 404 for non-existent item", async () => {
      const nonExistentId = "item_999";
      const updateData = {
        metadata: {
          title: "Updated Title",
          author: "Updated Author",
        },
      };

      await supertest(app)
        .put(`/api/v1/items/${nonExistentId}`)
        .set("Authorization", "Bearer valid_token")
        .send(updateData)
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("NOT_FOUND");
        });
    });

    it("should return 401 for missing authentication", async () => {
      const itemId = "item_123";
      const updateData = {
        metadata: {
          title: "Updated Title",
          author: "Updated Author",
        },
      };

      await supertest(app)
        .put(`/api/v1/items/${itemId}`)
        .send(updateData)
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("UNAUTHORIZED");
        });
    });
  });

  describe("DELETE /api/v1/items/{id}", () => {
    it("should delete item successfully", async () => {
      const itemId = "item_123";

      // This test should FAIL until the handler is implemented
      await supertest(app)
        .delete(`/api/v1/items/${itemId}`)
        .set("Authorization", "Bearer valid_token")
        .expect(204);
    });

    it("should return 404 for non-existent item", async () => {
      const nonExistentId = "item_999";

      await supertest(app)
        .delete(`/api/v1/items/${nonExistentId}`)
        .set("Authorization", "Bearer valid_token")
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("NOT_FOUND");
        });
    });

    it("should return 401 for missing authentication", async () => {
      const itemId = "item_123";

      await supertest(app)
        .delete(`/api/v1/items/${itemId}`)
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("UNAUTHORIZED");
        });
    });
  });
});
