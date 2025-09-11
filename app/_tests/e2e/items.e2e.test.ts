import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { setupE2ETest, type E2ETestContext } from "../helpers/e2e-setup";
import type { Application } from "express";

describe("Items E2E Tests (New Class-Based Handlers)", () => {
  let app: Application;
  let context: E2ETestContext;
  let authToken: string;
  let collectionId: string;

  beforeEach(async () => {
    // Setup E2E test environment
    context = await setupE2ETest();
    app = context.app;
    authToken = context.accessToken;

    // Create a test collection
    await setupTestData();
  });

  async function setupTestData() {
    // Create a test collection
    const collectionResponse = await request(app)
      .post("/api/v1/collections")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Test Collection",
        description: "A test collection",
        metadataSchema: {
          fields: {
            category: {
              type: "text",
              required: true,
            },
            priority: {
              type: "number",
              required: false,
            },
          },
        },
      });

    expect(collectionResponse.status).toBe(201);
    collectionId = collectionResponse.body.data.id;
  }

  describe("POST /api/v1/collections/:collectionId/items", () => {
    it("should create an item successfully with new handler", async () => {
      const response = await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Item",
          metadata: {
            category: "urgent",
            priority: 1,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: "Test Item",
        collectionId: collectionId,
        metadata: {
          category: "urgent",
          priority: 1,
        },
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .send({
          name: "Test Item",
          metadata: { category: "urgent" },
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should return 400 when validation fails", async () => {
      const response = await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          // missing name
          metadata: { category: "urgent" },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/v1/collections/:collectionId/items", () => {
    let itemId: string;

    beforeEach(async () => {
      // Create a test item
      const response = await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "List Test Item",
          metadata: { category: "test" },
        });
      itemId = response.body.data.id;
    });

    it("should list items successfully with new handler", async () => {
      const response = await request(app)
        .get(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0]).toMatchObject({
        id: itemId,
        name: "List Test Item",
        collectionId: collectionId,
        metadata: { category: "test" },
      });
      expect(response.body.data.total).toBe(1);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get(
        `/api/v1/collections/${collectionId}/items`,
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/v1/items/:id", () => {
    let itemId: string;

    beforeEach(async () => {
      // Create a test item
      const response = await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Get Test Item",
          metadata: { category: "test", priority: 5 },
        });
      itemId = response.body.data.id;
    });

    it("should get item successfully with new handler", async () => {
      const response = await request(app)
        .get(`/api/v1/items/${itemId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: itemId,
        name: "Get Test Item",
        collectionId: collectionId,
        metadata: { category: "test", priority: 5 },
      });
    });

    it("should return 404 when item not found", async () => {
      // valid uuid but nonexistent
      const nonexistentId = "123e4567-e89b-12d3-a456-426614174000";
      const response = await request(app)
        .get(`/api/v1/items/${nonexistentId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("PUT /api/v1/items/:id", () => {
    let itemId: string;

    beforeEach(async () => {
      // Create a test item
      const response = await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Update Test Item",
          metadata: { category: "original" },
        });
      itemId = response.body.data.id;
    });

    it("should update item successfully with new handler", async () => {
      const response = await request(app)
        .put(`/api/v1/items/${itemId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Item Name",
          metadata: { category: "updated", priority: 10 },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: itemId,
        name: "Updated Item Name",
        collectionId: collectionId,
        metadata: { category: "updated", priority: 10 },
      });
    });

    it("should handle partial updates", async () => {
      const response = await request(app)
        .put(`/api/v1/items/${itemId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Partially Updated",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Partially Updated");
    });

    it("should return 404 when item not found", async () => {
      const response = await request(app)
        .put("/api/v1/items/nonexistent")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Won't work",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("DELETE /api/v1/items/:id", () => {
    let itemId: string;

    beforeEach(async () => {
      // Create a test item
      const response = await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Delete Test Item",
          metadata: { category: "temporary" },
        });
      itemId = response.body.data.id;
    });

    it("should delete item successfully with new handler", async () => {
      const response = await request(app)
        .delete(`/api/v1/items/${itemId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });

    it("should return 404 when item not found", async () => {
      const response = await request(app)
        .delete("/api/v1/items/nonexistent")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("GET /api/v1/items/search", () => {
    beforeEach(async () => {
      // Create multiple test items
      await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Searchable Item 1",
          metadata: { category: "important", priority: 1 },
        });

      await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Searchable Item 2",
          metadata: { category: "normal", priority: 2 },
        });

      await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Different Item",
          metadata: { category: "important", priority: 3 },
        });
    });

    it("should search items successfully with new handler", async () => {
      const response = await request(app)
        .get("/api/v1/items/search?query=Searchable")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.items[0].name).toContain("Searchable");
    });

    it("should search with collection filter", async () => {
      const response = await request(app)
        .get(`/api/v1/items/search?collectionId=${collectionId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(3); // All items in the collection
    });

    it("should search with limit and offset", async () => {
      const response = await request(app)
        .get("/api/v1/items/search?limit=2&offset=1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
    });

    it("should search with metadata filter", async () => {
      const metadataFilter = JSON.stringify({ category: "important" });
      const response = await request(app)
        .get(`/api/v1/items/search?metadata=${encodeURIComponent(metadataFilter)}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2); // Two items with "important" category
    });

    it("should return 400 for invalid metadata JSON", async () => {
      const response = await request(app)
        .get("/api/v1/items/search?metadata=invalid-json")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});