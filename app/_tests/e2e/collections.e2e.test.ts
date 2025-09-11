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
});
