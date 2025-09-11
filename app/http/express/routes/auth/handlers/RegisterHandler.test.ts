import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response } from "express";
import { RegisterHandler } from "./RegisterHandler";
import type { RegisterAccountDeps } from "app/ports/Deps";
import { Result } from "@shared/app/contracts/Result";

// Mock the RegisterAccount use case
const mockRegisterAccountExecute = vi.fn();
const mockRegisterAccount = {
  execute: mockRegisterAccountExecute,
} as unknown as RegisterAccountDeps["registerAccount"];

describe("RegisterHandler", () => {
  let mockDeps: RegisterAccountDeps;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;
  let handler: RegisterHandler;

  beforeEach(() => {
    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });

    mockResponse = {
      status: statusSpy,
      json: jsonSpy,
    };

    mockDeps = {
      registerAccount: mockRegisterAccount,
    };

    mockRequest = {
      body: {
        email: "test@example.com",
        password: "password123",
      },
    };

    handler = new RegisterHandler(mockDeps);

    // Reset mocks
    vi.clearAllMocks();
  });

  describe("successful registration", () => {
    it("should return success response with standardized format", async () => {
      // Arrange
      mockRegisterAccountExecute.mockResolvedValue(Result.success(undefined));

      // Act
      await handler.handle(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          message: "Account registered successfully",
        },
        timestamp: expect.any(String),
      });
    });

    it("should use 201 status code for successful registration", async () => {
      // Arrange
      mockRegisterAccountExecute.mockResolvedValue(Result.success(undefined));

      // Act
      await handler.handle(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(201);
    });
  });

  describe("registration failure", () => {
    it("should return USER_ALREADY_EXISTS error for existing email", async () => {
      // Arrange
      mockRegisterAccountExecute.mockResolvedValue(
        Result.failure(
          new Error("User with email test@example.com already exists"),
        ),
      );

      // Act
      await handler.handle(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(409);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "USER_ALREADY_EXISTS",
          message: "User with email test@example.com already exists",
        },
        timestamp: expect.any(String),
      });
    });

    it("should return generic registration error for other failures", async () => {
      // Arrange
      mockRegisterAccountExecute.mockResolvedValue(
        Result.failure(new Error("Some other error")),
      );

      // Act
      await handler.handle(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "REGISTRATION_FAILED",
          message: "Some other error",
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

    it("should return validation error for short password", async () => {
      // Arrange
      mockRequest.body = {
        email: "test@example.com",
        password: "123", // too short
      };

      // Act
      await handler.handle(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: expect.stringContaining(
            "Password must be at least 8 characters long",
          ),
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("inheritance from BaseHandler", () => {
    it("should properly extend BaseHandler and use sendSuccess method", async () => {
      // This test verifies the handler properly inherits from BaseHandler
      mockRegisterAccountExecute.mockResolvedValue(Result.success(undefined));

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
