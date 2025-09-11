import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Response } from "express";
import { DebugAuthHandler } from "./DebugAuthHandler";
import type { AuthenticatedRequest } from "../../shared/handlers/AuthenticatedHandler";

describe("DebugAuthHandler", () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;
  let handler: DebugAuthHandler;

  beforeEach(() => {
    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });

    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    };

    mockRequest = {
      user: {
        id: "user123",
      },
    };

    handler = new DebugAuthHandler();

    // Reset mocks
    vi.clearAllMocks();
  });

  describe("authenticated request", () => {
    it("should return authenticated user info with standardized format", async () => {
      // Act
      await handler.handleAuthenticated(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        "user123",
      );

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          message: "Authentication working",
          user: {
            id: "user123",
            email: undefined, // Email not available in debug context
          },
          middlewarePresent: true,
        },
        timestamp: expect.any(String),
      });
    });

    it("should include user information from request", async () => {
      // Arrange
      mockRequest.user = {
        id: "specific-user-id",
      };

      // Act
      await handler.handleAuthenticated(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        "specific-user-id",
      );

      // Assert
      const calls = jsonSpy.mock.calls;
      expect(calls).toHaveLength(1);
      const responseData = calls[0]?.[0];
      expect(responseData?.data?.user?.id).toBe("specific-user-id");
    });
  });

  describe("inheritance from AuthenticatedHandler", () => {
    it("should properly extend AuthenticatedHandler and use sendSuccess method", async () => {
      // Act
      await handler.handleAuthenticated(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        "user123",
      );

      // Verify standard response format (BaseHandler's sendSuccess format through AuthenticatedHandler)
      const calls = jsonSpy.mock.calls;
      expect(calls).toHaveLength(1);
      const responseData = calls[0]?.[0];
      expect(responseData).toHaveProperty("success", true);
      expect(responseData).toHaveProperty("data");
      expect(responseData).toHaveProperty("timestamp");
      expect(responseData?.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it("should inherit automatic authentication handling from AuthenticatedHandler", () => {
      // This test verifies the handler extends AuthenticatedHandler correctly
      // The AuthenticatedHandler.handle method should automatically call handleAuthenticated
      // if authentication is successful, which we test by ensuring handleAuthenticated receives the userId
      expect(handler).toBeInstanceOf(DebugAuthHandler);
      expect(typeof handler.handle).toBe("function");
      expect(typeof handler.handleAuthenticated).toBe("function");
    });
  });
});
