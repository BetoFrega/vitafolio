import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response } from "express";
import { DeleteItemHandler } from "./DeleteItemHandler";
import type { AuthenticatedRequest } from "../../../shared/handlers/AuthenticatedHandler";
import { Result } from "@shared/app/contracts/Result";

// Mock the DeleteItem use case
const mockDeleteItem = {
  execute: vi.fn(),
};

// Mock dependencies
const mockDeps: ConstructorParameters<typeof DeleteItemHandler>[0] = {
  deleteItem: mockDeleteItem,
};

describe("DeleteItemHandler", () => {
  let handler: DeleteItemHandler;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let responseJsonSpy: Response["json"];
  let responseStatusSpy: Response["status"];
  let responseSendSpy: Response["send"];

  beforeEach(() => {
    handler = new DeleteItemHandler(mockDeps);
    responseJsonSpy = vi.fn().mockReturnValue({});
    responseSendSpy = vi.fn().mockReturnValue({});
    responseStatusSpy = vi.fn().mockReturnValue({
      json: responseJsonSpy,
      send: responseSendSpy,
    });
    mockResponse = {
      status: responseStatusSpy,
      json: responseJsonSpy,
      send: responseSendSpy,
    };
    mockRequest = {
      user: { id: "user123" },
      params: { id: "item123" },
    };
    vi.clearAllMocks();
  });

  describe("Successful item deletion", () => {
    it("should delete item successfully", async () => {
      // Arrange
      mockDeleteItem.execute.mockResolvedValue(Result.success(undefined));

      // Act
      await handler.handle(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
      );

      // Assert
      expect(mockDeleteItem.execute).toHaveBeenCalledWith({
        itemId: "item123",
        ownerId: "user123",
      });
      expect(responseStatusSpy).toHaveBeenCalledWith(204);
      expect(responseSendSpy).toHaveBeenCalledWith();
      expect(responseJsonSpy).not.toHaveBeenCalled();
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
      expect(mockDeleteItem.execute).not.toHaveBeenCalled();
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
      expect(mockDeleteItem.execute).not.toHaveBeenCalled();
    });
  });

  describe("Use case errors", () => {
    it("should return 404 when item not found", async () => {
      // Arrange
      mockDeleteItem.execute.mockResolvedValue(
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
      mockDeleteItem.execute.mockResolvedValue(
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
      mockDeleteItem.execute.mockRejectedValue(
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