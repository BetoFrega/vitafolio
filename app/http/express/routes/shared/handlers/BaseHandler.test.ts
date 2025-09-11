import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { BaseHandler } from "./BaseHandler";
import type { ApiError } from "../responses";

// Concrete implementations for testing different scenarios
class SuccessTestHandler<T> extends BaseHandler<T> {
  constructor(
    private testData: T,
    private statusCode: number = 200,
  ) {
    super();
  }

  async handle(req: Request, res: Response): Promise<void> {
    this.sendSuccess(res, this.testData, this.statusCode);
  }
}

class ErrorTestHandler extends BaseHandler {
  constructor(
    private error: ApiError,
    private statusCode: number = 400,
  ) {
    super();
  }

  async handle(req: Request, res: Response): Promise<void> {
    this.sendError(res, this.error, this.statusCode);
  }
}

describe("BaseHandler", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });

    mockRequest = {};
    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    };
  });

  describe("sendSuccess method via handle()", () => {
    it("should send success response with correct format", async () => {
      const testData = { id: "123", name: "Test Item" };
      const handler = new SuccessTestHandler(testData, 200);

      await handler.handle(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: testData,
        timestamp: expect.any(String),
      });

      // Verify timestamp is valid ISO string
      const response = jsonSpy.mock.calls[0]?.[0];
      expect(response).toBeDefined();
      expect(new Date(response.timestamp).toISOString()).toBe(
        response.timestamp,
      );
    });

    it("should use default status 200 when not specified", async () => {
      const testData = { message: "success" };
      const handler = new SuccessTestHandler(testData); // default status

      await handler.handle(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: testData,
        timestamp: expect.any(String),
      });
    });

    it("should handle different status codes", async () => {
      const testData = { id: "456" };
      const handler = new SuccessTestHandler(testData, 201);

      await handler.handle(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(201);
    });

    it("should handle null data", async () => {
      const handler = new SuccessTestHandler(null);

      await handler.handle(mockRequest as Request, mockResponse as Response);

      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: null,
        timestamp: expect.any(String),
      });
    });
  });

  describe("sendError method via handle()", () => {
    it("should send error response with correct format", async () => {
      const error: ApiError = {
        code: "VALIDATION_ERROR",
        message: "Required field missing",
      };
      const handler = new ErrorTestHandler(error, 400);

      await handler.handle(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Required field missing",
        },
        timestamp: expect.any(String),
      });

      // Verify timestamp is valid ISO string
      const response = jsonSpy.mock.calls[0]?.[0];
      expect(response).toBeDefined();
      expect(new Date(response.timestamp).toISOString()).toBe(
        response.timestamp,
      );
    });

    it("should use default status 400 when not specified", async () => {
      const error: ApiError = {
        code: "BAD_REQUEST",
        message: "Invalid input",
      };
      const handler = new ErrorTestHandler(error); // default status

      await handler.handle(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
    });

    it("should handle different error status codes", async () => {
      const error: ApiError = {
        code: "NOT_FOUND",
        message: "Resource not found",
      };
      const handler = new ErrorTestHandler(error, 404);

      await handler.handle(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(404);
    });
  });

  describe("abstract handle method", () => {
    it("should require implementation of handle method", async () => {
      const handler = new SuccessTestHandler({ message: "test success" });

      await handler.handle(mockRequest as Request, mockResponse as Response);

      // Verify that our test implementation was called
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: { message: "test success" },
        timestamp: expect.any(String),
      });
    });

    it("should work with error responses in handle method", async () => {
      const error: ApiError = {
        code: "TEST_ERROR",
        message: "Test error message",
      };
      const handler = new ErrorTestHandler(error);

      await handler.handle(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "TEST_ERROR",
          message: "Test error message",
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("type safety", () => {
    it("should maintain type safety for generic data types", async () => {
      interface TestData {
        id: string;
        name: string;
      }

      const data: TestData = { id: "123", name: "Test" };
      const handler = new SuccessTestHandler(data);

      await handler.handle(mockRequest as Request, mockResponse as Response);

      const response = jsonSpy.mock.calls[0]?.[0];
      expect(response).toBeDefined();
      expect(response.data.id).toBe("123");
      expect(response.data.name).toBe("Test");
    });
  });
});
