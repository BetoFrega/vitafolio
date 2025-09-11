import { describe, it, expect } from "vitest";
import { PaginationSchema, UuidParamSchema, SlugParamSchema } from "./index";

describe("Validation Schemas", () => {
  describe("PaginationSchema", () => {
    it("should provide defaults and transform strings to numbers", () => {
      const result1 = PaginationSchema.parse({});
      expect(result1).toEqual({ page: 1, limit: 20 });

      const result2 = PaginationSchema.parse({ page: "2", limit: "50" });
      expect(result2).toEqual({ page: 2, limit: 50 });
    });

    it("should enforce limits", () => {
      expect(() => PaginationSchema.parse({ page: "0" })).toThrow();
      expect(() => PaginationSchema.parse({ limit: "101" })).toThrow();
    });

    it("should work with partial data", () => {
      const result1 = PaginationSchema.parse({ page: "3" });
      expect(result1).toEqual({ page: 3, limit: 20 });

      const result2 = PaginationSchema.parse({ limit: "10" });
      expect(result2).toEqual({ page: 1, limit: 10 });
    });
  });

  describe("UuidParamSchema", () => {
    it("should validate UUID format", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";
      expect(UuidParamSchema.parse({ id: validUuid })).toEqual({
        id: validUuid,
      });
    });

    it("should fail for invalid UUID", () => {
      expect(() => UuidParamSchema.parse({ id: "invalid-uuid" })).toThrow();
      expect(() => UuidParamSchema.parse({ id: "123" })).toThrow();
      expect(() => UuidParamSchema.parse({ id: "" })).toThrow();
    });
  });

  describe("SlugParamSchema", () => {
    it("should validate slug format", () => {
      expect(SlugParamSchema.parse({ slug: "test-slug" })).toEqual({
        slug: "test-slug",
      });
      expect(SlugParamSchema.parse({ slug: "a" })).toEqual({ slug: "a" });
    });

    it("should fail for invalid slugs", () => {
      expect(() => SlugParamSchema.parse({ slug: "" })).toThrow();
      expect(() => SlugParamSchema.parse({ slug: "a".repeat(101) })).toThrow();
    });
  });
});
