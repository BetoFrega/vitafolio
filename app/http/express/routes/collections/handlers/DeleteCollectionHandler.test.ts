import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import { DeleteCollectionHandler } from "./DeleteCollectionHandler";
import type { AuthenticatedRequest } from "../../shared/handlers/AuthenticatedHandler";
import { Result } from "@shared/app/contracts/Result";

// Mock dependencies
const mockDeleteCollection = {
  execute: vi.fn(),
} as any;

describe("DeleteCollectionHandler", () => {
  let handler: DeleteCollectionHandler;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let responseSpy: {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    handler = new DeleteCollectionHandler({
      deleteCollection: mockDeleteCollection,
    });

    // Setup response spy
    responseSpy = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    mockResponse = responseSpy as unknown as Response;

    // Setup basic request
    mockRequest = {
      params: {
        id: "550e8400-e29b-41d4-a716-446655440000",
      },
      user: {
        id: "user-123",
      },
    };
  });

  describe("Successful deletions", () => {
    it("should delete a collection successfully with 204 status", async () => {
      mockDeleteCollection.execute.mockResolvedValue(Result.success({}));

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockDeleteCollection.execute).toHaveBeenCalledWith({
        collectionId: "550e8400-e29b-41d4-a716-446655440000",
        ownerId: "user-123",
      });

      expect(responseSpy.status).toHaveBeenCalledWith(204);
      expect(responseSpy.send).toHaveBeenCalledWith();
    });
  });

  describe("Validation errors", () => {
    it("should return 400 when collection ID is missing", async () => {
      mockRequest.params = {};

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockDeleteCollection.execute).not.toHaveBeenCalled();
      expect(responseSpy.status).toHaveBeenCalledWith(400);
      expect(responseSpy.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: expect.stringContaining("id"),
        },
        timestamp: expect.any(String),
      });
    });

    it("should return 400 when collection ID is invalid", async () => {
      mockRequest.params = {
        id: "invalid-uuid",
      };

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockDeleteCollection.execute).not.toHaveBeenCalled();
      expect(responseSpy.status).toHaveBeenCalledWith(400);
      expect(responseSpy.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: expect.stringContaining("UUID"),
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("Use case errors", () => {
    it("should return 404 when collection not found", async () => {
      mockDeleteCollection.execute.mockResolvedValue(
        Result.failure(new Error("Collection not found")),
      );

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(responseSpy.status).toHaveBeenCalledWith(404);
      expect(responseSpy.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Collection not found",
        },
        timestamp: expect.any(String),
      });
    });

    it("should return 400 for other use case errors", async () => {
      mockDeleteCollection.execute.mockResolvedValue(
        Result.failure(new Error("Cannot delete collection with items")),
      );

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(responseSpy.status).toHaveBeenCalledWith(400);
      expect(responseSpy.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "USE_CASE_ERROR",
          message: "Cannot delete collection with items",
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("Error scenarios", () => {
    it("should handle unexpected errors", async () => {
      mockDeleteCollection.execute.mockRejectedValue(
        new Error("Database connection failed"),
      );

      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(responseSpy.status).toHaveBeenCalledWith(500);
      expect(responseSpy.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
        timestamp: expect.any(String),
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "DeleteCollectionHandler: Unexpected error:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it("should return 401 when user is not authenticated", async () => {
      mockRequest.user = undefined as any;

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockDeleteCollection.execute).not.toHaveBeenCalled();
      expect(responseSpy.status).toHaveBeenCalledWith(401);
      expect(responseSpy.json).toHaveBeenCalledWith({
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