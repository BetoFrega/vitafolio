import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import { ListCollectionsHandler } from "./ListCollectionsHandler";
import type { AuthenticatedRequest } from "../../shared/handlers/AuthenticatedHandler";
import { Result } from "@shared/app/contracts/Result";

// Mock dependencies
const mockListCollections = {
  execute: vi.fn(),
} as any;

describe("ListCollectionsHandler", () => {
  let handler: ListCollectionsHandler;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let responseSpy: {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    handler = new ListCollectionsHandler({
      listCollections: mockListCollections,
    });

    // Setup response spy
    responseSpy = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockResponse = responseSpy as unknown as Response;

    // Setup basic request
    mockRequest = {
      user: {
        id: "user-123",
      },
    };
  });

  describe("Successful list operations", () => {
    it("should list collections successfully with standardized response format", async () => {
      const mockCollections = [
        {
          id: "collection-1",
          name: "First Collection",
          description: "Description 1",
          ownerId: "user-123",
          createdAt: new Date("2023-01-01T12:00:00Z"),
          updatedAt: new Date("2023-01-01T12:00:00Z"),
        },
        {
          id: "collection-2",
          name: "Second Collection",
          description: "Description 2",
          ownerId: "user-123",
          createdAt: new Date("2023-01-02T12:00:00Z"),
          updatedAt: new Date("2023-01-02T12:00:00Z"),
        },
      ];

      mockListCollections.execute.mockResolvedValue(
        Result.success({ collections: mockCollections }),
      );

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockListCollections.execute).toHaveBeenCalledWith({
        ownerId: "user-123",
      });

      expect(responseSpy.status).toHaveBeenCalledWith(200);
      expect(responseSpy.json).toHaveBeenCalledWith({
        success: true,
        data: {
          collections: [
            {
              id: "collection-1",
              name: "First Collection",
              description: "Description 1",
              createdAt: new Date("2023-01-01T12:00:00Z"),
              updatedAt: new Date("2023-01-01T12:00:00Z"),
            },
            {
              id: "collection-2",
              name: "Second Collection",
              description: "Description 2",
              createdAt: new Date("2023-01-02T12:00:00Z"),
              updatedAt: new Date("2023-01-02T12:00:00Z"),
            },
          ],
        },
        timestamp: expect.any(String),
      });

      // Verify ownerId is not exposed in response for security
      const responseData = responseSpy.json.mock.calls[0]?.[0];
      responseData?.data?.collections?.forEach((collection: any) => {
        expect(collection).not.toHaveProperty("ownerId");
      });
    });

    it("should return empty list when user has no collections", async () => {
      mockListCollections.execute.mockResolvedValue(
        Result.success({ collections: [] }),
      );

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(mockListCollections.execute).toHaveBeenCalledWith({
        ownerId: "user-123",
      });

      expect(responseSpy.status).toHaveBeenCalledWith(200);
      expect(responseSpy.json).toHaveBeenCalledWith({
        success: true,
        data: {
          collections: [],
        },
        timestamp: expect.any(String),
      });
    });

    it("should handle collections with metadata schemas correctly", async () => {
      const mockCollections = [
        {
          id: "collection-1",
          name: "Collection with Schema",
          description: "Description",
          ownerId: "user-123",
          createdAt: new Date("2023-01-01T12:00:00Z"),
          updatedAt: new Date("2023-01-01T12:00:00Z"),
          metadataSchema: {
            fields: {
              title: {
                type: "text",
                required: true,
                description: "Item title",
              },
            },
          },
        },
      ];

      mockListCollections.execute.mockResolvedValue(
        Result.success({ collections: mockCollections }),
      );

      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      expect(responseSpy.status).toHaveBeenCalledWith(200);

      const responseData = responseSpy.json.mock.calls[0]?.[0];
      expect(responseData?.data?.collections?.[0]).toHaveProperty(
        "metadataSchema",
      );
      expect(responseData?.data?.collections?.[0]?.metadataSchema).toEqual({
        fields: {
          title: {
            type: "text",
            required: true,
            description: "Item title",
          },
        },
      });
    });
  });

  describe("Use case errors", () => {
    it("should return 400 for use case errors", async () => {
      mockListCollections.execute.mockResolvedValue(
        Result.failure(new Error("Database error")),
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
          message: "Database error",
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("Error scenarios", () => {
    it("should handle unexpected errors", async () => {
      mockListCollections.execute.mockRejectedValue(
        new Error("Database connection failed"),
      );

      // Mock console.error to avoid test output noise
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

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
        "ListCollectionsHandler: Unexpected error:",
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

      expect(mockListCollections.execute).not.toHaveBeenCalled();
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
