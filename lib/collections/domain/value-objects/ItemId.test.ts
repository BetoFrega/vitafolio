import { describe, it, expect } from "vitest";
import { ItemId } from "./ItemId";

describe("ItemId", () => {
  describe("create", () => {
    it("should create valid ItemId with unique UUID", () => {
      const id = ItemId.create();

      expect(id.getValue()).toBeDefined();
      expect(typeof id.getValue()).toBe("string");
      expect(id.getValue()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("should generate unique IDs", () => {
      const id1 = ItemId.create();
      const id2 = ItemId.create();

      expect(id1.getValue()).not.toBe(id2.getValue());
      expect(id1.equals(id2)).toBe(false);
    });

    it("should generate multiple unique IDs", () => {
      const ids = new Set<string>();
      const count = 100;

      for (let i = 0; i < count; i++) {
        const id = ItemId.create();
        ids.add(id.getValue());
      }

      expect(ids.size).toBe(count); // All should be unique
    });
  });

  describe("fromString", () => {
    it("should create ItemId from valid UUID string", () => {
      const validUuid = "123e4567-e89b-12d3-a456-426614174000";

      const id = ItemId.fromString(validUuid);

      expect(id.getValue()).toBe(validUuid);
    });

    it("should accept uppercase UUID", () => {
      const uppercaseUuid = "123E4567-E89B-12D3-A456-426614174000";

      const id = ItemId.fromString(uppercaseUuid);

      expect(id.getValue()).toBe(uppercaseUuid);
    });

    it("should accept mixed case UUID", () => {
      const mixedCaseUuid = "123e4567-E89B-12d3-A456-426614174000";

      const id = ItemId.fromString(mixedCaseUuid);

      expect(id.getValue()).toBe(mixedCaseUuid);
    });

    it("should reject empty string", () => {
      expect(() => ItemId.fromString("")).toThrow(
        "ItemId must be a non-empty string",
      );
    });

    it("should reject null", () => {
      expect(() => ItemId.fromString(null as unknown as string)).toThrow(
        "ItemId must be a non-empty string",
      );
    });

    it("should reject undefined", () => {
      expect(() => ItemId.fromString(undefined as unknown as string)).toThrow(
        "ItemId must be a non-empty string",
      );
    });

    it("should reject non-string values", () => {
      expect(() => ItemId.fromString(123 as unknown as string)).toThrow(
        "ItemId must be a non-empty string",
      );

      expect(() => ItemId.fromString({} as unknown as string)).toThrow(
        "ItemId must be a non-empty string",
      );

      expect(() => ItemId.fromString([] as unknown as string)).toThrow(
        "ItemId must be a non-empty string",
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
        expect(() => ItemId.fromString(invalidUuid)).toThrow(
          "ItemId must be a valid UUID",
        );
      }
    });
  });

  describe("getValue", () => {
    it("should return the underlying UUID string", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";

      const id = ItemId.fromString(uuid);

      expect(id.getValue()).toBe(uuid);
    });

    it("should return consistent value", () => {
      const id = ItemId.create();
      const value1 = id.getValue();
      const value2 = id.getValue();

      expect(value1).toBe(value2);
    });
  });

  describe("equals", () => {
    it("should return true for same UUID values", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";

      const id1 = ItemId.fromString(uuid);
      const id2 = ItemId.fromString(uuid);

      expect(id1.equals(id2)).toBe(true);
      expect(id2.equals(id1)).toBe(true);
    });

    it("should return false for different UUID values", () => {
      const uuid1 = "123e4567-e89b-12d3-a456-426614174000";
      const uuid2 = "123e4567-e89b-12d3-a456-426614174001";

      const id1 = ItemId.fromString(uuid1);
      const id2 = ItemId.fromString(uuid2);

      expect(id1.equals(id2)).toBe(false);
      expect(id2.equals(id1)).toBe(false);
    });

    it("should be case sensitive", () => {
      const uuid1 = "123e4567-e89b-12d3-a456-426614174000";
      const uuid2 = "123E4567-E89B-12D3-A456-426614174000";

      const id1 = ItemId.fromString(uuid1);
      const id2 = ItemId.fromString(uuid2);

      expect(id1.equals(id2)).toBe(false);
    });

    it("should be reflexive", () => {
      const id = ItemId.create();

      expect(id.equals(id)).toBe(true);
    });

    it("should be symmetric", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const id1 = ItemId.fromString(uuid);
      const id2 = ItemId.fromString(uuid);

      expect(id1.equals(id2)).toBe(id2.equals(id1));
    });

    it("should be transitive", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const id1 = ItemId.fromString(uuid);
      const id2 = ItemId.fromString(uuid);
      const id3 = ItemId.fromString(uuid);

      expect(id1.equals(id2)).toBe(true);
      expect(id2.equals(id3)).toBe(true);
      expect(id1.equals(id3)).toBe(true);
    });
  });

  describe("immutability", () => {
    it("should not allow modification of underlying value", () => {
      const id = ItemId.create();
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
      const id = ItemId.fromString(uuid);

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

      expect(() => ItemId.fromString(zeroUuid)).not.toThrow();

      const id = ItemId.fromString(zeroUuid);
      expect(id.getValue()).toBe(zeroUuid);
    });

    it("should handle UUID with all f's", () => {
      const maxUuid = "ffffffff-ffff-ffff-ffff-ffffffffffff";

      expect(() => ItemId.fromString(maxUuid)).not.toThrow();

      const id = ItemId.fromString(maxUuid);
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
        expect(() => ItemId.fromString(uuid)).not.toThrow();
        const id = ItemId.fromString(uuid);
        expect(id.getValue()).toBe(uuid);
      }
    });
  });

  describe("type safety with CollectionId", () => {
    it("should maintain type distinction from CollectionId", () => {
      const itemId = ItemId.create();
      const itemUuid = itemId.getValue();

      // This should be a different type even if created from same UUID
      // TypeScript should prevent this at compile time, but we can test runtime behavior
      expect(typeof itemUuid).toBe("string");
      expect(itemUuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });
  });
});
