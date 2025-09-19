import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import { ListItemsHandler } from "./ListItemsHandler";
import type { AuthenticatedRequest } from "../../../shared/handlers/AuthenticatedHandler";
import { Result } from "@shared/app/contracts/Result";

// Mock the ListItems use case
const mockListItems = {
  execute: vi.fn(),
};

// Mock dependencies
const mockDeps: ConstructorParameters<typeof ListItemsHandler>[0] = {
  listItems: mockListItems,
};

describe("ListItemsHandler", () => {
  let handler: ListItemsHandler;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let responseJsonSpy: Response["json"];
  let responseStatusSpy: Response["status"];

  beforeEach(() => {
    handler = new ListItemsHandler(mockDeps);
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
    };
    vi.clearAllMocks();
  });

  describe("Successful items listing", () => {
    it("should list items successfully", async () => {
      // Arrange
      const expectedOutput = {
        items: [
          {
            id: "item1",
            name: "Item 1",
            collectionId: "collection123",
            metadata: { type: "test", value: 1 },
            createdAt: new Date("2024-01-01T00:00:00Z"),
            updatedAt: new Date("2024-01-01T00:00:00Z"),
          },
          {
            id: "item2",
            name: "Item 2",
            collectionId: "collection123",
            metadata: { type: "test", value: 2 },
            createdAt: new Date("2024-01-01T01:00:00Z"),
            updatedAt: new Date("2024-01-01T01:00:00Z"),
          },
        ],
        total: 2,
      };
      mockListItems.execute.mockResolvedValue(Result.success(expectedOutput));

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockListItems.execute).toHaveBeenCalledWith({
        collectionId: "collection123",
        ownerId: "user123",
      });
      expect(responseStatusSpy).toHaveBeenCalledWith(200);
      expect(responseJsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          items: [
            {
              id: "item1",
              name: "Item 1",
              collectionId: "collection123",
              metadata: { type: "test", value: 1 },
              createdAt: "2024-01-01T00:00:00.000Z",
              updatedAt: "2024-01-01T00:00:00.000Z",
            },
            {
              id: "item2",
              name: "Item 2",
              collectionId: "collection123",
              metadata: { type: "test", value: 2 },
              createdAt: "2024-01-01T01:00:00.000Z",
              updatedAt: "2024-01-01T01:00:00.000Z",
            },
          ],
          total: 2,
        },
        timestamp: expect.any(String),
      });
    });

    it("should handle empty collection", async () => {
      // Arrange
      const expectedOutput = {
        items: [],
        total: 0,
      };
      mockListItems.execute.mockResolvedValue(Result.success(expectedOutput));

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(responseStatusSpy).toHaveBeenCalledWith(200);
      expect(responseJsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          items: [],
          total: 0,
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
      expect(mockListItems.execute).not.toHaveBeenCalled();
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
      expect(mockListItems.execute).not.toHaveBeenCalled();
    });
  });

  describe("Use case errors", () => {
    it("should return 404 when collection not found", async () => {
      // Arrange
      mockListItems.execute.mockResolvedValue(
        Result.failure(new Error("Collection not found")),
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
          message: "Collection not found",
        },
        timestamp: expect.any(String),
      });
    });

    it("should handle other use case errors", async () => {
      // Arrange
      mockListItems.execute.mockResolvedValue(
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
      mockListItems.execute.mockRejectedValue(
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
