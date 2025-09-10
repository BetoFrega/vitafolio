import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { setupE2ETest, type E2ETestContext } from "../helpers/e2e-setup";
import type { Application } from "express";

describe("Health E2E Tests", () => {
  let app: Application;

  beforeEach(async () => {
    const setup: E2ETestContext = await setupE2ETest();
    app = setup.app;
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

    it("should not require authentication", async () => {
      // Health endpoint should be publicly accessible
      await request(app).get("/health").expect(200);
    });

    it("should maintain backward compatibility in data format", async () => {
      const response = await request(app).get("/health").expect(200);

      // The health data should contain the expected structure
      expect(response.body.data).toEqual({ ok: true });

      // Should use new standardized response wrapper
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("timestamp");
    });

    it("should be idempotent", async () => {
      // Multiple calls should return the same result
      const response1 = await request(app).get("/health").expect(200);

      const response2 = await request(app).get("/health").expect(200);

      expect(response1.body.data).toEqual(response2.body.data);
      expect(response1.body.success).toBe(response2.body.success);
    });
  });
});
