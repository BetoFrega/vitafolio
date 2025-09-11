import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { setupE2ETest, type E2ETestContext } from "../helpers/e2e-setup";
import type { Application } from "express";

describe("Collections E2E Tests", () => {
  let app: Application;
  let context: E2ETestContext;
  let authToken: string;

  beforeEach(async () => {
    context = await setupE2ETest();
    app = context.app;
    authToken = context.accessToken;
  });

  describe("POST /api/v1/collections", () => {
    it("should create a collection successfully", async () => {
      const response = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Collection V1",
          description: "A test collection using the V1 API",
          metadataSchema: {
            fields: {
              title: {
                type: "text",
                required: true,
                description: "Item title",
              },
              priority: {
                type: "number",
                required: false,
                description: "Priority level",
              },
            },
          },
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          name: "Test Collection V1",
          description: "A test collection using the V1 API",
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        timestamp: expect.any(String),
      });

      // ownerId should not be included in response for security
      expect(response.body.data).not.toHaveProperty("ownerId");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .post("/api/v1/collections")
        .send({
          name: "Test Collection",
          description: "A test collection",
          metadataSchema: { fields: {} },
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
        timestamp: expect.any(String),
      });
    });

    it("should return 400 when validation fails", async () => {
      const response = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          // Missing required fields
          description: "A test collection",
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: expect.stringContaining("name"),
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("GET /api/v1/collections/:id", () => {
    it("should get a collection successfully", async () => {
      // First create a collection
      const createResponse = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Collection for Get",
          description: "A test collection for get operation",
          metadataSchema: {
            fields: {
              title: {
                type: "text",
                required: true,
                description: "Item title",
              },
            },
          },
        })
        .expect(201);

      const collectionId = createResponse.body.data.id;

      // Then get the collection
      const getResponse = await request(app)
        .get(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body).toMatchObject({
        success: true,
        data: {
          id: collectionId,
          name: "Test Collection for Get",
          description: "A test collection for get operation",
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          metadataSchema: {
            fields: {
              title: {
                type: "text",
                required: true,
                description: "Item title",
              },
            },
          },
        },
        timestamp: expect.any(String),
      });

      // ownerId should not be included in response for security
      expect(getResponse.body.data).not.toHaveProperty("ownerId");
    });

    it("should return 404 when collection not found", async () => {
      const response = await request(app)
        .get("/api/v1/collections/550e8400-e29b-41d4-a716-446655440000")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Collection not found",
        },
        timestamp: expect.any(String),
      });
    });

    it("should return 400 when collection id is invalid", async () => {
      const response = await request(app)
        .get("/api/v1/collections/invalid-uuid")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: expect.stringContaining("UUID"),
        },
        timestamp: expect.any(String),
      });
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .get("/api/v1/collections/550e8400-e29b-41d4-a716-446655440000")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("PUT /api/v1/collections/:id", () => {
    it("should update a collection successfully", async () => {
      // First create a collection
      const createResponse = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Original Collection",
          description: "Original description",
          metadataSchema: {
            fields: {
              title: {
                type: "text",
                required: true,
                description: "Item title",
              },
            },
          },
        })
        .expect(201);

      const collectionId = createResponse.body.data.id;

      // Then update the collection
      const updateResponse = await request(app)
        .put(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Collection",
          description: "Updated description",
        })
        .expect(200);

      expect(updateResponse.body).toMatchObject({
        success: true,
        data: {
          id: collectionId,
          name: "Updated Collection",
          description: "Updated description",
          updatedAt: expect.any(String),
        },
        timestamp: expect.any(String),
      });

      // ownerId should not be included in response for security
      expect(updateResponse.body.data).not.toHaveProperty("ownerId");
    });

    it("should return 404 when collection not found", async () => {
      const response = await request(app)
        .put("/api/v1/collections/550e8400-e29b-41d4-a716-446655440000")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Collection",
          description: "Updated description",
        })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: expect.stringContaining("not found"),
        },
        timestamp: expect.any(String),
      });
    });

    it("should return 400 when validation fails", async () => {
      // First create a collection
      const createResponse = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Collection",
          description: "Test description",
          metadataSchema: {
            fields: {
              title: {
                type: "text",
                required: true,
                description: "Item title",
              },
            },
          },
        })
        .expect(201);

      const collectionId = createResponse.body.data.id;

      const response = await request(app)
        .put(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          // Missing required name field
          description: "Updated description",
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: expect.stringContaining("name"),
        },
        timestamp: expect.any(String),
      });
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .put("/api/v1/collections/550e8400-e29b-41d4-a716-446655440000")
        .send({
          name: "Updated Collection",
          description: "Updated description",
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("DELETE /api/v1/collections/:id", () => {
    it("should delete a collection successfully", async () => {
      // First create a collection
      const createResponse = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Collection to Delete",
          description: "This collection will be deleted",
          metadataSchema: {
            fields: {
              title: {
                type: "text",
                required: true,
                description: "Item title",
              },
            },
          },
        })
        .expect(201);

      const collectionId = createResponse.body.data.id;

      // Then delete the collection
      const deleteResponse = await request(app)
        .delete(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(204);

      // 204 No Content should have empty body
      expect(deleteResponse.body).toEqual({});
    });

    it("should return 404 when collection not found", async () => {
      const response = await request(app)
        .delete("/api/v1/collections/550e8400-e29b-41d4-a716-446655440000")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: expect.stringContaining("not found"),
        },
        timestamp: expect.any(String),
      });
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .delete("/api/v1/collections/550e8400-e29b-41d4-a716-446655440000")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("GET /api/v1/collections", () => {
    it("should list collections successfully", async () => {
      // First create some collections
      await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Collection 1",
          description: "First collection",
          metadataSchema: {
            fields: {
              title: {
                type: "text",
                required: true,
                description: "Item title",
              },
            },
          },
        })
        .expect(201);

      await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Collection 2",
          description: "Second collection",
          metadataSchema: {
            fields: {
              title: {
                type: "text",
                required: true,
                description: "Item title",
              },
            },
          },
        })
        .expect(201);

      // Then list the collections
      const listResponse = await request(app)
        .get("/api/v1/collections")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body).toMatchObject({
        success: true,
        data: {
          collections: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              description: expect.any(String),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            }),
          ]),
        },
        timestamp: expect.any(String),
      });

      // Should have at least the 2 collections we created
      expect(listResponse.body.data.collections.length).toBeGreaterThanOrEqual(2);

      // ownerId should not be included in response for security
      listResponse.body.data.collections.forEach((collection: any) => {
        expect(collection).not.toHaveProperty("ownerId");
      });
    });

    it("should return empty list when user has no collections", async () => {
      // Use a fresh user token to ensure no collections
      const freshUserContext = await setupE2ETest();
      const freshToken = freshUserContext.accessToken;

      const listResponse = await request(app)
        .get("/api/v1/collections")
        .set("Authorization", `Bearer ${freshToken}`)
        .expect(200);

      expect(listResponse.body).toMatchObject({
        success: true,
        data: {
          collections: [],
        },
        timestamp: expect.any(String),
      });
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .get("/api/v1/collections")
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
        timestamp: expect.any(String),
      });
    });
  });
});
