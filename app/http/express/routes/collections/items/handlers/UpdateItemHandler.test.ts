import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import { UpdateItemHandler } from "./UpdateItemHandler";
import type { AuthenticatedRequest } from "../../../shared/handlers/AuthenticatedHandler";
import { Result } from "@shared/app/contracts/Result";

// Mock the UpdateItem use case
const mockUpdateItem = {
  execute: vi.fn(),
};

// Mock dependencies
const mockDeps = {
  updateItem: mockUpdateItem,
};

describe("UpdateItemHandler", () => {
  let handler: UpdateItemHandler;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let responseJsonSpy: any;
  let responseStatusSpy: any;

  beforeEach(() => {
    handler = new UpdateItemHandler(mockDeps);
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
      body: {
        name: "Updated Item",
        metadata: { type: "updated", value: 100 },
      },
    };
    vi.clearAllMocks();
  });

  describe("Successful item update", () => {
    it("should update item successfully", async () => {
      // Arrange
      const expectedOutput = {
        id: "item123",
        name: "Updated Item",
        collectionId: "collection123",
        metadata: { type: "updated", value: 100 },
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T01:00:00Z"),
      };
      mockUpdateItem.execute.mockResolvedValue(Result.success(expectedOutput));

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockUpdateItem.execute).toHaveBeenCalledWith({
        itemId: "item123",
        ownerId: "user123",
        name: "Updated Item",
        metadata: { type: "updated", value: 100 },
      });
      expect(responseStatusSpy).toHaveBeenCalledWith(200);
      expect(responseJsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          id: "item123",
          name: "Updated Item",
          collectionId: "collection123",
          metadata: { type: "updated", value: 100 },
          updatedAt: "2024-01-01T01:00:00.000Z",
        },
        timestamp: expect.any(String),
      });
    });

    it("should handle partial updates", async () => {
      // Arrange
      mockRequest.body = { name: "New Name Only" };
      const expectedOutput = {
        id: "item123",
        name: "New Name Only",
        collectionId: "collection123",
        metadata: { type: "original", value: 50 },
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T01:00:00Z"),
      };
      mockUpdateItem.execute.mockResolvedValue(Result.success(expectedOutput));

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockUpdateItem.execute).toHaveBeenCalledWith({
        itemId: "item123",
        ownerId: "user123",
        name: "New Name Only",
        metadata: undefined,
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
      expect(mockUpdateItem.execute).not.toHaveBeenCalled();
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
      expect(mockUpdateItem.execute).not.toHaveBeenCalled();
    });
  });

  describe("Use case errors", () => {
    it("should return 404 when item not found", async () => {
      // Arrange
      mockUpdateItem.execute.mockResolvedValue(
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
  });

  describe("Error scenarios", () => {
    it("should handle unexpected errors", async () => {
      // Arrange
      mockUpdateItem.execute.mockRejectedValue(
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
