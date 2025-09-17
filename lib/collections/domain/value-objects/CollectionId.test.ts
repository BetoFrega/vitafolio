import { describe, it, expect } from "vitest";
import { CollectionId } from "./CollectionId";

describe("CollectionId", () => {
  describe("create", () => {
    it("should create valid CollectionId with unique UUID", () => {
      const id = CollectionId.create();

      expect(id.getValue()).toBeDefined();
      expect(typeof id.getValue()).toBe("string");
      expect(id.getValue()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("should generate unique IDs", () => {
      const id1 = CollectionId.create();
      const id2 = CollectionId.create();

      expect(id1.getValue()).not.toBe(id2.getValue());
      expect(id1.equals(id2)).toBe(false);
    });

    it("should generate multiple unique IDs", () => {
      const ids = new Set<string>();
      const count = 100;

      for (let i = 0; i < count; i++) {
        const id = CollectionId.create();
        ids.add(id.getValue());
      }

      expect(ids.size).toBe(count); // All should be unique
    });
  });

  describe("fromString", () => {
    it("should create CollectionId from valid UUID string", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";

      const id = CollectionId.fromString(validUuid);

      expect(id.getValue()).toBe(validUuid);
    });

    it("should accept uppercase UUID", () => {
      const uppercaseUuid = "123E4567-E89B-12D3-A456-426614174000";

      const id = CollectionId.fromString(uppercaseUuid);

      expect(id.getValue()).toBe(uppercaseUuid);
    });

    it("should accept mixed case UUID", () => {
      const mixedCaseUuid = "123e4567-E89B-12d3-A456-426614174000";

      const id = CollectionId.fromString(mixedCaseUuid);

      expect(id.getValue()).toBe(mixedCaseUuid);
    });

    it("should reject empty string", () => {
      expect(() => CollectionId.fromString("")).toThrow(
        "CollectionId must be a non-empty string",
      );
    });

    it("should reject null", () => {
      expect(() => CollectionId.fromString(null as unknown as string)).toThrow(
        "CollectionId must be a non-empty string",
      );
    });

    it("should reject undefined", () => {
      expect(() =>
        CollectionId.fromString(undefined as unknown as string),
      ).toThrow("CollectionId must be a non-empty string");
    });

    it("should reject non-string values", () => {
      expect(() => CollectionId.fromString(123 as unknown as string)).toThrow(
        "CollectionId must be a non-empty string",
      );

      expect(() => CollectionId.fromString({} as unknown as string)).toThrow(
        "CollectionId must be a non-empty string",
      );

      expect(() => CollectionId.fromString([] as unknown as string)).toThrow(
        "CollectionId must be a non-empty string",
      );
    });

    it("should reject invalid UUID formats", () => {
      const invalidUuids = [
        "not-a-uuid",
        "123e4567-e89b-12d3-a456", // Too short
        "123e4567-e89b-12d3-a456-426614174000-extra", // Too long
        "123e4567_e89b_12d3_a456_426614174000", // Wrong separators
        "123e4567-e89b-12d3-a456-42661417400g", // Invalid character
        "123e4567-e89b-12d3-a456-42661417400", // Missing character
        "123e4567-e89b-12d3-a456-4266141740000", // Extra character
        "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", // Not hex
        "   ", // Whitespace only
      ];

      for (const invalidUuid of invalidUuids) {
        expect(() => CollectionId.fromString(invalidUuid)).toThrow(
          "CollectionId must be a valid UUID",
        );
      }
    });
  });

  describe("getValue", () => {
    it("should return the underlying UUID string", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";

      const id = CollectionId.fromString(uuid);

      expect(id.getValue()).toBe(uuid);
    });

    it("should return consistent value", () => {
      const id = CollectionId.create();
      const value1 = id.getValue();
      const value2 = id.getValue();

      expect(value1).toBe(value2);
    });
  });

  describe("equals", () => {
    it("should return true for same UUID values", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";

      const id1 = CollectionId.fromString(uuid);
      const id2 = CollectionId.fromString(uuid);

      expect(id1.equals(id2)).toBe(true);
      expect(id2.equals(id1)).toBe(true);
    });

    it("should return false for different UUID values", () => {
      const uuid1 = "123e4567-e89b-12d3-a456-426614174000";
      const uuid2 = "123e4567-e89b-12d3-a456-426614174001";

      const id1 = CollectionId.fromString(uuid1);
      const id2 = CollectionId.fromString(uuid2);

      expect(id1.equals(id2)).toBe(false);
      expect(id2.equals(id1)).toBe(false);
    });

    it("should be case sensitive", () => {
      const uuid1 = "123e4567-e89b-12d3-a456-426614174000";
      const uuid2 = "123E4567-E89B-12D3-A456-426614174000";

      const id1 = CollectionId.fromString(uuid1);
      const id2 = CollectionId.fromString(uuid2);

      expect(id1.equals(id2)).toBe(false);
    });

    it("should be reflexive", () => {
      const id = CollectionId.create();

      expect(id.equals(id)).toBe(true);
    });

    it("should be symmetric", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const id1 = CollectionId.fromString(uuid);
      const id2 = CollectionId.fromString(uuid);

      expect(id1.equals(id2)).toBe(id2.equals(id1));
    });

    it("should be transitive", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const id1 = CollectionId.fromString(uuid);
      const id2 = CollectionId.fromString(uuid);
      const id3 = CollectionId.fromString(uuid);

      expect(id1.equals(id2)).toBe(true);
      expect(id2.equals(id3)).toBe(true);
      expect(id1.equals(id3)).toBe(true);
    });
  });

  describe("immutability", () => {
    it("should not allow modification of underlying value", () => {
      const id = CollectionId.create();
      const originalValue = id.getValue();

      // Try to modify the returned value (shouldn't affect the ID)
      const value = id.getValue();
      if (typeof (value as unknown) === "object") {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (value as any).length = 0;
        }).toThrow();
      }

      expect(id.getValue()).toBe(originalValue);
    });

    it("should maintain consistent behavior across calls", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const id = CollectionId.fromString(uuid);

      const value1 = id.getValue();
      const value2 = id.getValue();
      const value3 = id.getValue();

      expect(value1).toBe(uuid);
      expect(value2).toBe(uuid);
      expect(value3).toBe(uuid);
      expect(value1).toBe(value2);
      expect(value2).toBe(value3);
    });
  });

  describe("edge cases", () => {
    it("should handle UUID with all zeros", () => {
      const zeroUuid = "00000000-0000-0000-0000-000000000000";

      expect(() => CollectionId.fromString(zeroUuid)).not.toThrow();

      const id = CollectionId.fromString(zeroUuid);
      expect(id.getValue()).toBe(zeroUuid);
    });

    it("should handle UUID with all f's", () => {
      const maxUuid = "ffffffff-ffff-ffff-ffff-ffffffffffff";

      expect(() => CollectionId.fromString(maxUuid)).not.toThrow();

      const id = CollectionId.fromString(maxUuid);
      expect(id.getValue()).toBe(maxUuid);
    });

    it("should handle different UUID versions", () => {
      const uuids = [
        "123e4567-e89b-12d3-a456-426614174000", // Valid UUID v1 format
        "123e4567-e89b-22d3-a456-426614174000", // Valid UUID v2 format
        "123e4567-e89b-32d3-a456-426614174000", // Valid UUID v3 format
        "123e4567-e89b-42d3-a456-426614174000", // Valid UUID v4 format
        "123e4567-e89b-52d3-a456-426614174000", // Valid UUID v5 format
      ];

      for (const uuid of uuids) {
        expect(() => CollectionId.fromString(uuid)).not.toThrow();
        const id = CollectionId.fromString(uuid);
        expect(id.getValue()).toBe(uuid);
      }
    });
  });
});
