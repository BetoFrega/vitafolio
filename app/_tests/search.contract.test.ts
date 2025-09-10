import { makeExpressApp } from "app/http/express/makeExpressApp";
import supertest from "supertest";
import Express from "express";
import type { Deps } from "app/ports/Deps";
import { createMockDepsForContract } from "./helpers/mockDeps";

describe("Search API Contract Tests", () => {
  let app: Express.Application;
  let deps: Deps;

  beforeEach(() => {
    deps = createMockDepsForContract();
    ({ app } = makeExpressApp(deps));
  });

  describe("GET /api/v1/items/search", () => {
    it("should search items by text query", async () => {
      const searchQuery = "gatsby";

      // This test should FAIL until the handler is implemented
      await supertest(app)
        .get("/api/v1/items/search")
        .query({ q: searchQuery })
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                collectionId: expect.any(String),
                metadata: expect.any(Object),
                relevanceScore: expect.any(Number),
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
              }),
            ]),
          );
        });
    });

    it("should search items by collection filter", async () => {
      const collectionId = "col_123";

      await supertest(app)
        .get("/api/v1/items/search")
        .query({ collectionId: collectionId })
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual(expect.any(Array));
          // All returned items should belong to the specified collection
          if (res.body.data.length > 0) {
            expect(
              res.body.data.every(
                (item: { collectionId: string }) =>
                  item.collectionId === collectionId,
              ),
            ).toBe(true);
          }
        });
    });

    it("should search items with expiration date filters", async () => {
      await supertest(app)
        .get("/api/v1/items/search")
        .query({
          expirationBefore: "2025-12-31",
          expirationAfter: "2025-01-01",
        })
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual(expect.any(Array));
        });
    });

    it("should support pagination in search results", async () => {
      await supertest(app)
        .get("/api/v1/items/search")
        .query({
          q: "book",
          page: 1,
          limit: 5,
        })
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual(expect.any(Array));
          expect(res.body.pagination).toMatchObject({
            page: 1,
            limit: 5,
            total: expect.any(Number),
            totalPages: expect.any(Number),
          });
        });
    });

    it("should return empty results for non-matching query", async () => {
      await supertest(app)
        .get("/api/v1/items/search")
        .query({ q: "nonexistentitem12345" })
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual([]);
        });
    });

    it("should return 400 for empty search query", async () => {
      await supertest(app)
        .get("/api/v1/items/search")
        .set("Authorization", "Bearer valid_token")
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("VALIDATION_ERROR");
          expect(res.body.error.message).toContain("search query");
        });
    });

    it("should return 401 for missing authentication", async () => {
      await supertest(app)
        .get("/api/v1/items/search")
        .query({ q: "test" })
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("UNAUTHORIZED");
        });
    });
  });
});
