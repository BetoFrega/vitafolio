import { describe, it, expect, vi } from "vitest";
import { Item } from "./Item";
import { ItemId } from "../value-objects/ItemId";
import { CollectionId } from "../value-objects/CollectionId";
import { MetadataValues } from "../value-objects/MetadataValues";
import {
  MetadataSchema,
  type MetadataFieldType,
} from "../value-objects/MetadataSchema";

describe("Item", () => {
  const createValidMetadataSchema = () => {
    return MetadataSchema.create({
      title: {
        type: "text" as MetadataFieldType,
        required: true,
      },
      priority: {
        type: "number" as MetadataFieldType,
        required: false,
      },
    });
  };

  const createValidMetadataValues = (schema = createValidMetadataSchema()) => {
    return MetadataValues.create(
      {
        title: "Test Title",
        priority: 5,
      },
      schema,
    );
  };

  const createValidItemData = () => ({
    name: "Test Item",
    collectionId: CollectionId.create(),
    ownerId: "user-123",
    metadata: createValidMetadataValues(),
  });

  describe("create", () => {
    it("should create item with valid data", () => {
      const data = createValidItemData();

      const item = Item.create(data);

      expect(item.getName()).toBe("Test Item");
      expect(item.getCollectionId().equals(data.collectionId)).toBe(true);
      expect(item.getOwnerId()).toBe("user-123");
      expect(item.getMetadata()).toBe(data.metadata);
    });

    it("should validate against collection schema", () => {
      const schema = createValidMetadataSchema();
      const validMetadata = MetadataValues.create(
        {
          title: "Required field present",
          priority: 3,
        },
        schema,
      );

      const data = {
        ...createValidItemData(),
        metadata: validMetadata,
      };

      expect(() => Item.create(data)).not.toThrow();
    });

    it("should generate unique ID", () => {
      const data = createValidItemData();

      const item1 = Item.create(data);
      const item2 = Item.create(data);

      expect(item1.getId().getValue()).toBeDefined();
      expect(item2.getId().getValue()).toBeDefined();
      expect(item1.getId().equals(item2.getId())).toBe(false);
    });

    it("should associate with collection", () => {
      const collectionId = CollectionId.create();
      const data = {
        ...createValidItemData(),
        collectionId,
      };

      const item = Item.create(data);

      expect(item.getCollectionId().equals(collectionId)).toBe(true);
      expect(item.belongsToCollection(collectionId)).toBe(true);
    });

    it("should reject invalid metadata", () => {
      const schema = createValidMetadataSchema();

      // This should create invalid metadata that violates schema
      expect(() => {
        const invalidMetadata = MetadataValues.create(
          {
            // missing required 'title' field
            priority: 5,
          },
          schema,
        );

        Item.create({
          ...createValidItemData(),
          metadata: invalidMetadata,
        });
      }).toThrow("Required field 'title' is missing");
    });

    it("should reject invalid name (empty/null)", () => {
      const data = createValidItemData();

      expect(() => Item.create({ ...data, name: "" })).toThrow(
        "Item name is required",
      );

      expect(() => Item.create({ ...data, name: "   " })).toThrow(
        "Item name is required",
      );

      expect(() =>
        Item.create({ ...data, name: null as unknown as string }),
      ).toThrow("Item name is required");
    });

    it("should reject name longer than 200 characters", () => {
      const data = createValidItemData();
      const longName = "a".repeat(201);

      expect(() => Item.create({ ...data, name: longName })).toThrow(
        "Item name must be 200 characters or less",
      );
    });

    it("should require collectionId", () => {
      const data = createValidItemData();

      expect(() =>
        Item.create({ ...data, collectionId: null as unknown as CollectionId }),
      ).toThrow("Item collectionId is required");
    });

    it("should require ownerId", () => {
      const data = createValidItemData();

      expect(() => Item.create({ ...data, ownerId: "" })).toThrow(
        "Item ownerId is required",
      );

      expect(() => Item.create({ ...data, ownerId: "   " })).toThrow(
        "Item ownerId is required",
      );
    });

    it("should require metadata", () => {
      const data = createValidItemData();

      expect(() =>
        Item.create({ ...data, metadata: null as unknown as MetadataValues }),
      ).toThrow("Item metadata is required");
    });

    it("should set creation timestamps", () => {
      const beforeCreation = new Date();

      const item = Item.create(createValidItemData());

      const afterCreation = new Date();

      expect(item.data.createdAt).toBeInstanceOf(Date);
      expect(item.data.updatedAt).toBeInstanceOf(Date);
      expect(item.data.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
      expect(item.data.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime(),
      );
      expect(item.data.updatedAt.getTime()).toBe(item.data.createdAt.getTime());
    });

    it("should accept valid boundary values", () => {
      const data = createValidItemData();

      // Maximum length name (200 characters)
      const maxLengthName = "a".repeat(200);
      expect(() => Item.create({ ...data, name: maxLengthName })).not.toThrow();
    });
  });

  describe("updateName", () => {
    it("should update name successfully", () => {
      const item = Item.create(createValidItemData());
      const originalUpdatedAt = item.data.updatedAt;

      vi.useFakeTimers();
      vi.setSystemTime(new Date(Date.now() + 1000));

      const updatedItem = item.updateName("Updated Item Name");

      expect(item.getName()).toBe("Test Item"); // Original unchanged
      expect(updatedItem.getName()).toBe("Updated Item Name");
      expect(updatedItem.data.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
      expect(updatedItem.getId().equals(item.getId())).toBe(true);

      vi.useRealTimers();
    });

    it("should validate new name", () => {
      const item = Item.create(createValidItemData());

      expect(() => item.updateName("")).toThrow("Item name is required");
      expect(() => item.updateName("   ")).toThrow("Item name is required");
      expect(() => item.updateName("a".repeat(201))).toThrow(
        "Item name must be 200 characters or less",
      );
    });

    it("should maintain other data integrity", () => {
      const originalData = createValidItemData();
      const item = Item.create(originalData);
      const updatedItem = item.updateName("New Name");

      expect(updatedItem.getCollectionId().equals(item.getCollectionId())).toBe(
        true,
      );
      expect(updatedItem.getOwnerId()).toBe(item.getOwnerId());
      expect(updatedItem.getMetadata()).toBe(item.getMetadata());
      expect(updatedItem.data.createdAt).toBe(item.data.createdAt);
    });
  });

  describe("updateMetadata", () => {
    it("should update metadata successfully", () => {
      const schema = createValidMetadataSchema();
      const item = Item.create(createValidItemData());
      const newMetadata = MetadataValues.create(
        {
          title: "Updated Title",
          priority: 10,
        },
        schema,
      );

      const updatedItem = item.updateMetadata(newMetadata, schema);

      expect(item.getMetadata()).not.toBe(newMetadata);
      expect(updatedItem.getMetadata()).toBe(newMetadata);
      expect(updatedItem.getMetadataValue("title")).toBe("Updated Title");
      expect(updatedItem.getMetadataValue("priority")).toBe(10);
    });

    it("should validate against current schema", () => {
      const schema = createValidMetadataSchema();
      const item = Item.create(createValidItemData());

      // Valid metadata
      const validMetadata = MetadataValues.create(
        {
          title: "Valid Title",
        },
        schema,
      );

      expect(() => item.updateMetadata(validMetadata, schema)).not.toThrow();

      // Invalid metadata that violates schema constraints
      expect(() => {
        // Try to create metadata that would violate schema
        const schemaWithConstraints = MetadataSchema.create({
          title: {
            type: "text" as MetadataFieldType,
            required: true,
            validation: {
              minLength: 10,
            },
          },
        });

        const shortTitleMetadata = MetadataValues.create(
          {
            title: "Short", // Too short for new schema
          },
          schemaWithConstraints,
        );

        item.updateMetadata(shortTitleMetadata, schemaWithConstraints);
      }).toThrow();
    });

    it("should preserve item integrity", () => {
      const schema = createValidMetadataSchema();
      const item = Item.create(createValidItemData());
      const newMetadata = MetadataValues.create(
        {
          title: "New Title",
        },
        schema,
      );

      const updatedItem = item.updateMetadata(newMetadata, schema);

      expect(updatedItem.getName()).toBe(item.getName());
      expect(updatedItem.getCollectionId().equals(item.getCollectionId())).toBe(
        true,
      );
      expect(updatedItem.getOwnerId()).toBe(item.getOwnerId());
      expect(updatedItem.getId().equals(item.getId())).toBe(true);
    });

    it("should reject null metadata", () => {
      const schema = createValidMetadataSchema();
      const item = Item.create(createValidItemData());

      expect(() =>
        item.updateMetadata(null as unknown as MetadataValues, schema),
      ).toThrow("Item metadata is required");
    });

    it("should update timestamp", () => {
      const schema = createValidMetadataSchema();
      const item = Item.create(createValidItemData());
      const originalUpdatedAt = item.data.updatedAt;

      vi.useFakeTimers();
      vi.setSystemTime(new Date(Date.now() + 1000));

      const newMetadata = MetadataValues.create(
        {
          title: "Updated",
        },
        schema,
      );

      const updatedItem = item.updateMetadata(newMetadata, schema);

      expect(updatedItem.data.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );

      vi.useRealTimers();
    });
  });

  describe("metadata access methods", () => {
    it("should get metadata value correctly", () => {
      const schema = createValidMetadataSchema();
      const metadata = MetadataValues.create(
        {
          title: "Test Title",
          priority: 5,
        },
        schema,
      );

      const item = Item.create({
        ...createValidItemData(),
        metadata,
      });

      expect(item.getMetadataValue("title")).toBe("Test Title");
      expect(item.getMetadataValue("priority")).toBe(5);
      expect(item.getMetadataValue("nonexistent")).toBeUndefined();
    });

    it("should check metadata value presence", () => {
      const schema = createValidMetadataSchema();
      const metadata = MetadataValues.create(
        {
          title: "Test Title",
        },
        schema,
      );

      const item = Item.create({
        ...createValidItemData(),
        metadata,
      });

      expect(item.hasMetadataValue("title")).toBe(true);
      expect(item.hasMetadataValue("priority")).toBe(false);
      expect(item.hasMetadataValue("nonexistent")).toBe(false);
    });
  });

  describe("belongsToUser", () => {
    it("should correctly identify owner", () => {
      const ownerId = "user-123";
      const item = Item.create({
        ...createValidItemData(),
        ownerId,
      });

      expect(item.belongsToUser(ownerId)).toBe(true);
      expect(item.belongsToUser("different-user")).toBe(false);
      expect(item.belongsToUser("")).toBe(false);
    });
  });

  describe("belongsToCollection", () => {
    it("should correctly identify collection membership", () => {
      const collectionId = CollectionId.create();
      const item = Item.create({
        ...createValidItemData(),
        collectionId,
      });

      expect(item.belongsToCollection(collectionId)).toBe(true);
      expect(item.belongsToCollection(CollectionId.create())).toBe(false);
    });
  });

  describe("fromData", () => {
    it("should create item from existing data", () => {
      const id = ItemId.create();
      const collectionId = CollectionId.create();
      const metadata = createValidMetadataValues();
      const createdAt = new Date("2023-01-01T00:00:00Z");
      const updatedAt = new Date("2023-01-02T00:00:00Z");

      const data = {
        id,
        name: "Existing Item",
        collectionId,
        ownerId: "user-456",
        metadata,
        createdAt,
        updatedAt,
      };

      const item = Item.fromData(data);

      expect(item.getId()).toBe(id);
      expect(item.getName()).toBe("Existing Item");
      expect(item.getCollectionId()).toBe(collectionId);
      expect(item.getOwnerId()).toBe("user-456");
      expect(item.getMetadata()).toBe(metadata);
      expect(item.data.createdAt).toBe(createdAt);
      expect(item.data.updatedAt).toBe(updatedAt);
    });
  });

  describe("immutability", () => {
    it("should not allow direct modification of data", () => {
      const item = Item.create(createValidItemData());

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item.data as any).name = "Modified";
      }).toThrow();
    });

    it("should return new instance on modifications", () => {
      const originalItem = Item.create(createValidItemData());
      const updatedItem = originalItem.updateName("New Name");

      expect(originalItem).not.toBe(updatedItem);
      expect(originalItem.getName()).toBe("Test Item");
      expect(updatedItem.getName()).toBe("New Name");
    });

    it("should preserve original when creating new instances", () => {
      const originalData = createValidItemData();
      const item1 = Item.create(originalData);

      const schema = createValidMetadataSchema();
      const newMetadata = MetadataValues.create(
        {
          title: "Different Title",
        },
        schema,
      );

      const item2 = item1.updateName("Different Name");
      const item3 = item1.updateMetadata(newMetadata, schema);

      // Original item should remain unchanged
      expect(item1.getName()).toBe(originalData.name);
      expect(item1.getMetadataValue("title")).toBe("Test Title");

      // Each modification creates a new instance
      expect(item2.getName()).toBe("Different Name");
      expect(item2.getMetadataValue("title")).toBe("Test Title");

      expect(item3.getName()).toBe(originalData.name);
      expect(item3.getMetadataValue("title")).toBe("Different Title");
    });
  });

  describe("business invariants", () => {
    it("should maintain collection relationship integrity", () => {
      const collectionId = CollectionId.create();
      const item = Item.create({
        ...createValidItemData(),
        collectionId,
      });

      // Item should always belong to the same collection
      const updatedItem = item.updateName("New Name");
      expect(updatedItem.belongsToCollection(collectionId)).toBe(true);
      expect(updatedItem.getCollectionId().equals(collectionId)).toBe(true);
    });

    it("should maintain owner relationship integrity", () => {
      const ownerId = "user-123";
      const item = Item.create({
        ...createValidItemData(),
        ownerId,
      });

      // Item owner should not change through updates
      const updatedItem = item.updateName("New Name");
      expect(updatedItem.belongsToUser(ownerId)).toBe(true);
      expect(updatedItem.getOwnerId()).toBe(ownerId);
    });

    it("should ensure metadata consistency with schema", () => {
      const schema = createValidMetadataSchema();
      const item = Item.create(createValidItemData());

      // Metadata should always be valid against provided schema
      const validMetadata = MetadataValues.create(
        {
          title: "Valid Title",
          priority: 1,
        },
        schema,
      );

      expect(() => item.updateMetadata(validMetadata, schema)).not.toThrow();
    });
  });
});
