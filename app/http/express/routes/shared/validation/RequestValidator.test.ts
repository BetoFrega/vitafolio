import { describe, it, expect } from "vitest";
import { z } from "zod";
import { RequestValidator, ValidationError } from "./RequestValidator";

// Mock request types for testing
interface MockRequest {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

describe("RequestValidator", () => {
  describe("validate", () => {
    const userSchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      age: z.number().min(0),
    });

    it("should return success result for valid data", () => {
      // Arrange
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };

      // Act
      const result = RequestValidator.validate(userSchema, validData);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toEqual(validData);
    });

    it("should return failure result for invalid data", () => {
      // Arrange
      const invalidData = {
        name: "",
        email: "invalid-email",
        age: -5,
      };

      // Act
      const result = RequestValidator.validate(userSchema, invalidData);

      // Assert
      expect(result.isFailure()).toBe(true);
      const error = result.getError();
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain("validation");

      // Test enhanced error details
      const validationError = error as ValidationError;
      expect(validationError.issues).toBeInstanceOf(Array);
      expect(validationError.issues.length).toBeGreaterThan(0);

      const fieldErrors = validationError.getFieldErrors();
      expect(fieldErrors).toHaveProperty("name");
      expect(fieldErrors).toHaveProperty("email");
      expect(fieldErrors).toHaveProperty("age");
    });

    it("should return failure result for missing required fields", () => {
      // Arrange
      const incompleteData = {
        name: "John Doe",
        // missing email and age
      };

      // Act
      const result = RequestValidator.validate(userSchema, incompleteData);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
      expect(result.getError().message).toContain("validation");
    });

    it("should return failure result for null/undefined data", () => {
      // Arrange & Act
      const nullResult = RequestValidator.validate(userSchema, null);
      const undefinedResult = RequestValidator.validate(userSchema, undefined);

      // Assert
      expect(nullResult.isFailure()).toBe(true);
      expect(undefinedResult.isFailure()).toBe(true);
    });

    it("should preserve exact data structure for valid input", () => {
      // Arrange
      const complexSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
            settings: z.object({
              theme: z.enum(["light", "dark"]),
              notifications: z.boolean(),
            }),
          }),
        }),
        metadata: z.array(z.string()),
      });

      const complexData = {
        user: {
          profile: {
            name: "Alice",
            settings: {
              theme: "dark" as const,
              notifications: true,
            },
          },
        },
        metadata: ["tag1", "tag2"],
      };

      // Act
      const result = RequestValidator.validate(complexSchema, complexData);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toEqual(complexData);
      expect(result.getValue().user.profile.settings.theme).toBe("dark");
    });

    it("should work with different zod schema types", () => {
      // Arrange
      const stringSchema = z.string().min(5);
      const numberSchema = z.number().positive();
      const arraySchema = z.array(z.string());

      // Act & Assert
      expect(
        RequestValidator.validate(stringSchema, "hello world").isSuccess(),
      ).toBe(true);
      expect(RequestValidator.validate(stringSchema, "hi").isFailure()).toBe(
        true,
      );

      expect(RequestValidator.validate(numberSchema, 42).isSuccess()).toBe(
        true,
      );
      expect(RequestValidator.validate(numberSchema, -1).isFailure()).toBe(
        true,
      );

      expect(
        RequestValidator.validate(arraySchema, ["a", "b"]).isSuccess(),
      ).toBe(true);
      expect(
        RequestValidator.validate(arraySchema, "not an array").isFailure(),
      ).toBe(true);
    });
  });

  describe("validateBody", () => {
    const schema = z.object({
      title: z.string(),
      content: z.string().optional(),
    });

    it("should validate request body", () => {
      // Arrange
      const mockReq: MockRequest = {
        body: { title: "Test Title", content: "Test content" },
      };

      // Act
      const result = RequestValidator.validateBody(schema, mockReq);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toEqual(mockReq.body);
    });

    it("should fail for invalid request body", () => {
      // Arrange
      const mockReq: MockRequest = {
        body: { content: "Missing title" },
      };

      // Act
      const result = RequestValidator.validateBody(schema, mockReq);

      // Assert
      expect(result.isFailure()).toBe(true);
    });

    it("should handle missing body", () => {
      // Arrange
      const mockReq: MockRequest = {};

      // Act
      const result = RequestValidator.validateBody(schema, mockReq);

      // Assert
      expect(result.isFailure()).toBe(true);
    });
  });

  describe("validateParams", () => {
    const schema = z.object({
      id: z.string().uuid(),
      slug: z.string().min(1),
    });

    it("should validate request params", () => {
      // Arrange
      const mockReq: MockRequest = {
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          slug: "test-slug",
        },
      };

      // Act
      const result = RequestValidator.validateParams(schema, mockReq);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toEqual(mockReq.params);
    });

    it("should fail for invalid params", () => {
      // Arrange
      const mockReq: MockRequest = {
        params: { id: "invalid-uuid", slug: "" },
      };

      // Act
      const result = RequestValidator.validateParams(schema, mockReq);

      // Assert
      expect(result.isFailure()).toBe(true);
    });
  });

  describe("validateQuery", () => {
    const schema = z.object({
      page: z.string().transform(Number).pipe(z.number().min(1)),
      limit: z.string().transform(Number).pipe(z.number().max(100)).optional(),
      search: z.string().optional(),
    });

    it("should validate and transform query parameters", () => {
      // Arrange
      const mockReq: MockRequest = {
        query: { page: "2", limit: "50", search: "test" },
      };

      // Act
      const result = RequestValidator.validateQuery(schema, mockReq);

      // Assert
      expect(result.isSuccess()).toBe(true);
      const value = result.getValue();
      expect(value.page).toBe(2); // Transformed to number
      expect(value.limit).toBe(50); // Transformed to number
      expect(value.search).toBe("test");
    });

    it("should fail for invalid query parameters", () => {
      // Arrange
      const mockReq: MockRequest = {
        query: { page: "0", limit: "200" }, // page too low, limit too high
      };

      // Act
      const result = RequestValidator.validateQuery(schema, mockReq);

      // Assert
      expect(result.isFailure()).toBe(true);
    });
  });
});
