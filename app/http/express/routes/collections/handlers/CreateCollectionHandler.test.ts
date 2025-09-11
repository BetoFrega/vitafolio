import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import { CreateCollectionHandler } from "./CreateCollectionHandler";
import { Result } from "@shared/app/contracts/Result";
import type { AuthenticatedRequest } from "../../shared/handlers/AuthenticatedHandler";

// Mock dependencies - use unknown to bypass strict typing for tests
const mockCreateCollection = {
  execute: vi.fn(),
} as unknown as import("@collections/app/CreateCollection").CreateCollection;

describe("CreateCollectionHandler", () => {
  let handler: CreateCollectionHandler;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create handler instance
    handler = new CreateCollectionHandler({
      createCollection: mockCreateCollection,
    });

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
      body: {
        name: "Test Collection",
        description: "A test collection",
        metadataSchema: {
          fields: {
            title: {
              type: "text" as const,
              required: true,
              description: "Item title",
            },
          },
        },
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
      expect(mockCreateCollection.execute).not.toHaveBeenCalled();
    });
  });

  describe("Validation", () => {
    it("should return 400 when name is missing", async () => {
      // Arrange
      mockRequest.body = {
        // name is missing
        description: "A test collection",
        metadataSchema: { fields: {} },
      };

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
          message: expect.stringContaining("name"),
        },
        timestamp: expect.any(String),
      });
      expect(mockCreateCollection.execute).not.toHaveBeenCalled();
    });

    it("should return 400 when metadataSchema is missing", async () => {
      // Arrange
      mockRequest.body = {
        name: "Test Collection",
        description: "A test collection",
        // metadataSchema is missing
      };

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
          message: expect.stringContaining("metadataSchema"),
        },
        timestamp: expect.any(String),
      });
      expect(mockCreateCollection.execute).not.toHaveBeenCalled();
    });

    it("should accept empty description", async () => {
      // Arrange
      mockRequest.body = {
        name: "Test Collection",
        metadataSchema: { fields: {} },
      };
      (
        mockCreateCollection.execute as ReturnType<typeof vi.fn>
      ).mockResolvedValue(
        Result.success({
          id: "collection-123",
          name: "Test Collection",
          description: "",
          ownerId: "user-123",
          createdAt: new Date("2024-01-01T10:00:00.000Z"),
          updatedAt: new Date("2024-01-01T10:00:00.000Z"),
        }),
      );

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockCreateCollection.execute).toHaveBeenCalledWith({
        name: "Test Collection",
        description: "",
        ownerId: "user-123",
        metadataSchema: { fields: {} },
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
    });
  });

  describe("Success scenarios", () => {
    it("should create collection successfully with all fields", async () => {
      // Arrange
      const expectedResult = {
        id: "collection-123",
        name: "Test Collection",
        description: "A test collection",
        ownerId: "user-123",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
        updatedAt: new Date("2024-01-01T10:00:00.000Z"),
      };
      (
        mockCreateCollection.execute as ReturnType<typeof vi.fn>
      ).mockResolvedValue(Result.success(expectedResult));

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockCreateCollection.execute).toHaveBeenCalledWith({
        name: "Test Collection",
        description: "A test collection",
        ownerId: "user-123",
        metadataSchema: {
          fields: {
            title: {
              type: "text",
              required: true,
              description: "Item title",
            },
          },
        },
      });

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          id: "collection-123",
          name: "Test Collection",
          description: "A test collection",
          createdAt: expectedResult.createdAt,
          updatedAt: expectedResult.updatedAt,
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("Error scenarios", () => {
    it("should handle use case failure", async () => {
      // Arrange
      const error = new Error("Collection name already exists");
      (
        mockCreateCollection.execute as ReturnType<typeof vi.fn>
      ).mockResolvedValue(Result.failure(error));

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
          code: "USE_CASE_ERROR",
          message: "Collection name already exists",
        },
        timestamp: expect.any(String),
      });
    });

    it("should handle unexpected errors", async () => {
      // Arrange
      (
        mockCreateCollection.execute as ReturnType<typeof vi.fn>
      ).mockRejectedValue(new Error("Database connection failed"));

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
