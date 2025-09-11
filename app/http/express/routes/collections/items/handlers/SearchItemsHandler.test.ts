import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import { SearchItemsHandler } from "./SearchItemsHandler";
import type { AuthenticatedRequest } from "../../../shared/handlers/AuthenticatedHandler";
import { Result } from "@shared/app/contracts/Result";

// Mock the SearchItems use case
const mockSearchItems = {
  execute: vi.fn(),
};

// Mock dependencies
const mockDeps = {
  searchItems: mockSearchItems,
};

describe("SearchItemsHandler", () => {
  let handler: SearchItemsHandler;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let responseJsonSpy: any;
  let responseStatusSpy: any;

  beforeEach(() => {
    handler = new SearchItemsHandler(mockDeps);
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
      query: {
        query: "test search",
        collectionId: "collection123",
        limit: "10",
        offset: "0",
      },
    };
    vi.clearAllMocks();
  });

  describe("Successful search", () => {
    it("should search items successfully with all query parameters", async () => {
      // Arrange
      const expectedOutput = {
        items: [
          {
            id: "item1",
            name: "Test Item 1",
            collectionId: "collection123",
            metadata: { type: "test", value: 1 },
            createdAt: new Date("2024-01-01T00:00:00Z"),
            updatedAt: new Date("2024-01-01T00:00:00Z"),
          },
        ],
        total: 1,
      };
      mockSearchItems.execute.mockResolvedValue(Result.success(expectedOutput));

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockSearchItems.execute).toHaveBeenCalledWith({
        ownerId: "user123",
        query: "test search",
        collectionId: "collection123",
        limit: 10,
        offset: 0,
      });
      expect(responseStatusSpy).toHaveBeenCalledWith(200);
      expect(responseJsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          items: [
            {
              id: "item1",
              name: "Test Item 1",
              collectionId: "collection123",
              metadata: { type: "test", value: 1 },
              createdAt: "2024-01-01T00:00:00.000Z",
              updatedAt: "2024-01-01T00:00:00.000Z",
            },
          ],
          total: 1,
        },
        timestamp: expect.any(String),
      });
    });

    it("should search with minimal parameters", async () => {
      // Arrange
      mockRequest.query = {};
      const expectedOutput = {
        items: [],
        total: 0,
      };
      mockSearchItems.execute.mockResolvedValue(Result.success(expectedOutput));

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockSearchItems.execute).toHaveBeenCalledWith({
        ownerId: "user123",
      });
    });

    it("should handle metadata search parameter", async () => {
      // Arrange
      mockRequest.query = {
        metadata: JSON.stringify({ type: "test", value: 42 }),
      };
      const expectedOutput = {
        items: [],
        total: 0,
      };
      mockSearchItems.execute.mockResolvedValue(Result.success(expectedOutput));

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockSearchItems.execute).toHaveBeenCalledWith({
        ownerId: "user123",
        metadata: { type: "test", value: 42 },
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
      expect(mockSearchItems.execute).not.toHaveBeenCalled();
    });

    it("should return 400 when limit is invalid", async () => {
      // Arrange
      mockRequest.query = { limit: "invalid" };

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
          message: expect.stringContaining("limit"),
        },
        timestamp: expect.any(String),
      });
      expect(mockSearchItems.execute).not.toHaveBeenCalled();
    });

    it("should return 400 when metadata JSON is invalid", async () => {
      // Arrange
      mockRequest.query = { metadata: "invalid json" };

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
      expect(mockSearchItems.execute).not.toHaveBeenCalled();
    });
  });

  describe("Use case errors", () => {
    it("should handle use case failure", async () => {
      // Arrange
      mockSearchItems.execute.mockResolvedValue(
        Result.failure(new Error("Search failed")),
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
          message: "Search failed",
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("Error scenarios", () => {
    it("should handle unexpected errors", async () => {
      // Arrange
      mockSearchItems.execute.mockRejectedValue(
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