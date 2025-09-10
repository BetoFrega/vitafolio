import { makeExpressApp } from "app/http/express/makeExpressApp";
import supertest from "supertest";
import Express from "express";
import type { Deps } from "app/ports/Deps";
import { createMockDeps } from "./helpers/mockDeps";

describe("Collection Detail Contract Tests", () => {
  let app: Express.Application;
  let deps: Deps;

  beforeEach(() => {
    deps = createMockDeps();
    ({ app } = makeExpressApp(deps));
  });

  describe("GET /api/v1/collections/{id}", () => {
    it("should return collection details for valid ID", async () => {
      const collectionId = "col_123";

      // This test should FAIL until the handler is implemented
      await supertest(app)
        .get(`/api/v1/collections/${collectionId}`)
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toMatchObject({
            id: collectionId,
            name: expect.any(String),
            description: expect.any(String),
            schema: expect.any(Object),
            itemCount: expect.any(Number),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });

    it("should return 404 for non-existent collection", async () => {
      const nonExistentId = "col_999";

      await supertest(app)
        .get(`/api/v1/collections/${nonExistentId}`)
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
        .get(`/api/v1/collections/${collectionId}`)
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("UNAUTHORIZED");
        });
    });
  });

  describe("PUT /api/v1/collections/{id}", () => {
    it("should update collection successfully", async () => {
      const collectionId = "col_123";
      const updateData = {
        name: "Updated Library",
        description: "Updated description",
        schema: {
          fields: [
            { name: "title", type: "string", required: true },
            { name: "author", type: "string", required: true },
            { name: "genre", type: "string", required: false },
          ],
        },
      };

      // This test should FAIL until the handler is implemented
      await supertest(app)
        .put(`/api/v1/collections/${collectionId}`)
        .set("Authorization", "Bearer valid_token")
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toMatchObject({
            id: collectionId,
            name: updateData.name,
            description: updateData.description,
            schema: updateData.schema,
            updatedAt: expect.any(String),
          });
        });
    });

    it("should return 400 for invalid update data", async () => {
      const collectionId = "col_123";
      const invalidData = {
        name: "", // Empty name should be invalid
        description: "Valid description",
      };

      await supertest(app)
        .put(`/api/v1/collections/${collectionId}`)
        .set("Authorization", "Bearer valid_token")
        .send(invalidData)
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("VALIDATION_ERROR");
        });
    });

    it("should return 404 for non-existent collection", async () => {
      const nonExistentId = "col_999";
      const updateData = {
        name: "Updated Library",
        description: "Updated description",
      };

      await supertest(app)
        .put(`/api/v1/collections/${nonExistentId}`)
        .set("Authorization", "Bearer valid_token")
        .send(updateData)
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("NOT_FOUND");
        });
    });

    it("should return 401 for missing authentication", async () => {
      const collectionId = "col_123";
      const updateData = {
        name: "Updated Library",
        description: "Updated description",
      };

      await supertest(app)
        .put(`/api/v1/collections/${collectionId}`)
        .send(updateData)
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("UNAUTHORIZED");
        });
    });
  });

  describe("DELETE /api/v1/collections/{id}", () => {
    it("should delete collection successfully", async () => {
      const collectionId = "col_123";

      // This test should FAIL until the handler is implemented
      await supertest(app)
        .delete(`/api/v1/collections/${collectionId}`)
        .set("Authorization", "Bearer valid_token")
        .expect(204);
    });

    it("should return 404 for non-existent collection", async () => {
      const nonExistentId = "col_999";

      await supertest(app)
        .delete(`/api/v1/collections/${nonExistentId}`)
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
        .delete(`/api/v1/collections/${collectionId}`)
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("UNAUTHORIZED");
        });
    });
  });
});
