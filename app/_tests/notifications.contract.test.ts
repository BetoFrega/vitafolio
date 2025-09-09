import { makeExpressApp } from "app/http/express/makeExpressApp";
import supertest from "supertest";
import Express from "express";
import type { Deps } from "app/ports/Deps";

describe("Notifications API Contract Tests", () => {
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

  describe("GET /api/v1/notifications", () => {
    it("should return all notifications for authenticated user", async () => {
      // This test should FAIL until the handler is implemented
      await supertest(app)
        .get("/api/v1/notifications")
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                type: expect.stringMatching(
                  /^(EXPIRATION_WARNING|EXPIRATION_ALERT|ITEM_ADDED)$/,
                ),
                status: expect.stringMatching(/^(UNREAD|READ|DISMISSED)$/),
                title: expect.any(String),
                message: expect.any(String),
                itemId: expect.any(String),
                collectionId: expect.any(String),
                createdAt: expect.any(String),
              }),
            ]),
          );
        });
    });

    it("should support filtering by notification type", async () => {
      await supertest(app)
        .get("/api/v1/notifications")
        .query({ type: "EXPIRATION_WARNING" })
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual(expect.any(Array));
          // All returned notifications should be of the filtered type
          if (res.body.data.length > 0) {
            expect(
              res.body.data.every(
                (n: { type: string }) => n.type === "EXPIRATION_WARNING",
              ),
            ).toBe(true);
          }
        });
    });

    it("should support filtering by status", async () => {
      await supertest(app)
        .get("/api/v1/notifications")
        .query({ status: "UNREAD" })
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual(expect.any(Array));
          // All returned notifications should be unread
          if (res.body.data.length > 0) {
            expect(
              res.body.data.every(
                (n: { status: string }) => n.status === "UNREAD",
              ),
            ).toBe(true);
          }
        });
    });

    it("should support pagination", async () => {
      await supertest(app)
        .get("/api/v1/notifications")
        .query({ page: 1, limit: 10 })
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual(expect.any(Array));
          expect(res.body.pagination).toMatchObject({
            page: 1,
            limit: 10,
            total: expect.any(Number),
            totalPages: expect.any(Number),
          });
        });
    });

    it("should return empty array when no notifications exist", async () => {
      await supertest(app)
        .get("/api/v1/notifications")
        .set("Authorization", "Bearer valid_token")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual([]);
        });
    });

    it("should return 401 for missing authentication", async () => {
      await supertest(app)
        .get("/api/v1/notifications")
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe("UNAUTHORIZED");
        });
    });
  });
});
