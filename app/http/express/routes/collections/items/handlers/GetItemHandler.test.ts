import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import { GetItemHandler } from "./GetItemHandler";
import type { AuthenticatedRequest } from "../../../shared/handlers/AuthenticatedHandler";
import { Result } from "@shared/app/contracts/Result";

// Mock the GetItem use case
const mockGetItem = {
  execute: vi.fn(),
};

// Mock dependencies
const mockDeps: ConstructorParameters<typeof GetItemHandler>[0] = {
  getItem: mockGetItem,
};

describe("GetItemHandler", () => {
  let handler: GetItemHandler;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let responseJsonSpy: Response["json"];
  let responseStatusSpy: Response["status"];

  beforeEach(() => {
    handler = new GetItemHandler(mockDeps);
    responseJsonSpy = vi.fn().mockReturnValue({});
    responseStatusSpy = vi.fn().mockReturnValue({
      json: responseJsonSpy,
    });
    mockResponse = {
      status: responseStatusSpy,
      json: responseJsonSpy,
    };
    mockRequest = {
      user: { id: "user123" },
      params: { id: "item123" },
    };
    vi.clearAllMocks();
  });

  describe("Successful item retrieval", () => {
    it("should get item successfully", async () => {
      // Arrange
      const expectedOutput = {
        id: "item123",
        name: "Test Item",
        collectionId: "collection123",
        metadata: { type: "test", value: 42 },
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };
      mockGetItem.execute.mockResolvedValue(Result.success(expectedOutput));

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockGetItem.execute).toHaveBeenCalledWith({
        itemId: "item123",
        ownerId: "user123",
      });
      expect(responseStatusSpy).toHaveBeenCalledWith(200);
      expect(responseJsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          id: "item123",
          name: "Test Item",
          collectionId: "collection123",
          metadata: { type: "test", value: 42 },
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("Validation errors", () => {
    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      // @ts-expect-error - testing unauthenticated access
      mockRequest.user = undefined;

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(responseStatusSpy).toHaveBeenCalledWith(401);
      expect(responseJsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
        timestamp: expect.any(String),
      });
      expect(mockGetItem.execute).not.toHaveBeenCalled();
    });

    it("should return 400 when item ID is missing", async () => {
      // Arrange
      mockRequest.params = {};

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(responseStatusSpy).toHaveBeenCalledWith(400);
      expect(responseJsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Item ID is required",
        },
        timestamp: expect.any(String),
      });
      expect(mockGetItem.execute).not.toHaveBeenCalled();
    });
  });

  describe("Use case errors", () => {
    it("should return 404 when item not found", async () => {
      // Arrange
      mockGetItem.execute.mockResolvedValue(
        Result.failure(new Error("Item not found")),
      );

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(responseStatusSpy).toHaveBeenCalledWith(404);
      expect(responseJsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Item not found",
        },
        timestamp: expect.any(String),
      });
    });

    it("should handle other use case errors", async () => {
      // Arrange
      mockGetItem.execute.mockResolvedValue(
        Result.failure(new Error("Access denied")),
      );

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(responseStatusSpy).toHaveBeenCalledWith(400);
      expect(responseJsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "USE_CASE_ERROR",
          message: "Access denied",
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("Error scenarios", () => {
    it("should handle unexpected errors", async () => {
      // Arrange
      mockGetItem.execute.mockRejectedValue(
        new Error("Database connection failed"),
      );

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(responseStatusSpy).toHaveBeenCalledWith(500);
      expect(responseJsonSpy).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
        timestamp: expect.any(String),
      });
    });
  });
});
