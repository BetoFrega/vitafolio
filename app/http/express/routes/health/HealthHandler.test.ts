import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { HealthHandler } from "./HealthHandler";

describe("HealthHandler", () => {
  let handler: HealthHandler;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handler = new HealthHandler();
    mockRequest = {};
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
  });

  describe("handle", () => {
    it("should return health check status with 200", async () => {
      await handler.handle(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { ok: true },
        timestamp: expect.any(String),
      });
    });

    it("should return timestamp in ISO format", async () => {
      const beforeCall = new Date().toISOString();
      await handler.handle(mockRequest as Request, mockResponse as Response);
      const afterCall = new Date().toISOString();

      const callArgs = mockJson.mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      const timestamp = callArgs.timestamp;

      // Verify timestamp is a valid ISO string within reasonable time range
      expect(timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(timestamp >= beforeCall).toBe(true);
      expect(timestamp <= afterCall).toBe(true);
    });

    it("should include the expected health data structure", async () => {
      await handler.handle(mockRequest as Request, mockResponse as Response);

      const callArgs = mockJson.mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      expect(callArgs).toMatchObject({
        success: true,
        data: { ok: true },
        timestamp: expect.any(String),
      });
    });

    it("should extend BaseHandler properly", () => {
      // Verify that HealthHandler follows the class-based approach
      expect(handler).toHaveProperty("handle");
      expect(typeof handler.handle).toBe("function");
    });
  });
});
