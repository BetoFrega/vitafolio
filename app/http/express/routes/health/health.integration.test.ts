import { describe, it, expect, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { buildHealthRoutes } from "./index";

describe("Health Routes Integration", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mount health routes
    const healthRouter = buildHealthRoutes();
    app.use(healthRouter);
  });

  describe("GET /health", () => {
    it("should return health status with standardized response format", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: { ok: true },
        timestamp: expect.any(String),
      });

      // Verify timestamp is a valid ISO string
      expect(response.body.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it("should return JSON content type", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });

    it("should be fast (under 100ms)", async () => {
      const startTime = Date.now();

      await request(app).get("/health").expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });
  });
});
