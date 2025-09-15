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
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
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
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      const calls = jsonSpy.mock.calls;
      expect(calls).toHaveLength(1);
      const responseData = calls[0]?.[0];
      expect(responseData?.data?.user?.id).toBe("specific-user-id");
    });
  });
  describe("unauthenticated request", () => {
    it("should handle missing user in request gracefully", async () => {
      // Arrange
      // @ts-expect-error - testing unauthenticated access
      mockRequest.user = undefined;

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
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
});
