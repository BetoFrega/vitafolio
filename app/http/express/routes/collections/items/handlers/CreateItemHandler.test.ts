import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import { CreateItemHandler } from "./CreateItemHandler";
import type { AuthenticatedRequest } from "../../../shared/handlers/AuthenticatedHandler";
import { Result } from "@shared/app/contracts/Result";

// Mock the AddItemToCollection use case
const mockAddItemToCollection = {
  execute: vi.fn(),
};

// Mock dependencies
const mockDeps = {
  addItemToCollection: mockAddItemToCollection,
};

describe("CreateItemHandler", () => {
  let handler: CreateItemHandler;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let responseJsonSpy: any;
  let responseStatusSpy: any;

  beforeEach(() => {
    handler = new CreateItemHandler(mockDeps);
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
      params: { collectionId: "collection123" },
      body: {
        name: "Test Item",
        metadata: { type: "test", value: 42 },
      },
    };
    vi.clearAllMocks();
  });

  describe("Successful item creation", () => {
    it("should create item successfully with valid data", async () => {
      // Arrange
      const expectedOutput = {
        id: "item123",
        name: "Test Item",
        collectionId: "collection123",
        metadata: { type: "test", value: 42 },
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
      };
      mockAddItemToCollection.execute.mockResolvedValue(
        Result.success(expectedOutput),
      );

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockAddItemToCollection.execute).toHaveBeenCalledWith({
        collectionId: "collection123",
        ownerId: "user123",
        name: "Test Item",
        metadata: { type: "test", value: 42 },
      });
      expect(responseStatusSpy).toHaveBeenCalledWith(201);
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
      expect(mockAddItemToCollection.execute).not.toHaveBeenCalled();
    });

    it("should return 400 when collection ID is missing", async () => {
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
          message: "Collection ID is required",
        },
        timestamp: expect.any(String),
      });
      expect(mockAddItemToCollection.execute).not.toHaveBeenCalled();
    });

    it("should return 400 when name is missing", async () => {
      // Arrange
      mockRequest.body = { metadata: { type: "test" } };

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
          message: expect.stringContaining("name"),
        },
        timestamp: expect.any(String),
      });
      expect(mockAddItemToCollection.execute).not.toHaveBeenCalled();
    });

    it("should return 400 when metadata is missing", async () => {
      // Arrange
      mockRequest.body = { name: "Test Item" };

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
          message: expect.stringContaining("metadata"),
        },
        timestamp: expect.any(String),
      });
      expect(mockAddItemToCollection.execute).not.toHaveBeenCalled();
    });
  });

  describe("Use case errors", () => {
    it("should handle use case failure", async () => {
      // Arrange
      mockAddItemToCollection.execute.mockResolvedValue(
        Result.failure(new Error("Collection not found")),
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
          message: "Collection not found",
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("Error scenarios", () => {
    it("should handle unexpected errors", async () => {
      // Arrange
      mockAddItemToCollection.execute.mockRejectedValue(
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