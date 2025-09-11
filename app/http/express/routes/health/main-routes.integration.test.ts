import { describe, it, expect, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { buildRoutes } from "../index";
import type { Deps } from "../../../../ports/Deps";

// Mock deps for testing (health endpoint doesn't need any dependencies)
const mockDeps = {} as Deps;

describe("Main Routes Integration with Health Module", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mount main routes with health module integrated
    const mainRouter = buildRoutes(mockDeps);
    app.use(mainRouter);
  });

  describe("Health endpoint integration", () => {
    it("should respond to GET /health with new standardized format", async () => {
      const response = await request(app).get("/health").expect(200);

      // Verify it uses the new standardized response format
      expect(response.body).toMatchObject({
        success: true,
        data: { ok: true },
        timestamp: expect.any(String),
      });

      // Should NOT be the old format: { ok: true }
      expect(response.body).not.toEqual({ ok: true });
    });

    it("should maintain backward compatibility in data content", async () => {
      const response = await request(app).get("/health").expect(200);

      // The actual health data should still contain { ok: true }
      expect(response.body.data).toEqual({ ok: true });
    });

    it("should coexist with other routes", async () => {
      // Health should work
      await request(app).get("/health").expect(200);

      // Other routes should still be accessible (even if they return different status codes)
      // We're just testing that routing works, not the actual functionality
      const registerResponse = await request(app).post("/register").send({});

      // Should get some response (may be 400 for validation, but not 404)
      expect([200, 400, 422, 500]).toContain(registerResponse.status);
    });
  });
});
