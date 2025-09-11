import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import {
  AuthenticatedHandler,
  type AuthenticatedRequest,
} from "./AuthenticatedHandler";
import type { ApiError } from "../responses";

// Concrete test implementations
class TestAuthenticatedHandler<T> extends AuthenticatedHandler<T> {
  constructor(private testData: T) {
    super();
  }

  protected async handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void> {
    // Simple test implementation - just return the test data with user ID
    this.sendSuccess(res, {
      ...this.testData,
      authenticatedUserId: userId,
    } as T);
  }
}

class TestErrorAuthenticatedHandler extends AuthenticatedHandler {
  protected async handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void> {
    const error: ApiError = {
      code: "TEST_ERROR",
      message: "Test error in authenticated handler",
    };
    this.sendError(res, error);
  }
}

describe("AuthenticatedHandler", () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });

    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    };
  });

  describe("authentication flow", () => {
    it("should extract user ID and call handleAuthenticated when user is present", async () => {
      const testData = { message: "test data" };
      const handler = new TestAuthenticatedHandler(testData);

      mockRequest = {
        user: { id: "user123" },
      };

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: { ...testData, authenticatedUserId: "user123" },
        timestamp: expect.any(String),
      });
    });

    it("should return unauthorized error when user is not present", async () => {
      const handler = new TestAuthenticatedHandler({ message: "test" });

      mockRequest = {}; // No user property

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
        timestamp: expect.any(String),
      });
    });

    it("should return unauthorized error when user.id is missing", async () => {
      const handler = new TestAuthenticatedHandler({ message: "test" });

      mockRequest = {
        user: {} as { id: string }, // User object exists but no id
      };

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
        timestamp: expect.any(String),
      });
    });

    it("should return unauthorized error when user.id is empty string", async () => {
      const handler = new TestAuthenticatedHandler({ message: "test" });

      mockRequest = {
        user: { id: "" }, // Empty user ID
      };

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("handleAuthenticated delegation", () => {
    it("should pass the correct user ID to handleAuthenticated", async () => {
      const testData = { itemId: "123" };
      const handler = new TestAuthenticatedHandler(testData);

      mockRequest = {
        user: { id: "user456" },
      };

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Verify the user ID was passed correctly to handleAuthenticated
      const response = jsonSpy.mock.calls[0]?.[0];
      expect(response).toBeDefined();
      expect(response.data.authenticatedUserId).toBe("user456");
    });

    it("should allow handleAuthenticated to return errors", async () => {
      const handler = new TestErrorAuthenticatedHandler();

      mockRequest = {
        user: { id: "user789" },
      };

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "TEST_ERROR",
          message: "Test error in authenticated handler",
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("type safety", () => {
    it("should maintain type safety with generic data types", async () => {
      interface TestData {
        userId: string;
        itemName: string;
      }

      const testData: TestData = { userId: "original", itemName: "Test Item" };
      const handler = new TestAuthenticatedHandler<TestData>(testData);

      mockRequest = {
        user: { id: "auth-user" },
      };

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      const response = jsonSpy.mock.calls[0]?.[0];
      expect(response).toBeDefined();
      expect(response.data.itemName).toBe("Test Item");
      expect(response.data.authenticatedUserId).toBe("auth-user");
    });
  });

  describe("inheritance from BaseHandler", () => {
    it("should have access to sendSuccess and sendError methods", async () => {
      // This test verifies that AuthenticatedHandler properly extends BaseHandler
      // and has access to the protected methods
      const handler = new TestAuthenticatedHandler({ test: "data" });

      mockRequest = {
        user: { id: "user123" },
      };

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Verify the response format matches BaseHandler's sendSuccess format
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object),
        timestamp: expect.any(String),
      });
    });
  });
});
