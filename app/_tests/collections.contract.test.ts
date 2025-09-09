import { makeExpressApp } from "app/http/express/makeExpressApp";
import supertest from "supertest";
import Express from "express";
import type { Deps } from "app/ports/Deps";

describe("Collections API Contract Tests", () => {
  let app: Express.Application;
  let deps: Deps;

  beforeEach(() => {
    deps = {
      registerAccount: vi.fn(),
      login: vi.fn(),
      // Placeholder repositories until collections are implemented
      collectionRepository: {},
      // Placeholder repositories until collections are implemented
      itemRepository: {},
      // Placeholder repositories until collections are implemented
      notificationRepository: {},
    };
    ({ app } = makeExpressApp(deps));
  });

  describe("POST /api/v1/collections", () => {
    it("should create a new collection successfully", async () => {
      const newCollection = {
        name: "My Library",
        description: "Books I want to read",
        schema: {
          fields: [
            { name: "title", type: "string", required: true },
            { name: "author", type: "string", required: true },
            { name: "isbn", type: "string", required: false },
          ],
        },
      };

      // This test should FAIL until the handler is implemented
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
            schema: newCollection.schema,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
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
      // This test should FAIL until the handler is implemented
      await supertest(app)
        .get("/api/v1/collections")
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual(
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
      await supertest(app)
        .get("/api/v1/collections")
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual([]);
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
