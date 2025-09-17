import { describe, it, expect, vi } from "vitest";
import { Collection } from "./Collection";
import { CollectionId } from "../value-objects/CollectionId";
import {
  MetadataSchema,
  type MetadataFieldType,
} from "../value-objects/MetadataSchema";

describe("Collection", () => {
  const createValidMetadataSchema = () => {
    return MetadataSchema.create({
      title: {
        type: "text" as MetadataFieldType,
        required: true,
      },
    });
  };

  const createValidCollectionData = () => ({
    name: "Test Collection",
    description: "A test collection for unit testing",
    ownerId: "user-123",
    metadataSchema: createValidMetadataSchema(),
  });

  describe("create", () => {
    it("should create collection with valid data", () => {
      const data = createValidCollectionData();

      const collection = Collection.create(data);

      expect(collection.getName()).toBe("Test Collection");
      expect(collection.getDescription()).toBe(
        "A test collection for unit testing",
      );
      expect(collection.getOwnerId()).toBe("user-123");
      expect(collection.getMetadataSchema()).toBe(data.metadataSchema);
    });

    it("should generate unique ID", () => {
      const data = createValidCollectionData();

      const collection1 = Collection.create(data);
      const collection2 = Collection.create(data);

      expect(collection1.getId().getValue()).toBeDefined();
      expect(collection2.getId().getValue()).toBeDefined();
      expect(collection1.getId().equals(collection2.getId())).toBe(false);
    });

    it("should set creation timestamps", () => {
      const beforeCreation = new Date();

      const collection = Collection.create(createValidCollectionData());

      const afterCreation = new Date();

      expect(collection.data.createdAt).toBeInstanceOf(Date);
      expect(collection.data.updatedAt).toBeInstanceOf(Date);
      expect(collection.data.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
      expect(collection.data.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime(),
      );
      expect(collection.data.updatedAt.getTime()).toBe(
        collection.data.createdAt.getTime(),
      );
    });

    it("should validate metadataSchema", () => {
      const data = createValidCollectionData();

      // Valid schema should not throw
      expect(() => Collection.create(data)).not.toThrow();

      // Schema is required
      const dataWithoutSchema = {
        ...data,
        metadataSchema: null as unknown as MetadataSchema,
      };

      expect(() => Collection.create(dataWithoutSchema)).toThrow(
        "Collection metadataSchema is required",
      );
    });

    it("should reject invalid name (empty/null)", () => {
      const data = createValidCollectionData();

      // Empty name
      expect(() => Collection.create({ ...data, name: "" })).toThrow(
        "Collection name is required",
      );

      // Whitespace only name
      expect(() => Collection.create({ ...data, name: "   " })).toThrow(
        "Collection name is required",
      );

      // Null name
      expect(() =>
        Collection.create({ ...data, name: null as unknown as string }),
      ).toThrow("Collection name is required");
    });

    it("should reject name longer than 100 characters", () => {
      const data = createValidCollectionData();
      const longName = "a".repeat(101);

      expect(() => Collection.create({ ...data, name: longName })).toThrow(
        "Collection name must be 100 characters or less",
      );
    });

    it("should handle optional description", () => {
      const data = createValidCollectionData();

      // Empty description should be allowed
      const collectionWithEmptyDesc = Collection.create({
        ...data,
        description: "",
      });

      expect(collectionWithEmptyDesc.getDescription()).toBe("");
    });

    it("should reject description longer than 500 characters", () => {
      const data = createValidCollectionData();
      const longDescription = "a".repeat(501);

      expect(() =>
        Collection.create({ ...data, description: longDescription }),
      ).toThrow("Collection description must be 500 characters or less");
    });

    it("should require ownerId", () => {
      const data = createValidCollectionData();

      expect(() => Collection.create({ ...data, ownerId: "" })).toThrow(
        "Collection ownerId is required",
      );

      expect(() => Collection.create({ ...data, ownerId: "   " })).toThrow(
        "Collection ownerId is required",
      );
    });

    it("should accept valid boundary values", () => {
      const data = createValidCollectionData();

      // Maximum length name (100 characters)
      const maxLengthName = "a".repeat(100);
      expect(() =>
        Collection.create({ ...data, name: maxLengthName }),
      ).not.toThrow();

      // Maximum length description (500 characters)
      const maxLengthDescription = "a".repeat(500);
      expect(() =>
        Collection.create({ ...data, description: maxLengthDescription }),
      ).not.toThrow();
    });
  });

  describe("updateName", () => {
    it("should update name successfully", () => {
      const collection = Collection.create(createValidCollectionData());
      const originalUpdatedAt = collection.data.updatedAt;

      // Wait a bit to ensure timestamp difference
      vi.useFakeTimers();
      vi.setSystemTime(new Date(Date.now() + 1000));

      const updatedCollection = collection.updateName("New Collection Name");

      expect(collection.getName()).toBe("Test Collection"); // Original unchanged
      expect(updatedCollection.getName()).toBe("New Collection Name");
      expect(updatedCollection.data.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
      expect(updatedCollection.getId().equals(collection.getId())).toBe(true);

      vi.useRealTimers();
    });

    it("should validate new name", () => {
      const collection = Collection.create(createValidCollectionData());

      expect(() => collection.updateName("")).toThrow(
        "Collection name is required",
      );

      expect(() => collection.updateName("   ")).toThrow(
        "Collection name is required",
      );

      expect(() => collection.updateName("a".repeat(101))).toThrow(
        "Collection name must be 100 characters or less",
      );
    });

    it("should maintain other data integrity", () => {
      const originalData = createValidCollectionData();
      const collection = Collection.create(originalData);
      const updatedCollection = collection.updateName("New Name");

      expect(updatedCollection.getDescription()).toBe(
        collection.getDescription(),
      );
      expect(updatedCollection.getOwnerId()).toBe(collection.getOwnerId());
      expect(updatedCollection.getMetadataSchema()).toBe(
        collection.getMetadataSchema(),
      );
      expect(updatedCollection.data.createdAt).toBe(collection.data.createdAt);
    });
  });

  describe("updateDescription", () => {
    it("should update description successfully", () => {
      const collection = Collection.create(createValidCollectionData());
      const originalUpdatedAt = collection.data.updatedAt;

      vi.useFakeTimers();
      vi.setSystemTime(new Date(Date.now() + 1000));

      const updatedCollection = collection.updateDescription("New description");

      expect(collection.getDescription()).toBe(
        "A test collection for unit testing",
      );
      expect(updatedCollection.getDescription()).toBe("New description");
      expect(updatedCollection.data.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );

      vi.useRealTimers();
    });

    it("should allow empty description", () => {
      const collection = Collection.create(createValidCollectionData());

      const updatedCollection = collection.updateDescription("");

      expect(updatedCollection.getDescription()).toBe("");
    });

    it("should reject description longer than 500 characters", () => {
      const collection = Collection.create(createValidCollectionData());
      const longDescription = "a".repeat(501);

      expect(() => collection.updateDescription(longDescription)).toThrow(
        "Collection description must be 500 characters or less",
      );
    });
  });

  describe("updateMetadataSchema", () => {
    it("should update schema successfully", () => {
      const collection = Collection.create(createValidCollectionData());
      const newSchema = MetadataSchema.create({
        priority: {
          type: "number" as MetadataFieldType,
          required: true,
        },
      });

      const updatedCollection = collection.updateMetadataSchema(newSchema);

      expect(collection.getMetadataSchema()).not.toBe(newSchema);
      expect(updatedCollection.getMetadataSchema()).toBe(newSchema);
    });

    it("should maintain data integrity", () => {
      const collection = Collection.create(createValidCollectionData());
      const newSchema = MetadataSchema.create({
        category: {
          type: "text" as MetadataFieldType,
          required: false,
        },
      });

      const updatedCollection = collection.updateMetadataSchema(newSchema);

      expect(updatedCollection.getName()).toBe(collection.getName());
      expect(updatedCollection.getDescription()).toBe(
        collection.getDescription(),
      );
      expect(updatedCollection.getOwnerId()).toBe(collection.getOwnerId());
    });

    it("should reject null schema", () => {
      const collection = Collection.create(createValidCollectionData());

      expect(() =>
        collection.updateMetadataSchema(null as unknown as MetadataSchema),
      ).toThrow("Collection metadataSchema is required");
    });
  });

  describe("business rules", () => {
    it("should enforce name uniqueness per owner (logical)", () => {
      // Note: This is a logical test - actual uniqueness would be enforced
      // at the repository/database level, but the domain model should
      // support this concept

      const user1Id = "user-1";
      const user2Id = "user-2";
      const sameName = "Duplicate Name";

      const collection1 = Collection.create({
        ...createValidCollectionData(),
        name: sameName,
        ownerId: user1Id,
      });

      const collection2 = Collection.create({
        ...createValidCollectionData(),
        name: sameName,
        ownerId: user2Id,
      });

      // Different users can have collections with same name
      expect(collection1.getName()).toBe(sameName);
      expect(collection2.getName()).toBe(sameName);
      expect(collection1.belongsToUser(user1Id)).toBe(true);
      expect(collection2.belongsToUser(user2Id)).toBe(true);
      expect(collection1.belongsToUser(user2Id)).toBe(false);
    });

    it("should maintain schema consistency", () => {
      const schema = createValidMetadataSchema();
      const collection = Collection.create({
        ...createValidCollectionData(),
        metadataSchema: schema,
      });

      // Schema should remain consistent through operations
      expect(collection.getMetadataSchema()).toBe(schema);

      const updatedCollection = collection.updateName("New Name");
      expect(updatedCollection.getMetadataSchema()).toBe(schema);
    });
  });

  describe("belongsToUser", () => {
    it("should correctly identify owner", () => {
      const ownerId = "user-123";
      const collection = Collection.create({
        ...createValidCollectionData(),
        ownerId,
      });

      expect(collection.belongsToUser(ownerId)).toBe(true);
      expect(collection.belongsToUser("different-user")).toBe(false);
      expect(collection.belongsToUser("")).toBe(false);
    });
  });

  describe("fromData", () => {
    it("should create collection from existing data", () => {
      const id = CollectionId.create();
      const schema = createValidMetadataSchema();
      const createdAt = new Date("2023-01-01T00:00:00Z");
      const updatedAt = new Date("2023-01-02T00:00:00Z");

      const data = {
        id,
        name: "Existing Collection",
        description: "From existing data",
        ownerId: "user-456",
        metadataSchema: schema,
        createdAt,
        updatedAt,
      };

      const collection = Collection.fromData(data);

      expect(collection.getId()).toBe(id);
      expect(collection.getName()).toBe("Existing Collection");
      expect(collection.getDescription()).toBe("From existing data");
      expect(collection.getOwnerId()).toBe("user-456");
      expect(collection.getMetadataSchema()).toBe(schema);
      expect(collection.data.createdAt).toBe(createdAt);
      expect(collection.data.updatedAt).toBe(updatedAt);
    });
  });

  describe("immutability", () => {
    it("should not allow direct modification of data", () => {
      const collection = Collection.create(createValidCollectionData());

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (collection.data as any).name = "Modified";
      }).toThrow();
    });

    it("should return new instance on modifications", () => {
      const originalCollection = Collection.create(createValidCollectionData());
      const updatedCollection = originalCollection.updateName("New Name");

      expect(originalCollection).not.toBe(updatedCollection);
      expect(originalCollection.getName()).toBe("Test Collection");
      expect(updatedCollection.getName()).toBe("New Name");
    });

    it("should preserve original when creating new instances", () => {
      const originalData = createValidCollectionData();
      const collection1 = Collection.create(originalData);
      const collection2 = collection1.updateDescription(
        "Different description",
      );
      const collection3 = collection1.updateName("Different name");

      // Original collection should remain unchanged
      expect(collection1.getDescription()).toBe(originalData.description);
      expect(collection1.getName()).toBe(originalData.name);

      // Each modification creates a new instance
      expect(collection2.getDescription()).toBe("Different description");
      expect(collection2.getName()).toBe(originalData.name);

      expect(collection3.getName()).toBe("Different name");
      expect(collection3.getDescription()).toBe(originalData.description);
    });
  });
});
