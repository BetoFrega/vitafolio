import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response } from "express";
import { LoginHandler } from "./LoginHandler";
import type { LoginDeps } from "app/ports/Deps";
import { Result } from "@shared/app/contracts/Result";

// Mock the Login use case
const mockLoginExecute = vi.fn();
const mockLogin = {
  execute: mockLoginExecute,
} as unknown as LoginDeps["login"];

describe("LoginHandler", () => {
  let mockDeps: LoginDeps;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;
  let handler: LoginHandler;

  beforeEach(() => {
    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });

    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    };

    mockDeps = {
      login: mockLogin,
    };

    mockRequest = {
      body: {
        email: "test@example.com",
        password: "password123",
      },
    };

    handler = new LoginHandler(mockDeps);

    // Reset mocks
    vi.clearAllMocks();
  });

  describe("successful login", () => {
    it("should return success response with standardized format", async () => {
      // Arrange
      const loginResult = {
        accessToken: "access-token-123",
        refreshToken: "refresh-token-456",
      };
      mockLoginExecute.mockResolvedValue(Result.success(loginResult));

      // Act
      await handler.handle(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          token: "access-token-123", // Note: using 'token' for consistency with E2E tests
        },
        timestamp: expect.any(String),
      });
    });

    it("should use accessToken from login result as token in response", async () => {
      // Arrange
      const loginResult = {
        accessToken: "specific-access-token",
        refreshToken: "specific-refresh-token",
      };
      mockLoginExecute.mockResolvedValue(Result.success(loginResult));

      // Act
      await handler.handle(mockRequest as Request, mockResponse as Response);

      // Assert
      const calls = jsonSpy.mock.calls;
      expect(calls).toHaveLength(1);
      const responseData = calls[0]?.[0];
      expect(responseData?.data?.token).toBe("specific-access-token");
    });
  });

  describe("authentication failure", () => {
    it("should return AUTHENTICATION_FAILED error with standardized format", async () => {
      // Arrange
      mockLoginExecute.mockResolvedValue(
        Result.failure(new Error("Authentication failed")),
      );

      // Act
      await handler.handle(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "AUTHENTICATION_FAILED",
          message: "Authentication failed",
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("request validation", () => {
    it("should return validation error for missing email", async () => {
      // Arrange
      mockRequest.body = { password: "password123" };

      // Act
      await handler.handle(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: expect.stringContaining("email"),
        },
        timestamp: expect.any(String),
      });
    });

    it("should return validation error for missing password", async () => {
      // Arrange
      mockRequest.body = { email: "test@example.com" };

      // Act
      await handler.handle(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: expect.stringContaining("password"),
        },
        timestamp: expect.any(String),
      });
    });

    it("should return validation error for invalid email format", async () => {
      // Arrange
      mockRequest.body = {
        email: "invalid-email",
        password: "password123",
      };

      // Act
      await handler.handle(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: expect.stringContaining("email"),
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("inheritance from BaseHandler", () => {
    it("should properly extend BaseHandler and use sendSuccess method", async () => {
      // This test verifies the handler properly inherits from BaseHandler
      const loginResult = {
        accessToken: "test-token",
        refreshToken: "test-refresh",
      };
      mockLoginExecute.mockResolvedValue(Result.success(loginResult));

      await handler.handle(mockRequest as Request, mockResponse as Response);

      // Verify standard response format (BaseHandler's sendSuccess format)
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
  });
});
