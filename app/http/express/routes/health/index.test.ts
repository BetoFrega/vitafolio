import { describe, it, expect, beforeEach } from "vitest";
import express from "express";
import { buildHealthRoutes } from "./index";

describe("Health Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe("buildHealthRoutes", () => {
    it("should return an Express router", () => {
      const router = buildHealthRoutes();

      // Express routers have specific properties that identify them
      expect(router).toBeDefined();
      expect(typeof router).toBe("function");
      // Express routers have a stack property for middleware/routes
      expect(router).toHaveProperty("stack");
    });

    it("should register routes properly", () => {
      const router = buildHealthRoutes();

      // Check that the router has registered routes
      expect(router.stack).toBeDefined();
      expect(router.stack.length).toBeGreaterThan(0);
    });
  });

  describe("Health endpoint integration", () => {
    it("should be possible to mount router in express app", () => {
      const router = buildHealthRoutes();

      // This should not throw an error
      expect(() => {
        app.use(router);
      }).not.toThrow();
    });

    it("should create handler instance properly", () => {
      // This tests that the module can be instantiated without errors
      expect(() => {
        buildHealthRoutes();
      }).not.toThrow();
    });
  });
});
