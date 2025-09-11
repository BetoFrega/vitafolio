import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import { GetCollectionHandler } from "./GetCollectionHandler";
import { Result } from "@shared/app/contracts/Result";
import type { AuthenticatedRequest } from "../../shared/handlers/AuthenticatedHandler";

// Mock dependencies - use unknown to bypass strict typing for tests
const mockGetCollection = {
  execute: vi.fn(),
} as unknown as import("@collections/app/GetCollection").GetCollection;

describe("GetCollectionHandler", () => {
  let handler: GetCollectionHandler;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create handler instance
    handler = new GetCollectionHandler({ getCollection: mockGetCollection });

    // Setup mock response
    mockJson = vi.fn().mockReturnThis();
    mockStatus = vi.fn().mockReturnThis();
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    // Setup mock request
    mockRequest = {
      user: { id: "user-123" },
      params: {
        id: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID
      },
    };
  });

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      // Arrange
      delete mockRequest.user;

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
        timestamp: expect.any(String),
      });
      expect(mockGetCollection.execute).not.toHaveBeenCalled();
    });
  });

  describe("Validation", () => {
    it("should return 400 when collection id is missing", async () => {
      // Arrange
      mockRequest.params = {};

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: expect.stringContaining("id"),
        },
        timestamp: expect.any(String),
      });
      expect(mockGetCollection.execute).not.toHaveBeenCalled();
    });

    it("should return 400 when collection id is not a valid UUID", async () => {
      // Arrange
      mockRequest.params = { id: "invalid-uuid" };

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: expect.stringContaining("UUID"),
        },
        timestamp: expect.any(String),
      });
      expect(mockGetCollection.execute).not.toHaveBeenCalled();
    });
  });

  describe("Success scenarios", () => {
    it("should get collection successfully", async () => {
      // Arrange
      const expectedResult = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Test Collection",
        description: "A test collection",
        ownerId: "user-123",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
        updatedAt: new Date("2024-01-01T10:00:00.000Z"),
        metadataSchema: {
          fields: {
            title: {
              type: "text" as const,
              required: true,
              description: "Item title",
            },
          },
        },
      };
      (mockGetCollection.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        Result.success(expectedResult),
      );

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockGetCollection.execute).toHaveBeenCalledWith({
        collectionId: "550e8400-e29b-41d4-a716-446655440000",
        ownerId: "user-123",
      });

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test Collection",
          description: "A test collection",
          createdAt: expectedResult.createdAt,
          updatedAt: expectedResult.updatedAt,
          metadataSchema: expectedResult.metadataSchema,
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("Error scenarios", () => {
    it("should handle collection not found", async () => {
      // Arrange
      const error = new Error("Collection not found");
      (mockGetCollection.execute as ReturnType<typeof vi.fn>).mockResolvedValue(
        Result.failure(error),
      );

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Collection not found",
        },
        timestamp: expect.any(String),
      });
    });

    it("should handle unexpected errors", async () => {
      // Arrange
      (mockGetCollection.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Database connection failed"),
      );

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
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
