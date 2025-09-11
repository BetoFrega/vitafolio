import { describe, it, expect } from "vitest";
import type {
  ApiError,
  SuccessResponse,
  ErrorResponse,
  ApiResponse,
} from "./ApiResponse";

describe("ApiResponse Types", () => {
  describe("type definitions", () => {
    it("should have correct ApiError structure", () => {
      const error: ApiError = {
        code: "VALIDATION_ERROR",
        message: "Required field is missing",
      };

      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("Required field is missing");
    });

    it("should have correct SuccessResponse structure", () => {
      const response: SuccessResponse<{ id: string }> = {
        success: true,
        data: { id: "123" },
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(true);
      expect(response.data.id).toBe("123");
      expect(typeof response.timestamp).toBe("string");
    });

    it("should have correct ErrorResponse structure", () => {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Resource not found",
        },
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(false);
      expect(response.error.code).toBe("NOT_FOUND");
      expect(response.error.message).toBe("Resource not found");
    });

    it("should support union type ApiResponse", () => {
      const successResponse: ApiResponse<string> = {
        success: true,
        data: "test",
        timestamp: new Date().toISOString(),
      };

      const errorResponse: ApiResponse<string> = {
        success: false,
        error: { code: "ERROR", message: "Something went wrong" },
        timestamp: new Date().toISOString(),
      };

      if (successResponse.success) {
        expect(successResponse.data).toBe("test");
      }

      if (!errorResponse.success) {
        expect(errorResponse.error.code).toBe("ERROR");
      }
    });
  });
});
