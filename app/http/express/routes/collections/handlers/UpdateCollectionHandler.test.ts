import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import { UpdateCollectionHandler } from "./UpdateCollectionHandler";
import type { AuthenticatedRequest } from "../../shared/handlers/AuthenticatedHandler";
import { Result } from "@shared/app/contracts/Result";

// Mock dependencies
const mockUpdateCollection = {
  execute: vi.fn(),
} as any;

describe("UpdateCollectionHandler", () => {
  let handler: UpdateCollectionHandler;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let responseSpy: {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    handler = new UpdateCollectionHandler({
      updateCollection: mockUpdateCollection,
    });

    // Setup response spy
    responseSpy = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockResponse = responseSpy as unknown as Response;

    // Setup basic request
    mockRequest = {
      body: {
        name: "Updated Collection",
        description: "Updated description",
      },
      params: {
        id: "550e8400-e29b-41d4-a716-446655440000",
      },
      user: {
        id: "user-123",
      },
    };
  });

  describe("Successful updates", () => {
    it("should update a collection successfully with standardized response format", async () => {
      const mockCollectionData = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Updated Collection",
        description: "Updated description",
        ownerId: "user-123",
        updatedAt: new Date("2023-01-01T12:00:00Z"),
      };

      mockUpdateCollection.execute.mockResolvedValue(
        Result.success(mockCollectionData),
      );

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockUpdateCollection.execute).toHaveBeenCalledWith({
        collectionId: "550e8400-e29b-41d4-a716-446655440000",
        ownerId: "user-123",
        name: "Updated Collection",
        description: "Updated description",
      });

      expect(responseSpy.status).toHaveBeenCalledWith(200);
      expect(responseSpy.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Updated Collection",
          description: "Updated description",
          updatedAt: new Date("2023-01-01T12:00:00Z"),
        },
        timestamp: expect.any(String),
      });

      // Verify ownerId is not exposed in response for security
      const responseData = responseSpy.json.mock.calls[0]?.[0];
      expect(responseData?.data).not.toHaveProperty("ownerId");
    });

    it("should handle empty optional fields correctly", async () => {
      mockRequest.body = {
        name: "Updated Collection",
        description: "", // Empty description should be allowed
      };

      const mockCollectionData = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Updated Collection",
        description: "",
        ownerId: "user-123",
        updatedAt: new Date("2023-01-01T12:00:00Z"),
      };

      mockUpdateCollection.execute.mockResolvedValue(
        Result.success(mockCollectionData),
      );

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockUpdateCollection.execute).toHaveBeenCalledWith({
        collectionId: "550e8400-e29b-41d4-a716-446655440000",
        ownerId: "user-123",
        name: "Updated Collection",
        description: "",
      });

      expect(responseSpy.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Validation errors", () => {
    it("should return 400 when name is missing", async () => {
      mockRequest.body = {
        description: "Updated description",
        // name is missing
      };

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockUpdateCollection.execute).not.toHaveBeenCalled();
      expect(responseSpy.status).toHaveBeenCalledWith(400);
      expect(responseSpy.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: expect.stringContaining("name"),
        },
        timestamp: expect.any(String),
      });
    });

    it("should return 400 when name is empty string", async () => {
      mockRequest.body = {
        name: "",
        description: "Updated description",
      };

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockUpdateCollection.execute).not.toHaveBeenCalled();
      expect(responseSpy.status).toHaveBeenCalledWith(400);
      expect(responseSpy.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: expect.stringContaining("name"),
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

      expect(mockUpdateCollection.execute).not.toHaveBeenCalled();
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
      mockUpdateCollection.execute.mockResolvedValue(
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
      mockUpdateCollection.execute.mockResolvedValue(
        Result.failure(new Error("Invalid operation")),
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
          message: "Invalid operation",
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("Error scenarios", () => {
    it("should handle unexpected errors", async () => {
      mockUpdateCollection.execute.mockRejectedValue(
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
        "UpdateCollectionHandler: Unexpected error:",
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

      expect(mockUpdateCollection.execute).not.toHaveBeenCalled();
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